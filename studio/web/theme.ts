import { applyDocumentTheme, applyHostStyleVariables, type McpUiHostContext, type McpUiStyles } from '@modelcontextprotocol/ext-apps';

let hostTheme: 'light' | 'dark' | undefined;
let appliedVariables = new Set<string>();
let previousVariables: McpUiStyles | undefined;
let initialized = false;

/** Paint a complete palette before connecting, including when no host theme is supplied. */
export function initializeStudioTheme(embedded: boolean): void {
  if (initialized) return;
  initialized = true;
  document.documentElement.dataset.embedded = String(embedded);
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const applyPreference = () => { if (!hostTheme) applyDocumentTheme(preference.matches ? 'dark' : 'light'); };
  applyPreference();
  preference.addEventListener('change', applyPreference);
}

/** Call with getHostContext() after connect and on hostcontextchanged. */
export function applyStudioHostContext(context: McpUiHostContext | undefined): void {
  if (!context) return;
  const changedTheme = context.theme !== undefined && context.theme !== hostTheme;
  if (context.theme) {
    hostTheme = context.theme;
    applyDocumentTheme(context.theme);
  }
  const variables = context.styles?.variables;
  // Context notifications are shallow-merged by ext-apps. A theme-only update
  // can therefore retain the previous theme's style object; use our new palette
  // until the host supplies fresh variables instead of keeping the stale colors.
  if (changedTheme || (variables && variables !== previousVariables)) {
    for (const key of appliedVariables) document.documentElement.style.removeProperty(key);
    appliedVariables = new Set();
    if (variables && (!changedTheme || variables !== previousVariables)) {
      applyHostStyleVariables(variables);
      appliedVariables = new Set(Object.entries(variables).filter(([, value]) => value !== undefined).map(([key]) => key));
    }
    previousVariables = variables;
  }
  if (context.displayMode) document.documentElement.dataset.displayMode = context.displayMode;
}
