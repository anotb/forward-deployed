import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildExport, prepareGitExport } from '../server/export.js';
import { executeLab } from '../server/lab.js';
import type { Workspace } from '../server/model.js';

function fixture(): Workspace {
  let workspace: Workspace = {
    engagement: { id: 'engagement', name: 'Repair <script>alert(1)</script>', ambition: 'Arrange a repair in one conversation', customer: 'Workshop', revision: 12, createdAt: '2026-10-10T00:00:00Z', updatedAt: '2026-10-10T01:00:00Z' },
    evidence: [{ id: 'meeting', title: 'Discovery', kind: 'meeting', content: 'Saved passage: reserve one part.', uri: 'https://example.com/meeting', originId: 'meeting-connector-123', status: 'final', participants: ['Operator'], version: 2 }],
    evidenceHistory: [{ id: 'meeting', title: 'Discovery draft', kind: 'meeting', content: 'Saved draft passage.', originId: 'meeting-connector-123', status: 'preliminary', participants: ['Operator'], version: 1 }],
    opportunities: [{ id: 'service', title: 'Repair concierge', beneficiary: 'Operator', currentWorkflow: 'Call three teams', proposedService: 'Book a repair while talking to the customer', whyItMatters: 'A confirmed visit before the call ends', measures: [{ name: 'Handling time', unit: 'minutes', baseline: 20, target: 5, basis: 'Illustrative target' }], assumptions: ['Parts data is accurate'], evidenceRefs: [{ evidenceId: 'meeting', version: 2, quote: 'reserve one part.' }], version: 1 }],
    requirements: [{ id: 'one-part', opportunityId: 'service', title: 'One part', behavior: 'Reserve exactly one part', acceptanceCriteria: ['One reservation'], evidenceRefs: [{ evidenceId: 'meeting', version: 1, quote: 'Saved draft passage.' }], status: 'confirmed', version: 1 }],
    work: [{ id: 'build', opportunityId: 'service', requirementIds: ['one-part'], title: 'Connect inventory', owner: 'Engineer', status: 'active', outcome: 'A working reservation', evidence: 'Saved implementation passage.', version: 1 }],
    scenarios: [], runs: [],
  };
  workspace = executeLab(workspace, 'define_rehearsal', {
    opportunityId: 'service', title: 'Reserve a part', goal: 'One part reserved', initialState: { reservations: 0, secretCost: 29 }, observableKeys: ['reservations'], assumptions: ['One part is available'],
    actions: [{ id: 'reserve', title: 'Reserve', description: 'Reserve the part', parameters: {}, preconditions: [], effects: [{ field: 'reservations', operation: 'increment', value: { literal: 1 } }], response: 'success', idempotent: true }],
    checks: [{ id: 'one', label: 'Exactly one', kind: 'outcome', condition: { field: 'reservations', operator: 'eq', value: { literal: 1 } }, requirementId: 'one-part' }],
  }).workspace;
  workspace = executeLab(workspace, 'start_rehearsal', { scenarioId: workspace.scenarios[0].id }).workspace;
  workspace = executeLab(workspace, 'act_in_rehearsal', { runId: workspace.runs[0].id, actionId: 'reserve', intentId: 'repair-1', inputs: {} }).workspace;
  return executeLab(workspace, 'finish_rehearsal', { runId: workspace.runs[0].id }).workspace;
}

// Independent ZIP reader for the emitted portable STORE format. Verify both the
// central directory and local headers, offsets and CRCs before comparing content.
function unzip(bytes: Uint8Array): Record<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), decoder = new TextDecoder();
  const end = bytes.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  let cursor = view.getUint32(end + 16, true);
  const files: Record<string, string> = {};
  const count = view.getUint16(end + 10, true);
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(cursor, true), 0x02014b50);
    assert.equal(view.getUint16(cursor + 10, true), 0);
    const size = view.getUint32(cursor + 24, true), nameSize = view.getUint16(cursor + 28, true), offset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameSize));
    assert.equal(view.getUint32(offset, true), 0x04034b50);
    assert.equal(view.getUint16(offset + 6, true), 0x800);
    assert.equal(decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameSize)), name);
    const data = bytes.subarray(offset + 30 + nameSize, offset + 30 + nameSize + size);
    assert.equal(crc32(data), view.getUint32(cursor + 16, true));
    assert.equal(crc32(data), view.getUint32(offset + 14, true));
    files[name] = decoder.decode(data);
    cursor += 46 + nameSize;
  }
  assert.equal(cursor, end);
  return files;
}

test('portable export preserves domain data, immutable source versions, run state, Unicode and checksums', () => {
  const workspace = fixture(); workspace.engagement.customer = 'Atelier café – 東京';
  const result = buildExport(workspace);
  assert.deepEqual(unzip(result.zip), result.files);
  const [path, content] = Object.entries(result.files).find(([path]) => path.endsWith('/workspace.json'))!;
  assert.deepEqual(JSON.parse(content), workspace);
  assert.equal(result.manifest.source.sha256, createHash('sha256').update(content).digest('hex'));
  assert.equal(result.manifest.files.length, Object.keys(result.files).length - 1);
  for (const item of result.manifest.files) {
    assert.equal(item.bytes, Buffer.byteLength(result.files[item.path]));
    assert.equal(item.sha256, createHash('sha256').update(result.files[item.path]).digest('hex'));
  }
  assert.equal(JSON.parse(content).runs[0].checks[0].requirementVersion, 1);
  assert.match(result.files[path.replace('workspace.json', 'evidence.md')], /meeting-connector-123/);
  assert.match(result.files[path.replace('workspace.json', 'evidence.md')], /version 1/);
  assert.deepEqual(buildExport(workspace).zip, result.zip, 'same snapshot produces identical bytes');
  assert.match(result.filename, /r12\.zip$/);
});

