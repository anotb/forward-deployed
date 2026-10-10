import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Miniflare } from 'miniflare';
import { DomainError } from '../server/model.js';
import { executeStudioTool } from '../server/service.js';
import { executeSavedTool, type SitesDatabase } from '../sites/store.js';

async function setup(t: test.TestContext) {
  const runtime = new Miniflare({ workers: [{ config: {
    name: 'sites-store-test', compatibilityDate: '2026-10-09',
    manifest: { mainModule: 'test.js', modules: { 'test.js': { type: 'esm', contents: 'export default { fetch() { return new Response("test"); } };' } } },
    env: { DB: { type: 'd1', id: 'sites-store-test-db' } },
  } }] });
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database('DB');
  const schema = readFileSync(new URL('../sites/schema.sql', import.meta.url), 'utf8');
  await db.batch(schema.split(';').map(statement => statement.trim()).filter(Boolean).map(statement => db.prepare(statement)));
  return db;
}
const create = { requestId: 'create', name: 'Visit ready', customer: 'Synthetic workshop', ambition: 'Confirm a useful repair visit during the first conversation.' };
function code(expected: string) { return (error: unknown) => error instanceof DomainError && error.code === expected; }
async function evidence(db: SitesDatabase, engagementId: string, expectedRevision = 1, requestId = 'evidence', content = 'We want one conversation to confirm the visit.') {
  return executeSavedTool(db, 'alice', 'add_evidence', { engagementId, expectedRevision, requestId, title: 'Discovery', kind: 'meeting', content });
}

test('Sites D1 creates, reads, lists and searches actor-scoped saved work without caller identity overrides', async t => {
  const db = await setup(t);
  const original = await executeSavedTool(db, 'alice', 'create_engagement', create);
  const id = original.workspace.engagement.id;
  assert.equal(original.storage, 'saved');
  await evidence(db, id);
  const found = await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id });
  assert.equal(found.workspace.evidence.length, 1);
  assert.equal((await executeSavedTool(db, 'alice', 'list_engagements', {})).engagements.length, 1);
  assert.equal((await executeSavedTool(db, 'alice', 'open_studio', { engagementId: id })).workspace.engagement.revision, 2);
  assert.equal((await executeSavedTool(db, 'alice', 'search', { query: 'conversation' })).results.length, 1);
  assert.deepEqual((await executeSavedTool(db, 'bob', 'list_engagements', { actor: 'alice' })).engagements, []);
  assert.deepEqual((await executeSavedTool(db, 'bob', 'search', { query: 'conversation' })).results, []);
  await assert.rejects(executeSavedTool(db, 'bob', 'get_engagement', { engagementId: id, actor: 'alice', workspace: found.workspace }), code('not_found'));
  await assert.rejects(executeSavedTool(db, 'bob', 'add_evidence', { engagementId: id, expectedRevision: 2, requestId: 'steal', title: 'Injected', kind: 'meeting', content: 'Injected', workspace: found.workspace, storage: 'stateless' }), code('not_found'));
  const actual = await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id, workspace: { ...found.workspace, evidence: [] } });
  assert.equal(actual.workspace.evidence.length, 1, 'Saved reads ignore caller-supplied state.');
});

test('Sites D1 exact retries return the original response after newer writes, while conflicting requests fail', async t => {
  const db = await setup(t);
  const first = await executeSavedTool(db, 'alice', 'create_engagement', create);
  const id = first.workspace.engagement.id;
  const saved = await evidence(db, id);
  await evidence(db, id, 2, 'later', 'A later meeting.');
  assert.deepEqual(await executeSavedTool(db, 'alice', 'create_engagement', create), first);
  assert.deepEqual(await evidence(db, id), saved);
  assert.equal((await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id })).workspace.engagement.revision, 3);
  await assert.rejects(evidence(db, id, 1, 'evidence', 'Changed payload.'), code('idempotency_conflict'));
  await assert.rejects(executeSavedTool(db, 'alice', 'create_engagement', { ...create, name: 'Changed name' }), code('idempotency_conflict'));
  await assert.rejects(evidence(db, id, 1, 'stale-new-request'), code('revision_conflict'));
  const secondActor = await executeSavedTool(db, 'bob', 'create_engagement', create);
  assert.notEqual(secondActor.workspace.engagement.id, id);
});

