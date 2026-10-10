# Native Sites hosting

This adapter runs Studio on a Sites-managed Vinext app. Sites supplies ChatGPT sign-in, the native MCP connection and D1. The public connector uses the same ChatGPT identity, with its own OAuth authorization and token endpoints hosted inside the Site. The website supports anonymous stateless work. Saved operations and MCP connections require authentication. Work stays stateless unless the user chooses to save it. Saved records are scoped to the authenticated Site user.

`handleSitesRequest(request, env, html)` accepts the platform request, a D1 binding and the built Studio HTML. It serves the web interface, MCP tools, workspace APIs and ZIP exports. Use it behind Sites dispatch: its identity headers are platform assertions, not a standalone authentication mechanism.

## Set up an existing Site

1. Create or select a Site with the prescribed Vinext starter. Keep its initialized checkout and `.openai/hosting.json`.
2. From this repository's `studio` directory, install dependencies and sync the application:

   ```sh
   npm ci
   node scripts/sync-sites.mjs /path/to/initialized-site
   ```

   The helper builds Studio and copies its shared domain and Sites adapter into `lib/forward-deployed`. Re-running it replaces that generated subtree. It does not change the Site's package manifest, hosting settings, routes, database declarations or migration history.

3. In the Site checkout, install the MCP dependencies:

   ```sh
   npm install @modelcontextprotocol/server@^2.3.1 @modelcontextprotocol/core@^2.3.1 @modelcontextprotocol/ext-apps@2.0.3 @cloudflare/workers-oauth-provider@^1.2.3 zod@^4.3.6
   ```

4. Route the Studio paths through the generated wrapper. For a dedicated Studio Site, `app/[[...path]]/route.ts` can contain:

   ```ts
   import { handleRequest } from '../../lib/forward-deployed/handle-request';

   export const dynamic = 'force-dynamic';
   export const GET = handleRequest;
   export const POST = handleRequest;
   export const DELETE = handleRequest;
   ```

   For a Site with existing routes, integrate `/mcp`, `/connect/*`, `/api/*`, `/login`, `/health`, the OAuth metadata and challenge routes, and the Studio page without replacing unrelated routes.

5. In `.openai/hosting.json`, set `d1` to `"DB"` and add `"mcp"` to the existing `capabilities` array. Preserve `project_id` and all other settings. Leave R2 unchanged; this adapter does not need it.

## Database schema

Add these tables to the Site's existing `db/schema.ts`, preserving any other tables:

```ts
import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const fdWorkspaces = sqliteTable('fd_workspaces', {
  id: text('id').primaryKey().notNull(),
  actor: text('actor').notNull(),
  revision: integer('revision').notNull(),
  summary: text('summary').notNull(),
  document: text('document').notNull(),
}, table => [
  index('fd_workspaces_actor').on(table.actor),
  check('fd_workspaces_revision_positive', sql`${table.revision} >= 1`),
]);

export const fdWriteReceipts = sqliteTable('fd_write_receipts', {
  actor: text('actor').notNull(),
  scope: text('scope').notNull(),
  requestId: text('request_id').notNull(),
  fingerprint: text('fingerprint').notNull(),
  response: text('response').notNull(),
  writeToken: text('write_token').notNull(),
}, table => [primaryKey({ columns: [table.actor, table.scope, table.requestId] })]);

export const fdTelemetryDaily = sqliteTable('fd_telemetry_daily', {
  day: text('day').notNull(),
  tool: text('tool').notNull(),
  storage: text('storage').notNull(),
  result: text('result').notNull(),
  count: integer('count').notNull(),
  latencyMsTotal: integer('latency_ms_total').notNull(),
}, table => [primaryKey({ columns: [table.day, table.tool, table.storage, table.result] })]);

export const fdOAuthStore = sqliteTable('fd_oauth_kv', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at'),
}, table => [index('fd_oauth_kv_expiry').on(table.expiresAt)]);
```

Run `npm run db:generate` and inspect the generated SQL and Drizzle metadata. [schema.sql](schema.sql) describes the adapter's four tables. Keep existing migrations immutable; generate a new migration for later schema changes.

Build with `npm run build`. Apply each pending migration to the local preview using the starter's command, replacing the filename below:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_generated.sql
```

Publish through Sites. Its deployment applies hosted migrations and provisions the managed MCP connection. Verify a connected tool call after publishing; a successful build alone does not establish that connection.

## Public connector

`/connect/mcp` is the connector endpoint for published host packages. It uses OAuth authorization code flow with S256 PKCE. Its authorization, token and registration endpoints live under `/connect/`; metadata is served at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource/connect/mcp`.

The authorization page uses Sites' ChatGPT sign-in, then asks the user to connect the host. Bearer grants retain the same Site identity used by website workspaces. Token records and consent state use the managed D1 database; a separate Worker, KV namespace or identity provider is not needed. Client registrations remain valid across package installs. Access tokens expire after an hour and refresh grants after 30 days.

Hosts can register dynamically. For a published package with a pre-registered client, register its exact callback URL at `/connect/register` with `token_endpoint_auth_method: "none"`, then put the returned public client ID in the package's OAuth configuration. Never put a client secret or access token in the package. The native Sites `/mcp` connection remains separate and continues using platform authentication.

## Runtime settings

- `DB`: Sites-managed D1 binding for saved work, connector authorization state and aggregate usage counts.
- `FD_TELEMETRY=off`: disables usage counts. Individual calls also honor `telemetry: false`, `x-fd-telemetry: off`, DNT and GPC. Counters contain fixed tool names, storage mode, result, count and total latency, never account IDs or workspace content.
- `OPENAI_APP_CHALLENGE`: optional ownership-verification text served at `/.well-known/openai-apps-challenge`. Configure it through Sites runtime settings.

Stateless requests do not save workspace content. Saved mutations use actor-scoped receipts and revision checks, committed together in a D1 transaction. An exact retry returns its original response even after newer writes.