test('evidence opt-out removes saved passages and quotes without mutating the workspace or losing source references', () => {
  const workspace = fixture(), before = structuredClone(workspace);
  const result = buildExport(workspace, { includeEvidence: false });
  const data = JSON.parse(Object.entries(result.files).find(([path]) => path.endsWith('/workspace.json'))![1]);
  assert.deepEqual(data.evidence, []); assert.deepEqual(data.evidenceHistory, []);
  assert.deepEqual(data.requirements[0].evidenceRefs, [{ evidenceId: 'meeting', version: 1, quote: '' }]);
  assert.equal(data.work[0].evidence, '');
  assert.equal(Object.values(result.files).some(content => /Saved (draft |implementation )?passage/.test(content)), false);
  assert.deepEqual(workspace, before);
  assert.notEqual(result.manifest.source.sha256, buildExport(workspace).manifest.source.sha256);
});

test('paths remain portable and namespaced; Markdown escapes embedded HTML; runtime credentials are excluded', () => {
  const workspace = fixture();
  workspace.engagement.id = '../../evil\\drive:C'; workspace.scenarios[0].id = 'CON'; workspace.runs[0].id = 'A';
  const lowerRun = structuredClone(workspace.runs[0]); lowerRun.id = 'a'; workspace.runs.push(lowerRun);
  Object.assign(workspace, { accessToken: 'workspace-token', owner: { password: 'account-password' }, internalNotes: 'application-notes' });
  Object.assign(workspace.engagement, { apiKey: 'engagement-key' });
  Object.assign(workspace.scenarios[0].initialState, { access_token: 'state-token' });
  const result = buildExport(workspace);
  for (const path of Object.keys(result.files)) {
    assert.equal(path.startsWith('forward-deployed/id-'), true);
    assert.equal(path.includes('..') || path.includes('\\') || path.includes(':'), false);
  }
  assert.equal(new Set(Object.keys(result.files).map(path => path.toLowerCase())).size, Object.keys(result.files).length);
  assert.equal(Object.values(result.files).some(content => /workspace-token|account-password|application-notes|engagement-key|state-token/.test(content)), false);
  assert.ok(result.manifest.omittedCredentialFields.includes('/scenarios/0/initialState/access_token'));
  const readme = Object.entries(result.files).find(([path]) => path.endsWith('/README.md'))![1];
  assert.equal(readme.includes('<script>'), false); assert.match(readme, /&lt;script&gt;/);
  // Hidden synthetic lab state is domain data, not an execution credential.
  assert.ok(Object.values(result.files).some(content => content.includes('secretCost')));
});

test('Git handoff commits, pushes and clones exact export bytes in a private local test repository', () => {
  const base = mkdtempSync(join(tmpdir(), 'forward-deployed-export-'));
  const remote = join(base, 'remote.git'), working = join(base, 'working'), clone = join(base, 'clone');
  const git = (args: string[], cwd = base) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  try {
    git(['init', '--bare', '--initial-branch=main', remote]);
    git(['init', '--initial-branch=main', working]);
    git(['config', 'user.name', 'Export Test'], working); git(['config', 'user.email', 'export-test@example.invalid'], working);
    git(['config', 'core.autocrlf', 'false'], working);
    writeFileSync(join(working, 'unrelated.txt'), 'Keep this file.');
    const workspace = fixture(), exported = prepareGitExport(workspace);
    for (const file of exported.files) { const path = join(working, file.path); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, file.content, 'utf8'); }
    git(['add', '--', 'unrelated.txt', exported.directory], working);
    git(['commit', '-m', exported.commitMessage], working);
    git(['remote', 'add', 'origin', remote], working); git(['push', '-u', 'origin', 'main'], working);
    git(['clone', '--', remote, clone]);
    for (const file of exported.files) assert.equal(readFileSync(join(clone, file.path), 'utf8'), file.content);
    assert.equal(readFileSync(join(clone, 'unrelated.txt'), 'utf8'), 'Keep this file.');
    assert.equal(git(['rev-parse', 'HEAD'], working), git(['rev-parse', 'HEAD'], clone));
    workspace.engagement.revision++;
    workspace.work[0].status = 'done';
    const updated = prepareGitExport(workspace);
    assert.deepEqual(updated.files.map(file => file.path), exported.files.map(file => file.path), 'updates use stable paths');
    for (const file of updated.files) writeFileSync(join(working, file.path), file.content, 'utf8');
    git(['add', '--', updated.directory], working); git(['commit', '-m', updated.commitMessage], working); git(['push'], working); git(['pull', '--ff-only'], clone);
    for (const file of updated.files) assert.equal(readFileSync(join(clone, file.path), 'utf8'), file.content);
    assert.equal(readFileSync(join(clone, 'unrelated.txt'), 'utf8'), 'Keep this file.');
    assert.equal(git(['rev-list', '--count', 'HEAD'], clone).trim(), '2');
    // Validate with the host's independent archive reader as well as the format assertions above.
    if (process.platform === 'win32') {
      const zip = join(base, 'export.zip'), extracted = join(base, 'extracted');
      writeFileSync(zip, buildExport(workspace).zip); mkdirSync(extracted);
      execFileSync('tar', ['-xf', zip, '-C', extracted], { windowsHide: true });
      for (const file of updated.files) assert.equal(readFileSync(join(extracted, file.path), 'utf8'), file.content);
    }
  } finally {
    assert.ok(resolve(base).startsWith(resolve(tmpdir()) + sep));
    rmSync(base, { recursive: true, force: true });
  }
});
