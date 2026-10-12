import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createStudioMcp, STUDIO_URI } from '../server/mcp.js';
import { executeStudioTool } from '../server/service.js';
import { WorkspaceStore } from '../server/store.js';
import type { Workspace } from '../server/model.js';

const secret = 'native-form-test-only-secret-32-bytes-long';
const capabilities = { elicitation: { form: {} }, extensions: { 'openai/elicitation': { form: {} } } };
function client(store: WorkspaceStore | null = null, actor = 'alice', formStateSecret: string | undefined = secret) {
  const handler = createMcpHandler(() => createStudioMcp({ store, actor, html: '<html></html>', origin: 'https://studio.example', formStateSecret }));
  return async (name: string, args: Record<string, unknown>, resume?: { requestState?: string; inputResponses?: unknown }, options: { capabilities?: Record<string, unknown>; method?: string; legacy?: boolean } = {}) => {
    const response = await handler.fetch(new Request('https://studio.example/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': options.legacy ? '2025-11-25' : '2026-07-28', 'Mcp-Method': options.method ?? 'tools/call', ...(!options.method ? { 'Mcp-Name': name } : options.method === 'resources/read' ? { 'Mcp-Name': String(args.uri) } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: options.method ?? 'tools/call', params: {
      ...(options.method ? args : { name, arguments: args }), ...resume,
      ...(!options.legacy ? { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': { name: 'forms-test', version: '1' }, 'io.modelcontextprotocol/clientCapabilities': options.capabilities ?? capabilities } } : {}),
    } }) }));
    const text = await response.text();
    const packet = JSON.parse(response.headers.get('Content-Type')?.includes('text/event-stream') ? text.split('\n').find(line => line.startsWith('data: '))!.slice(6) : text);
    return packet.error ? { rpcError: packet.error } : packet.result;
  };
}
function fixture(store: WorkspaceStore | null = null): Workspace {
  const storage = store ? 'saved' : 'stateless';
  let workspace = executeStudioTool(store, 'alice', 'create_engagement', { name: 'Workshop', customer: 'Synthetic customer', ambition: 'Book a repair', requestId: crypto.randomUUID(), storage }).workspace as Workspace;
  const write = (name: string, args: Record<string, unknown>) => {
    workspace = executeStudioTool(store, 'alice', name, { ...args, engagementId: workspace.engagement.id, expectedRevision: workspace.engagement.revision, requestId: crypto.randomUUID(), storage, ...(!store ? { workspace } : {}) }).workspace;
  };
  write('propose_changes', { title: 'Discovery review', reason: 'Review the supplied meeting findings.', changes: [
    { id: 'first', operation: 'create', kind: 'evidence', recordId: 'source-one', fields: { title: 'First finding', kind: 'meeting', content: 'Operators need a booking before the call ends.' } },
    { id: 'second', operation: 'create', kind: 'evidence', recordId: 'source-two', fields: { title: 'Second finding', kind: 'observation', content: 'An unconfirmed interpretation.' } },
  ] });
  write('shape_opportunity', { title: 'Book a repair', beneficiary: 'Operator', currentWorkflow: 'Phone calls', proposedService: 'Reserve and book', whyItMatters: 'One booking' });
  write('define_rehearsal', { opportunityId: workspace.opportunities[0].id, title: 'Booking', goal: 'Book once', initialState: { slots: 2, booked: false, part: 'pump', privateCost: 50 }, observableKeys: ['slots', 'booked', 'part'], actions: [{ id: 'book', title: 'Book', description: 'Create a simulated booking', parameters: {}, preconditions: [], effects: [{ field: 'booked', operation: 'set', value: { literal: true } }], response: 'success', idempotent: true }], checks: [{ id: 'booked', label: 'Booked', kind: 'outcome', condition: { field: 'booked', operator: 'eq', value: { literal: true } } }], assumptions: ['Synthetic capacity'] });
  write('start_rehearsal', { scenarioId: workspace.scenarios[0].id });
  return workspace;
}
const reviewArgs = (workspace: Workspace, saved = false) => ({ engagementId: workspace.engagement.id, storage: saved ? 'saved' : 'stateless', ...(!saved ? { workspace } : {}), proposalId: workspace.changeProposals![0].id });
const accept = (result: any, key: string, content: unknown) => ({ requestState: result.requestState, inputResponses: { [key]: { action: 'accept', content } } });
const fieldSchema = (result: any, key: string) => result.inputRequests[key].params._meta['openai/elicitation'].requestedSchema;

