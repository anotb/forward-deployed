import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { CallToolResultSchema } from '@modelcontextprotocol/core';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createStudioMcp } from '../server/mcp.js';
import { executeStudioTool } from '../server/service.js';
import { buildExport } from '../server/export.js';
import type { Workspace } from '../server/model.js';

test('MCP HTTP export delivers the complete ZIP as a standard binary embedded resource without the widget', async () => {
  const http = createServer(toNodeHandler(createMcpHandler(() => createStudioMcp({
    store: null, actor: 'anonymous', html: '<html></html>', origin: 'http://localhost',
  }))));
  http.listen(0, '127.0.0.1'); await once(http, 'listening');
  const address = http.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/mcp`;
  const workspace = executeStudioTool(null, 'anonymous', 'create_engagement', {
    requestId: 'create-export-test', name: 'Repair service', customer: 'Workshop', ambition: 'Book a repair in one conversation.',
  }).workspace as Workspace;
  workspace.evidence.push({ id: 'meeting', title: 'Selected meeting passage', kind: 'meeting', content: 'Book a repair before the call ends.', status: 'final', participants: [], version: 1 });
  async function call(includeEvidence = true, storage = 'stateless') {
    const response = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: {
        name: 'export_engagement', arguments: { engagementId: workspace.engagement.id, workspace, storage, includeEvidence },
      } }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    const packet = JSON.parse(response.headers.get('content-type')?.includes('text/event-stream')
      ? body.split('\n').find(line => line.startsWith('data: '))!.slice(6) : body);
    assert.equal(packet.error, undefined);
    return CallToolResultSchema.parse(packet.result);
  }
  try {
    const result = await call(); assert.equal(result.isError, undefined);
    const resource = result.content.find(item => item.type === 'resource');
    assert.ok(resource && resource.type === 'resource' && 'blob' in resource.resource);
    assert.equal(resource.resource.mimeType, 'application/zip');
    const bytes = Buffer.from(resource.resource.blob, 'base64');
    const expected = buildExport(workspace);
    assert.deepEqual(bytes, Buffer.from(expected.zip));
    assert.equal(bytes.readUInt32LE(0), 0x04034b50);
    const digest = createHash('sha256').update(bytes).digest('hex');
    assert.equal(resource.resource.uri, `forward-deployed-export://sha256/${digest}/${expected.filename}`);
    assert.deepEqual((result.structuredContent as any).result.manifest, expected.manifest);
    assert.equal((result._meta!.export as any).blob, resource.resource.blob, 'widget download keeps the same bytes');
    assert.equal(result.content[0].type, 'text', 'manifest remains available as text');
    const again = await call();
    assert.deepEqual(again.content, result.content, 'same export has identical resource bytes and URI');
    const withoutEvidence = await call(false);
    const reduced = withoutEvidence.content.find(item => item.type === 'resource');
    assert.ok(reduced && reduced.type === 'resource' && 'blob' in reduced.resource);
    assert.deepEqual(Buffer.from(reduced.resource.blob, 'base64'), Buffer.from(buildExport(workspace, { includeEvidence: false }).zip));
    assert.notEqual(reduced.resource.uri, resource.resource.uri, 'different bytes receive a different content address');
    const denied = await call(true, 'saved');
    assert.equal(denied.isError, true);
    assert.equal(denied.content.some(item => item.type === 'resource'), false, 'an unauthorized saved export never returns bytes');
  } finally {
    http.closeAllConnections(); await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
  }
});
