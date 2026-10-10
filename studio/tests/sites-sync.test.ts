import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Sites sync copies runnable application source while preserving existing Site configuration and migration history', t => {
  const target = mkdtempSync(join(tmpdir(), 'forward-deployed-sites-sync-'));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  const originals: Record<string, string> = {
    '.openai/hosting.json': JSON.stringify({ project_id: 'fixture-project', d1: null, r2: 'EXISTING_FILES', capabilities: ['existing'] }),
    'package.json': JSON.stringify({ name: 'existing-site', private: true }),
    'drizzle/0000_existing.sql': 'CREATE TABLE existing_records(id TEXT PRIMARY KEY);\n',
    'drizzle/meta/_journal.json': '{"entries":[{"tag":"0000_existing"}]}\n',
    'db/schema.ts': '// Existing table declarations\n',
    'app/route.ts': '// Existing site route\n',
  };
  for (const [path, content] of Object.entries(originals)) {
    const destination = join(target, path);
    mkdirSync(join(destination, '..'), { recursive: true });
    writeFileSync(destination, content);
  }
  const script = fileURLToPath(new URL('../scripts/sync-sites.mjs', import.meta.url));
  execFileSync(process.execPath, [script, target], { encoding: 'utf8', timeout: 30_000 });
  for (const [path, content] of Object.entries(originals)) assert.equal(readFileSync(join(target, path), 'utf8'), content);
  for (const path of ['server/model.ts', 'server/mcp.ts', 'server/stateless.ts', 'sites/store.ts', 'sites/handler.ts', 'sites/telemetry.ts', 'sites/schema.sql']) assert.ok(readFileSync(join(target, 'lib/forward-deployed', path), 'utf8').length > 0);
  const generatedHtml = readFileSync(join(target, 'lib/forward-deployed/html.ts'), 'utf8');
  assert.equal(JSON.parse(generatedHtml.slice('export default '.length).trim().replace(/;$/, '')), readFileSync(new URL('../dist/studio.html', import.meta.url), 'utf8'));
  assert.match(readFileSync(join(target, 'lib/forward-deployed/handle-request.ts'), 'utf8'), /handleSitesRequest\(request, env, html\)/);
  assert.doesNotMatch(readFileSync(join(target, 'lib/forward-deployed/sites/handler.ts'), 'utf8'), /cloudflare:workers|appgprj_/);
});
