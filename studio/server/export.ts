import { createHash } from 'node:crypto';
import type { Workspace } from './model.js';

export interface ExportOptions { includeEvidence?: boolean }
export interface ExportManifest {
  format: 'forward-deployed/1';
  source: { engagementId: string; revision: number; sha256: string };
  includeEvidence: boolean;
  omittedCredentialFields: string[];
  files: { path: string; bytes: number; sha256: string }[];
}

// Select domain data explicitly. Repository ownership, sessions, access tokens and
// provider configuration must never enter an export, even if attached at runtime.
type Shape = true | 'state' | { [key: string]: Shape } | [Shape];
const fields = (...names: string[]): Record<string, Shape> => Object.fromEntries(names.map(name => [name, true]));
const reference: Shape = fields('evidenceId', 'version', 'quote');
const evidence: Shape = fields('id', 'title', 'kind', 'content', 'uri', 'originId', 'occurredAt', 'status', 'participants', 'version');
const opportunity: Shape = {
  ...fields('id', 'title', 'beneficiary', 'currentWorkflow', 'proposedService', 'whyItMatters', 'assumptions', 'version'),
  evidenceRefs: [reference], measures: [fields('name', 'unit', 'baseline', 'target', 'basis')],
};
const requirement: Shape = {
  ...fields('id', 'opportunityId', 'title', 'behavior', 'acceptanceCriteria', 'status', 'version'), evidenceRefs: [reference],
};
const operand: Shape = fields('literal', 'input', 'state');
const condition: Shape = { ...fields('field', 'operator'), value: operand };
const scenario: Shape = {
  ...fields('id', 'opportunityId', 'title', 'goal', 'observableKeys', 'assumptions', 'version'), initialState: 'state',
  actions: [{
    ...fields('id', 'title', 'description', 'response', 'idempotent'), parameters: 'state',
    preconditions: [condition], effects: [{ ...fields('field', 'operation'), value: operand }],
  }],
  checks: [{ ...fields('id', 'label', 'kind', 'requirementId', 'requirementVersion'), condition }],
};
const check: Shape = fields('id', 'label', 'kind', 'passed', 'actual', 'expected', 'requirementId', 'requirementVersion');
const shape: Shape = {
  engagement: fields('id', 'name', 'ambition', 'customer', 'revision', 'createdAt', 'updatedAt'),
  evidence: [evidence], evidenceHistory: [evidence], opportunities: [opportunity], opportunityHistory: [opportunity],
  requirements: [requirement], requirementHistory: [requirement],
  work: [fields('id', 'opportunityId', 'requirementIds', 'title', 'owner', 'status', 'outcome', 'evidence', 'version')],
  scenarios: [scenario], runs: [{
    ...fields('id', 'scenarioId', 'scenarioVersion', 'status', 'parentRunId', 'forkedAtStep', 'createdAt', 'finishedAt'),
    scenario, initialState: 'state', state: 'state', checks: [check], steps: [{
      ...fields('index', 'actionId', 'intentId', 'status', 'message'), inputs: 'state', before: 'state', after: 'state', checks: [check],
    }],
  }],
};
const credentialKey = /^(?:access_?token|refresh_?token|id_?token|api_?key|client_?secret|password|authorization|cookie|private_?key|session_?token)$/i;
function project(value: unknown, spec: Shape, path: string, omitted: string[]): unknown {
  if (value === undefined) return undefined;
  if (spec === true || spec === 'state') {
    if (Array.isArray(value)) return value.map((item, i) => project(item, true, `${path}/${i}`, omitted));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([key]) => {
        if (!credentialKey.test(key)) return true;
        omitted.push(`${path}/${key}`); return false;
      }).map(([key, item]) => [key, project(item, true, `${path}/${key}`, omitted)]));
    }
    return value;
  }
  if (Array.isArray(spec)) return (value as unknown[]).map((item, i) => project(item, spec[0], `${path}/${i}`, omitted));
  return Object.fromEntries(Object.entries(spec).flatMap(([key, child]) => {
    const item = (value as Record<string, unknown>)[key];
    return item === undefined ? [] : [[key, project(item, child, `${path}/${key}`, omitted)]];
  }));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]));
  return value;
}
const json = (value: unknown): string => JSON.stringify(canonical(value), null, 2) + '\n';
const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
// Encode every unsafe UTF-8 byte, including dots, so IDs cannot escape their directory.
function segment(value: string): string {
  const encoded = [...new TextEncoder().encode(value)].map(byte => /[a-z0-9_-]/.test(String.fromCharCode(byte)) ? String.fromCharCode(byte) : `~${byte.toString(16).padStart(2, '0')}`).join('');
  // Prefix avoids Windows device names; encoding capitals avoids case-fold collisions.
  return encoded.length <= 100 && encoded ? `id-${encoded}` : `id-${sha256(value)}`;
}
const md = (value: unknown): string => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/([\\`*_[\]{}()#!|])/g, '\\$1');
function refs(items: { evidenceId: string; version: number; quote: string }[], included: boolean): string {
  return items.map(item => `- Source ${md(item.evidenceId)}, version ${item.version}${included ? `: “${md(item.quote)}”` : ''}`).join('\n');
}

/** Export the caller-authorized workspace. Never reads the application checkout or other engagements. */
export function buildExport(workspace: Workspace, options: ExportOptions = {}) {
  const includeEvidence = options.includeEvidence ?? true;
  const omittedCredentialFields: string[] = [];
  const data = project(workspace, shape, '', omittedCredentialFields) as Workspace;
  if (!includeEvidence) {
    data.evidence = []; data.evidenceHistory = [];
    for (const item of [...data.opportunities, ...(data.opportunityHistory ?? []), ...data.requirements, ...(data.requirementHistory ?? [])]) {
      for (const ref of item.evidenceRefs) ref.quote = '';
    }
    for (const item of data.work) item.evidence = '';
  }
  const directory = `forward-deployed/${segment(data.engagement.id)}`;
  const files: Record<string, string> = {};
  const put = (path: string, content: string) => { files[`${directory}/${path}`] = content.endsWith('\n') ? content : `${content}\n`; };
  const source = { engagementId: data.engagement.id, revision: data.engagement.revision, sha256: sha256(json(data)) };
  put('.gitattributes', '# Preserve exported bytes so manifest checksums survive Git checkout.\n* -text\n');
  put('workspace.json', json(data));
  put('README.md', `# ${md(data.engagement.name)}\n\n${md(data.engagement.ambition)}\n\nCustomer: ${md(data.engagement.customer)}\n\nWorkspace revision: ${data.engagement.revision}\n\n- [Opportunities](opportunities.md): the service to build and the result it should deliver.\n- [Requirements](requirements.md): expected behavior, acceptance criteria and sources.\n- [Delivery](delivery.md): owners, work and recorded results.\n- [Evidence](evidence.md): ${includeEvidence ? 'evidence saved in this workspace, including retained versions.' : 'source IDs only; saved passages are excluded.'}\n- [workspace.json](workspace.json): the complete exported domain data.\n- [scenarios/](scenarios/): executable rehearsal definitions.\n- [runs/](runs/): recorded steps, state and checks.\n\nSource IDs and versions connect requirements, evidence and rehearsals. A rehearsal records behavior under its saved conditions. It does not establish production performance.\n\nThe manifest records SHA-256 checksums for every other file. This export contains no application source, account settings or Git credentials. Saved evidence is limited to this workspace; no meeting connector history is fetched. Review the saved content before sharing.\n`);
  put('opportunities.md', '# Opportunities\n\n' + data.opportunities.map(item => `## ${md(item.title)}\n\nID: ${md(item.id)} · version ${item.version}\n\nFor: ${md(item.beneficiary)}\n\nCurrent workflow: ${md(item.currentWorkflow)}\n\nProposed service: ${md(item.proposedService)}\n\nResult: ${md(item.whyItMatters)}\n\n${item.measures.map(measure => `- ${md(measure.name)} (${md(measure.unit)}): baseline ${measure.baseline ?? 'unrecorded'}, target ${measure.target ?? 'unrecorded'}. ${md(measure.basis)}`).join('\n')}\n\n${item.assumptions.length ? 'Assumptions:\n' + item.assumptions.map(item => `- ${md(item)}`).join('\n') : ''}\n\n${refs(item.evidenceRefs, includeEvidence)}`).join('\n\n'));
  put('requirements.md', '# Requirements\n\n' + data.requirements.map(item => `## ${md(item.title)}\n\nID: ${md(item.id)} · version ${item.version} · ${item.status}\n\nOpportunity: ${md(item.opportunityId)}\n\n${md(item.behavior)}\n\n${item.acceptanceCriteria.map(item => `- ${md(item)}`).join('\n')}\n\n${refs(item.evidenceRefs, includeEvidence)}`).join('\n\n'));
  put('delivery.md', '# Delivery\n\n' + data.work.map(item => `## ${md(item.title)}\n\nID: ${md(item.id)} · version ${item.version} · ${item.status}\n\nOwner: ${md(item.owner || 'Unassigned')}\n\nOpportunity: ${md(item.opportunityId)}\n\nRequirements: ${item.requirementIds.map(md).join(', ') || 'None linked'}\n\nOutcome: ${md(item.outcome)}\n\n${item.evidence ? `Recorded evidence: ${md(item.evidence)}` : ''}`).join('\n\n'));
  put('evidence.md', '# Evidence\n\n' + (includeEvidence ? [...data.evidence, ...(data.evidenceHistory ?? [])].map(item => `## ${md(item.title)}\n\nID: ${md(item.id)} · version ${item.version} · ${item.status}\n\n${item.originId ? `Source ID: ${md(item.originId)}\n\n` : ''}${item.uri ? `Source URL: ${md(item.uri)}\n\n` : ''}${item.occurredAt ? `Date: ${md(item.occurredAt)}\n\n` : ''}${md(item.content)}`).join('\n\n') : 'Saved evidence and quoted passages were excluded from this export. Source IDs and version references remain in workspace.json.'));
  for (const item of data.scenarios) put(`scenarios/${segment(item.id)}.json`, json(item));
  for (const item of data.runs) put(`runs/${segment(item.id)}.json`, json(item));
  const manifest: ExportManifest = {
    format: 'forward-deployed/1', source, includeEvidence, omittedCredentialFields: omittedCredentialFields.sort(),
    files: Object.entries(files).sort(([a], [b]) => a < b ? -1 : 1).map(([path, content]) => ({ path, bytes: new TextEncoder().encode(content).length, sha256: sha256(content) })),
  };
  put('manifest.json', json(manifest));
  return { files, zip: zipFiles(files), filename: `forward-deployed-${segment(data.engagement.id)}-r${data.engagement.revision}.zip`, manifest };
}

/** Prepare text for the host's Git tools; never creates repositories or pushes. */
export function prepareGitExport(workspace: Workspace, options: ExportOptions = {}) {
  const result = buildExport(workspace, options);
  return {
    directory: `forward-deployed/${segment(workspace.engagement.id)}`,
    source: result.manifest.source,
    commitMessage: `docs: export Forward Deployed workspace revision ${workspace.engagement.revision}`,
    files: Object.entries(result.files).sort(([a], [b]) => a < b ? -1 : 1).map(([path, content]) => ({ path, content })),
    instructions: 'Ask the user which repository and branch to use if unspecified. New repositories are private by default. Use the host’s connected Git tools or CLI. Confirm the destination is the user’s project repository. Write only these relative paths; preserve unrelated files and never follow symlinks outside the repository. For updates, remove obsolete generated files only when listed in the previous manifest and unchanged since that export. Commit the provided files with the suggested message and verify the remote commit. This tool has not written or pushed anything.',
  };
}

// ZIP STORE needs no runtime package and works in Node and Workers. Fixed timestamps
// and bytewise ordering make a repeated export identical, including archive bytes.
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  return value >>> 0;
});
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}
function zipFiles(files: Record<string, string>): Uint8Array {
  const chunks: Uint8Array[] = [], directory: Uint8Array[] = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files).sort(([a], [b]) => a < b ? -1 : 1)) {
    const name = new TextEncoder().encode(path), data = new TextEncoder().encode(content), crc = crc32(data);
    if (name.length > 65535 || data.length > 0xffffffff) throw new Error('Export exceeds ZIP limits.');
    const local = new Uint8Array(30 + name.length), view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true); view.setUint16(12, 33, true);
    view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, name.length, true); local.set(name, 30);
    const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x800, true); cv.setUint16(14, 33, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); central.set(name, 46);
    chunks.push(local, data); directory.push(central); offset += local.length + data.length;
  }
  const directorySize = directory.reduce((sum, item) => sum + item.length, 0);
  if (directory.length > 65535 || offset + directorySize > 0xffffffff) throw new Error('Export exceeds ZIP limits.');
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, directory.length, true); view.setUint16(10, directory.length, true); view.setUint32(12, directorySize, true); view.setUint32(16, offset, true);
  const archive = new Uint8Array(offset + directorySize + end.length);
  let cursor = 0; for (const chunk of [...chunks, ...directory, end]) { archive.set(chunk, cursor); cursor += chunk.length; }
  return archive;
}
