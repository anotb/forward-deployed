import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(resolve(root, 'dist'), { recursive: true });
const client = await build({ entryPoints: [resolve(root, 'web/main.ts')], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022', minify: true });
const css = await readFile(resolve(root, 'web/style.css'), 'utf8');
let html = await readFile(resolve(root, 'web/index.html'), 'utf8');
html = html.replace(/<link[^>]*href=["']\.\/style\.css["'][^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script[^>]*src=["']\.\/main\.ts["'][^>]*><\/script>/, () => `<script>${client.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
await writeFile(resolve(root, 'dist/studio.html'), html);
await mkdir(resolve(root, 'dist/assets'), { recursive: true });
await writeFile(resolve(root, 'dist/assets/studio.html'), html);
await build({ entryPoints: [resolve(root, 'server/main.ts')], bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node24', outfile: resolve(root, 'dist/server/main.js') });
console.log('Built the workspace and MCP server.');