test('native review uses actual MRTR rich forms, previews source fields and commits only confirmed choices', async () => {
  const workspace = fixture(); const call = client(); const args = reviewArgs(workspace); const snapshot = structuredClone(workspace);
  const choose = await call('review_with_form', args);
  const unconfirmed = await call('review_with_form', args, accept(choose, 'choose', { change_0: 'accept', change_1: 'keep' }));
  const unchecked = await call('review_with_form', args, accept(unconfirmed, 'confirm', { confirm: false }));
  assert.deepEqual(unchecked.structuredContent.workspace, workspace);
  assert.equal(unchecked.structuredContent.result.form.cancelled, true);
  assert.equal(choose.resultType, 'input_required', JSON.stringify(choose));
  assert.deepEqual(choose.inputRequests.choose.params.requestedSchema, { type: 'object', properties: {} });
  assert.match(fieldSchema(choose, 'choose').properties.change_0.description, /Operators need a booking/);
  assert.equal(fieldSchema(choose, 'choose').properties.change_0.default, 'keep');
  const confirm = await call('review_with_form', args, accept(choose, 'choose', { change_0: 'accept', change_1: 'reject' }));
  assert.equal(confirm.resultType, 'input_required', JSON.stringify(confirm));
  assert.match(confirm.inputRequests.confirm.params.message, /Accept First finding/);
  assert.match(confirm.inputRequests.confirm.params.message, /Reject Second finding/);
  assert.deepEqual(workspace, snapshot, 'selection and preview cannot mutate caller snapshot');
  const completed = await call('review_with_form', args, accept(confirm, 'confirm', { confirm: true }));
  assert.equal(completed.isError, undefined, JSON.stringify(completed));
  assert.equal(completed.structuredContent.workspace.evidence.length, 1);
  assert.equal(completed.structuredContent.workspace.evidence[0].id, 'source-one');
  assert.equal(completed.structuredContent.workspace.changeProposals[0].changes[1].status, 'rejected');
  assert.equal(workspace.evidence.length, 0);
});

test('native forms cancel safely, reject malformed values and require both advertised capabilities', async () => {
  const workspace = fixture(); const args = reviewArgs(workspace); const call = client();
  const choose = await call('review_with_form', args);
  for (const action of ['cancel', 'decline']) {
    const stopped = await call('review_with_form', args, { requestState: choose.requestState, inputResponses: { choose: { action } } });
    assert.equal(stopped.structuredContent.result.form.cancelled, true);
    assert.deepEqual(stopped.structuredContent.workspace, workspace);
  }
  for (const content of [{ change_0: 'accept' }, { change_0: 'accept', change_1: 'keep', extra: true }, { change_0: 'invented', change_1: 'keep' }]) {
    const invalid = await call('review_with_form', args, accept(choose, 'choose', content));
    assert.equal(invalid.isError, true);
  }
  for (const caps of [{}, { elicitation: { form: {} } }, { extensions: { 'openai/elicitation': { form: {} } } }]) {
    const fallback = await call('review_with_form', args, undefined, { capabilities: caps });
    assert.equal(fallback.structuredContent.result.form.supported, false);
    assert.deepEqual(fallback._meta.workspace, workspace);
  }
  const legacy = await call('review_with_form', args, undefined, { legacy: true });
  assert.equal(legacy.structuredContent.result.form.supported, false);
  const noKey = await client(null, 'alice', '')('review_with_form', args);
  assert.equal(noKey.structuredContent.result.form.supported, false);
});

test('signed continuation cannot cross identities, arguments, steps or snapshots', async () => {
  const workspace = fixture(); const args = reviewArgs(workspace); const call = client();
  const choose = await call('review_with_form', args);
  const answered = accept(choose, 'choose', { change_0: 'accept', change_1: 'keep' });
  const otherIdentity = await client(null, 'bob')('review_with_form', args, answered);
  assert.ok(otherIdentity.rpcError, JSON.stringify(otherIdentity));
  const tampered = await call('review_with_form', args, { ...answered, requestState: choose.requestState.slice(0, -8) + 'tampered' });
  assert.ok(tampered.rpcError);
  const changedSnapshot = structuredClone(workspace); changedSnapshot.engagement.name = 'Changed';
  assert.equal((await call('review_with_form', { ...args, workspace: changedSnapshot }, answered)).structuredContent.error.code, 'invalid_form_state');
  assert.equal((await call('review_with_form', args, accept(choose, 'confirm', { confirm: true }))).structuredContent.error.code, 'invalid_form_response');
  assert.equal((await call('review_with_form', args, { inputResponses: answered.inputResponses })).structuredContent.error.code, 'invalid_form_state');
  const now = Date.now;
  let expired: any;
  try { Date.now = () => now() - 1_800_000; expired = await call('review_with_form', args); }
  finally { Date.now = now; }
  assert.ok((await call('review_with_form', args, accept(expired, 'choose', { change_0: 'accept', change_1: 'keep' }))).rpcError);
});

