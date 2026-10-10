# Cloudflare deployment

The Worker serves the MCP endpoint and website. Work is stateless by default: each request supplies its workspace snapshot and receives the updated snapshot. This path works without a sign-in, database, or Durable Object call. The browser keeps its active snapshot in the current browser session, including through a sign-in round trip.

Saved workspaces are optional. OAuth authenticates MCP clients; the website uses an HttpOnly account session. Explicit saved operations reach the same account's SQLite Durable Object. No public account, shared access token, or GitHub repository permission is used.

Build the Studio first. `dist/assets/studio.html` must be self-contained; only `dist/assets` is published by the asset binding.

```sh
npm run build
npx wrangler whoami
npx wrangler kv namespace create OAUTH_KV
```

Set the returned namespace ID in `wrangler.jsonc`. The configured domain is `forward-deployed.unsol.dev`.

GitHub identity is the fallback when Sign in with ChatGPT client registration is unavailable. Register a GitHub OAuth app with the homepage `https://forward-deployed.unsol.dev` and callback `https://forward-deployed.unsol.dev/auth/github/callback`. Install its credentials through Worker secrets:

```sh
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

MCP URL: `https://forward-deployed.unsol.dev/mcp`. Anonymous calls can work on supplied snapshots. Saved operations require sign-in; OAuthProvider publishes protected-resource and authorization-server metadata, dynamic client registration, and PKCE endpoints. The sign-in flow requests no GitHub scopes and discards its upstream token after reading the profile. Sign-in remains unavailable until both credentials are configured; stateless work remains available.

MCP Events subscriptions and pending deliveries are stored in the same account's Durable Object. Alarms deliver signed callbacks and retry failures. Keep `global_fetch_strictly_public` enabled: it provides the runtime DNS boundary for callback delivery and client metadata fetching.

Download a stateless snapshot through `POST /api/export` with `{ "workspace": ... }`. The authenticated saved-workspace endpoint is `GET /api/export/{engagementId}`. Exports include evidence already present in the snapshot; `includeEvidence: false` (POST body) or `?includeEvidence=false` (GET query) omits those excerpts.

Optional Analytics Engine counters contain only fixed tool names, storage mode, result category, call count and elapsed milliseconds. They contain no account, IP, project, source text, URL or request payload. No browser analytics library or tracking cookie is installed. Set `FD_TELEMETRY=off`, omit the `TELEMETRY` binding, pass tool argument `telemetry: false`, or send `x-fd-telemetry: off`, `DNT: 1`, or `Sec-GPC: 1` to opt out. Worker request log storage is disabled in the deployment configuration.

To inspect usage, open the `forward_deployed_usage` dataset in Cloudflare Analytics Engine. `blob1` is the tool, `blob2` the storage mode and `blob3` the result category. `double1` is call count and `double2` is elapsed milliseconds. A daily summary query, accounting for Analytics Engine sampling:

```sql
SELECT formatDateTime(timestamp, '%Y-%m-%d') AS day, blob1 AS tool, blob2 AS storage,
       blob3 AS result, SUM(_sample_interval * double1) AS calls,
       SUM(_sample_interval * double2) / SUM(_sample_interval) AS mean_ms
FROM forward_deployed_usage
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY day, tool, storage, result
ORDER BY day DESC, calls DESC
```

See the [Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) for query access and sampling behavior.

`npm test` includes workerd coverage of stateless work with no database bindings, OAuth, account isolation, export access, event subscription, and alarm delivery using a mocked GitHub identity provider. Deployment verification must also exercise the real provider and the final domain.
