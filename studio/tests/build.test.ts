import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import test from 'node:test';

test('the shipped self-contained page contains one intact executable UI bundle', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });
  const html = readFileSync(new URL('../dist/assets/studio.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<!doctype html>/gi) ?? []).length, 1);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  assert.ok(scripts[0][1].includes('Forward Deployed'));
  assert.ok(!html.includes('src="./main.ts"'));
  assert.equal(html, readFileSync(new URL('../dist/studio.html', import.meta.url), 'utf8'));
});