test('saved review re-reads revision, rejects stale confirmation and never duplicates replayed writes', async () => {
  const store = new WorkspaceStore();
  try {
    const workspace = fixture(store); const call = client(store); const args = reviewArgs(workspace, true);
    const choose = await call('review_with_form', args);
    const confirm = await call('review_with_form', args, accept(choose, 'choose', { change_0: 'accept', change_1: 'keep' }));
    const complete = await call('review_with_form', args, accept(confirm, 'confirm', { confirm: true }));
    assert.equal(complete.isError, undefined, JSON.stringify(complete));
    const replay = await call('review_with_form', args, accept(confirm, 'confirm', { confirm: true }));
    assert.equal(replay.structuredContent.error.code, 'revision_conflict');
    assert.equal(store.get(workspace.engagement.id, 'alice').evidence.length, 1);
    const other = fixture(store); const otherArgs = reviewArgs(other, true);
    const pending = await call('review_with_form', otherArgs);
    executeStudioTool(store, 'alice', 'add_evidence', { storage: 'saved', engagementId: other.engagement.id, expectedRevision: other.engagement.revision, requestId: 'concurrent', title: 'New meeting', kind: 'meeting', content: 'Changed context' });
    const stale = await call('review_with_form', otherArgs, accept(pending, 'choose', { change_0: 'accept', change_1: 'keep' }));
    assert.equal(stale.structuredContent.error.code, 'revision_conflict');
  } finally { store.close(); }
});

test('experiment form chooses a branch point, edits typed observable conditions and preserves the original', async () => {
  const workspace = fixture(); const call = client(); const args = { engagementId: workspace.engagement.id, workspace, runId: workspace.runs[0].id };
  const choose = await call('experiment_with_form', args);
  assert.equal(choose.resultType, 'input_required', JSON.stringify(choose));
  const edit = await call('experiment_with_form', args, accept(choose, 'choose', { atStep: 0 }));
  const properties = fieldSchema(edit, 'conditions').properties;
  assert.equal(properties.condition_0.type, 'number'); assert.equal(properties.condition_0.default, 2);
  assert.equal(properties.condition_1.type, 'boolean'); assert.equal(properties.condition_2.type, 'string');
  assert.ok(!JSON.stringify(properties).includes('privateCost'));
  const confirm = await call('experiment_with_form', args, accept(edit, 'conditions', { condition_0: 0, condition_1: false, condition_2: 'pump' }));
  assert.match(confirm.inputRequests.confirm.params.message, /slots: 2 → 0/);
  const completed = await call('experiment_with_form', args, accept(confirm, 'confirm', { confirm: true }));
  assert.equal(completed.isError, undefined, JSON.stringify(completed));
  assert.equal(completed.structuredContent.workspace.runs.length, 2);
  assert.equal(completed.structuredContent.workspace.runs[1].state.slots, 0);
  assert.equal(completed.structuredContent.workspace.runs[1].state.privateCost, 50);
  assert.deepEqual(completed.structuredContent.workspace.runs[0], workspace.runs[0]);
});

test('open_studio exposes thread and global entrypoints; record mentions and resource reads stay actor-scoped', async () => {
  const store = new WorkspaceStore();
  try {
    const workspace = fixture(store); const call = client(store);
    const tools = await call('', {}, undefined, { method: 'tools/list' });
    const displayNames = tools.tools.map((tool: any) => String(tool.title ?? tool.annotations?.title ?? tool.name).trim().toLocaleLowerCase());
    assert.equal(displayNames.length, 25, 'Check every public tool exposed by the protocol.');
    assert.equal(new Set(displayNames).size, displayNames.length, 'Public tool display names must be unique in the directory.');
    assert.equal(tools.tools.find((tool: any) => tool.name === 'review_changes').title, 'Apply review decisions');
    assert.equal(tools.tools.find((tool: any) => tool.name === 'review_with_form').title, 'Review changes in a form');
    const discovery = await call('', {}, undefined, { method: 'server/discover' });
    assert.equal(discovery.capabilities.extensions['openai/mentions'].searchTool, 'search_records');
    const open = tools.tools.find((tool: any) => tool.name === 'open_studio');
    assert.equal(open._meta.ui.resourceUri, STUDIO_URI);
    assert.deepEqual(open._meta['openai/ui'].entrypoints, [{ type: 'thread' }, { type: 'global' }]);
    assert.equal((await call('open_studio', {})).isError, undefined);
    const search = tools.tools.find((tool: any) => tool.name === 'search_records');
    assert.equal(search.annotations.readOnlyHint, true); assert.ok(search._meta.ui.visibility.includes('app'));
    const mentions = await call('search_records', { query: 'Book a repair' });
    assert.equal(mentions.structuredContent.items.length, 1);
    const uri = mentions.structuredContent.items[0].uri;
    const read = await call('', { uri }, undefined, { method: 'resources/read' });
    const record = JSON.parse(read.contents[0].text);
    assert.equal(record.engagementId, workspace.engagement.id); assert.match(record.appRelativeUrl, /kind=opportunity/);
    assert.deepEqual((await client(store, 'bob')('search_records', { query: '' })).structuredContent.items, []);
    assert.ok((await client(store, 'bob')('', { uri }, undefined, { method: 'resources/read' })).rpcError);
  } finally { store.close(); }
});