test('Sites D1 concurrent writes at one revision have one winner and leave no loser receipt', async t => {
  const db = await setup(t);
  const created = await executeSavedTool(db, 'alice', 'create_engagement', create);
  const id = created.workspace.engagement.id;
  const writes = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => evidence(db, id, 1, `race-${index}`, `Finding ${index}.`)));
  const winners = writes.filter(result => result.status === 'fulfilled');
  assert.equal(winners.length, 1);
  for (const result of writes) if (result.status === 'rejected') assert.ok(code('revision_conflict')(result.reason));
  const saved = await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id });
  assert.equal(saved.workspace.engagement.revision, 2);
  assert.equal(saved.workspace.evidence.length, 1);
  const count = await db.prepare('SELECT COUNT(*) AS n FROM fd_write_receipts WHERE actor = ? AND scope = ?').bind('alice', id).first<{ n: number }>();
  assert.equal(count!.n, 1);
});

test('Sites D1 simultaneous identical create and mutation retries return one shared result', async t => {
  const db = await setup(t);
  const creates = await Promise.all(Array.from({ length: 6 }, () => executeSavedTool(db, 'alice', 'create_engagement', create)));
  for (const item of creates) assert.deepEqual(item, creates[0]);
  const id = creates[0].workspace.engagement.id;
  const mutations = await Promise.all(Array.from({ length: 6 }, () => evidence(db, id)));
  for (const item of mutations) assert.deepEqual(item, mutations[0]);
  const count = await db.prepare('SELECT COUNT(*) AS n FROM fd_workspaces WHERE actor = ?').bind('alice').first<{ n: number }>();
  assert.equal(count!.n, 1);
  assert.equal((await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id })).workspace.evidence.length, 1);
});

test('Sites D1 rejected domain writes and failed persistence commit neither state nor receipt', async t => {
  const db = await setup(t);
  const original = await executeSavedTool(db, 'alice', 'create_engagement', create);
  const id = original.workspace.engagement.id;
  await assert.rejects(executeSavedTool(db, 'alice', 'add_evidence', { engagementId: id, expectedRevision: 1, requestId: 'bad-domain', id: 'missing-source', content: 'Cannot update missing evidence.' }), code('not_found'));
  await db.prepare("CREATE TRIGGER reject_test_write BEFORE UPDATE ON fd_workspaces WHEN instr(NEW.document, 'ROLLBACK_PROBE') > 0 BEGIN SELECT RAISE(ABORT, 'persistence failure probe'); END").run();
  await assert.rejects(evidence(db, id, 1, 'failed-db', 'ROLLBACK_PROBE'), /persistence failure probe/);
  const state = await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id });
  assert.equal(state.workspace.engagement.revision, 1);
  assert.equal(state.workspace.evidence.length, 0);
  const receipt = await db.prepare('SELECT COUNT(*) AS n FROM fd_write_receipts WHERE actor = ? AND scope = ?').bind('alice', id).first<{ n: number }>();
  assert.equal(receipt!.n, 0);
  await db.prepare('DROP TRIGGER reject_test_write').run();
  const recovered = await evidence(db, id, 1, 'failed-db', 'ROLLBACK_PROBE');
  assert.equal(recovered.workspace.engagement.revision, 2);
});

test('Sites D1 explicit snapshot save is idempotent, creates an independent copy and uses authenticated ownership', async t => {
  const db = await setup(t);
  const original = executeStudioTool(null, 'anonymous', 'create_engagement', { ...create, storage: 'stateless' });
  const args = { requestId: 'save-local-copy', workspace: original.workspace };
  const saves = await Promise.all(Array.from({ length: 4 }, () => executeSavedTool(db, 'alice', 'save_engagement', args)));
  for (const item of saves) assert.deepEqual(item, saves[0]);
  const id = saves[0].workspace.engagement.id;
  assert.notEqual(id, original.workspace.engagement.id);
  await evidence(db, id);
  assert.deepEqual(await executeSavedTool(db, 'alice', 'save_engagement', args), saves[0]);
  assert.equal(original.workspace.evidence.length, 0);
  assert.equal((await executeSavedTool(db, 'alice', 'get_engagement', { engagementId: id })).workspace.evidence.length, 1);
  assert.deepEqual((await executeSavedTool(db, 'bob', 'list_engagements', {})).engagements, []);
  await assert.rejects(executeSavedTool(db, 'alice', 'save_engagement', { ...args, workspace: { ...original.workspace, engagement: { ...original.workspace.engagement, name: 'Different copy' } } }), code('idempotency_conflict'));
});
