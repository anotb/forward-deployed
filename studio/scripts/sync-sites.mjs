import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const studio = fileURLToPath(new URL('..', import.meta.url));
const targetArgument = process.argv[2];
if (!targetArgument || process.argv.length !== 3) throw new Error('Usage: node scripts/sync-sites.mjs <initialized-sites-checkout>');
const target = await realpath(resolve(targetArgument));
const hosting = JSON.parse(await readFile(resolve(target, '.openai/hosting.json'), 'utf8'));
if (typeof hosting.project_id !== 'string' || !hosting.project_id.trim()) throw new Error('Initialize this checkout through Sites before syncing application source.');
await readFile(resolve(target, 'package.json'), 'utf8');

const domain = ['model.ts', 'store-contract.ts', 'workspace.ts', 'stateless.ts', 'lab.ts', 'service.ts', 'export.ts', 'mcp.ts', 'review.ts', 'forms.ts', 'extensions.ts'];
const adapter = ['handler.ts', 'store.ts', 'telemetry.ts', 'oauth.ts', 'oauth-store.ts', 'schema.sql'];
const destinationRoot = resolve(target, 'lib/forward-deployed');

async function destination(path) {
  const output = resolve(destinationRoot, path);
  const rel = relative(target, output);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Sync destination must stay inside the Site checkout.');
  let part = target;
  for (const segment of rel.split(sep)) {
    part = resolve(part, segment);
    try { if ((await lstat(part)).isSymbolicLink()) throw new Error(`Refusing a symlink in the sync destination: ${relative(target, part)}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return output;
}

const sources = [
  ...domain.map(name => ({ from: `server/${name}`, to: `server/${name}` })),
  ...adapter.map(name => ({ from: `sites/${name}`, to: `sites/${name}` })),
];
// Validate every destination before building or copying. Existing Site configuration,
// routes, package files, database declarations and migrations are left to the owner.
const outputs = await Promise.all([...sources.map(item => item.to), 'html.ts', 'handle-request.ts'].map(destination));
await import('./build.mjs');
const contents = await Promise.all(sources.map(item => readFile(resolve(studio, item.from), 'utf8')));
const html = await readFile(resolve(studio, 'dist/studio.html'), 'utf8');
contents.push(`export default ${JSON.stringify(html)};\n`);
contents.push(`import { env } from 'cloudflare:workers';
import { handleSitesRequest } from './sites/handler';
import html from './html';

export const handleRequest = (request: Request) => handleSitesRequest(request, env, html);
`);
for (let index = 0; index < outputs.length; index++) {
  await mkdir(dirname(outputs[index]), { recursive: true });
  await writeFile(outputs[index], contents[index]);
}
console.log(`Synced ${outputs.length} application files to lib/forward-deployed. Site settings and migrations were preserved. Follow sites/README.md to configure dependencies, routes and D1.`);
