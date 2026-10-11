import assert from 'node:assert/strict';
import test from 'node:test';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { applyStudioHostContext, initializeStudioTheme } from '../web/theme.js';

test('theme follows OS until host override, applies host palettes and clears only stale host variables', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const attributes = new Map<string, string>();
  const variables = new Map<string, string>([['--unrelated-project-value', 'preserved']]);
  const style = { colorScheme: '', setProperty: (key: string, value: string) => variables.set(key, value), removeProperty: (key: string) => variables.delete(key) };
  let notifyPreference = () => {};
  let subscriptions = 0;
  const preference = { matches: true, addEventListener: (event: string, handler: () => void) => { assert.equal(event, 'change'); notifyPreference = handler; subscriptions++; } };
  const element = { dataset: {} as Record<string, string>, style, setAttribute: (key: string, value: string) => attributes.set(key, value) };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: element } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia: (query: string) => { assert.equal(query, '(prefers-color-scheme: dark)'); return preference; } } });
  try {
    initializeStudioTheme(true);
    assert.equal(element.dataset.embedded, 'true');
    assert.equal(attributes.get('data-theme'), 'dark');
    assert.equal(style.colorScheme, 'dark', 'Native controls receive the same scheme as app content.');
    initializeStudioTheme(true);
    assert.equal(subscriptions, 1, 'Reinitialization does not leak media-query listeners.');
    preference.matches = false; notifyPreference();
    assert.equal(attributes.get('data-theme'), 'light', 'OS changes apply while the host has not supplied a theme.');
    applyStudioHostContext(undefined);
    const dark = { theme: 'dark', displayMode: 'inline', styles: { variables: { '--color-background-primary': '#171717', '--color-text-primary': '#fafafa', '--color-text-secondary': '#bdbdbd' } } } as McpUiHostContext;
    applyStudioHostContext(dark);
    assert.equal(attributes.get('data-theme'), 'dark');
    assert.equal(variables.get('--color-background-primary'), '#171717');
    assert.equal(variables.get('--color-text-primary'), '#fafafa');
    assert.equal(element.dataset.displayMode, 'inline');
    notifyPreference();
    assert.equal(attributes.get('data-theme'), 'dark', 'OS preference must not override the connected host.');
    applyStudioHostContext({ ...dark, locale: 'fr-FR' });
    assert.equal(variables.get('--color-text-primary'), '#fafafa', 'A partial locale notification preserves the current host palette.');
    applyStudioHostContext({ ...dark, theme: 'light' });
    assert.equal(attributes.get('data-theme'), 'light');
    assert.equal(variables.has('--color-background-primary'), false, 'A theme-only change cannot retain dark host variables under the light palette.');
    assert.equal(variables.has('--color-text-primary'), false);
    assert.equal(variables.get('--unrelated-project-value'), 'preserved', 'Do not remove unrelated inline styles.');
    applyStudioHostContext({ ...dark, theme: 'light', locale: 'en-US' });
    assert.equal(variables.has('--color-text-primary'), false, 'Repeating the shallow-merged context does not resurrect its stale palette.');
    const light = { theme: 'light', styles: { variables: { '--color-background-primary': '#ffffff', '--color-text-primary': '#171717' } } } as McpUiHostContext;
    applyStudioHostContext(light);
    assert.equal(variables.get('--color-background-primary'), '#ffffff');
    assert.equal(variables.get('--color-text-primary'), '#171717');
    assert.equal(variables.has('--color-text-secondary'), false, 'Omitted host variables return to theme-appropriate fallbacks.');
    applyStudioHostContext({ ...light, theme: 'dark', displayMode: 'fullscreen' });
    assert.equal(attributes.get('data-theme'), 'dark');
    assert.equal(variables.has('--color-text-primary'), false);
    assert.equal(element.dataset.displayMode, 'fullscreen');
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
