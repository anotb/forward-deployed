import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler, localhostHostValidation } from '@modelcontextprotocol/node';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { WorkspaceStore } from './store.js';
import { createStudioMcp } from './mcp.js';
import { executeStudioTool } from './service.js';
import { DomainError } from './model.js';
import { EventService, attachEvents } from './events.js';
import { buildExport } from './export.js';

const databasePath = process.env.FD_DATABASE_PATH ?? resolve(homedir(), '.forward-deployed', 'workspace.sqlite');
const store = new WorkspaceStore(databasePath);
const events = new EventService({ databasePath: `${databasePath}.events`, store });
const stopEvents = events.start();
const port = Number(process.env.PORT ?? 4318);
const origin = `http://127.0.0.1:${port}`;
const formStateSecret = process.env.FD_FORMS_STATE_SECRET ?? randomBytes(32).toString('base64url');
let html: string;
try { html = await readFile(new URL('../studio.html', import.meta.url), 'utf8'); }
catch { html = await readFile(new URL('../dist/studio.html', import.meta.url), 'utf8'); }
const candidate = process.env.FD_CANDIDATE_RUN && process.env.FD_CANDIDATE_ENGAGEMENT
  ? { engagementId: process.env.FD_CANDIDATE_ENGAGEMENT, runId: process.env.FD_CANDIDATE_RUN } : undefined;
const create = () => createStudioMcp({
  store, actor: 'local', html, origin, candidate, formStateSecret,
  attach: (server, actor) => attachEvents(server, events, actor),
  onWrite: (actor, name, write) => { events.publishWorkspaceWrite(actor, name, write); },
});

if (process.argv.includes('--stdio')) {
  await create().connect(new StdioServerTransport());
} else {
  const handler = toNodeHandler(createMcpHandler(() => create(), { maxRequestBodySize: 1_048_576 }));
  const hostAllowed = localhostHostValidation();
  const token = process.env.FD_ACCESS_TOKEN;
  const app = createServer(async (request, response) => {
    const send = (status: number, body: unknown) => { response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); response.end(JSON.stringify(body)); };
    if (!hostAllowed(request, response)) return;
    if (request.headers.origin && ![origin, `http://localhost:${port}`].includes(request.headers.origin)) { send(403, { error: 'Origin not allowed.' }); return; }
    const path = new URL(request.url ?? '/', origin).pathname;
    if (token) {
      const supplied = request.headers.authorization?.replace(/^Bearer /, '') ?? '';
      if (Buffer.byteLength(supplied) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) { send(401, { error: 'Authentication required.' }); return; }
    }
    try {
      if (path === '/mcp') { await handler(request, response); return; }
      if (request.method === 'GET' && path === '/') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" }); response.end(html); return;
      }
      if (request.method === 'GET' && path === '/health') { send(200, { status: 'ok', version: '0.5.0' }); return; }
      if (request.method === 'GET' && path === '/api/engagements') { send(200, { engagements: store.list('local') }); return; }
      if (request.method === 'GET' && path === '/api/profile') { send(200, { id: 'local', name: 'Local workspace' }); return; }
      if ((request.method === 'POST' && path === '/api/export') || (request.method === 'GET' && path.startsWith('/api/export/'))) {
        let args: any;
        if (request.method === 'GET') args = { engagementId: decodeURIComponent(path.slice('/api/export/'.length)), storage: 'saved' };
        else { let body = ''; for await (const chunk of request) { body += chunk; if (body.length > 1_048_576) { send(413, { error: 'This request is too large.' }); return; } } args = JSON.parse(body); args.engagementId ??= args.workspace?.engagement.id; }
        const data = executeStudioTool(store, 'local', 'get_engagement', args);
        const bundle = buildExport(data.workspace, { includeEvidence: args.includeEvidence !== false });
        response.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="${bundle.filename}"`, 'cache-control': 'no-store' }); response.end(bundle.zip); return;
      }
      if (request.method === 'POST' && path.startsWith('/api/tools/')) {
        if (!request.headers['content-type']?.startsWith('application/json')) { send(415, { error: 'Send JSON.' }); return; }
        let size = 0; const chunks: Buffer[] = [];
        for await (const chunk of request) { const data = Buffer.from(chunk); size += data.length; if (size > 1_048_576) { send(413, { error: 'This request is too large.' }); return; } chunks.push(data); }
        const name = decodeURIComponent(path.slice('/api/tools/'.length));
        const result = executeStudioTool(store, 'local', name, JSON.parse(Buffer.concat(chunks).toString()));
        if (result.storage === 'saved') events.publishWorkspaceWrite('local', name, result as any);
        send(200, result); return;
      }
      send(404, { error: 'Not found.' });
    } catch (error) {
      send(error instanceof DomainError && error.code === 'not_found' ? 404 : 400, { error: error instanceof Error ? error.message : 'Could not complete this operation.' });
    }
  });
  app.listen(port, '127.0.0.1', () => process.stderr.write(`Forward Deployed: ${origin}\n`));
  process.once('SIGTERM', () => app.close());
}
process.once('exit', () => { stopEvents(); events.close(); store.close(); });
