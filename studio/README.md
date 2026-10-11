# Forward Deployed workspace

An optional workspace and MCP server for discovery, service design and executable Field Lab rehearsals. The agent develops the service; the server preserves evidence links, validates writes and runs the proposed actions against explicit state.

## Run locally

Requires Node.js 24 or later.

```sh
cd studio
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4318`. The MCP endpoint is `/mcp`. To use stdio, run `node dist/server/main.js --stdio` from this directory.

The HTTP server binds to loopback. Stateless requests carry their own workspace. Explicit saved operations use SQLite at `~/.forward-deployed/workspace.sqlite`; `FD_DATABASE_PATH` changes that path. `PORT` changes the HTTP port. `FD_ACCESS_TOKEN` optionally protects the local HTTP server. The hosted application uses the [ChatGPT Sites adapter](sites/README.md), with managed sign-in and D1 storage. The [Cloudflare adapter](cloudflare/README.md) is available for deployments that manage their own infrastructure.

## Work with it

Create an engagement, add selected meeting or document passages, develop opportunities, define requirements and plan delivery work. Source quotations are checked against the referenced evidence version. Revisions and request IDs protect saved writes from stale updates and duplicate retries.

Field Lab scenarios define typed state, observable fields, available actions, preconditions, effects and outcome checks. An agent executes actions through the tools, observes the result and can fork a prior step to try a different route. Each run preserves its scenario and requirement versions. No supplied JavaScript or other code is executed. A rehearsal verifies the supplied model of a service, not an external customer system.

The browser and embedded MCP App use the same tools. The host's Meetings connector supplies selected source material when available; this server has no independent access to meeting accounts. [Exports](../docs/export.md) contain readable files, structured data and checksums. A Git handoff prepares files for the host's repository tools and does not push automatically.

Stateless is the default, including on authenticated connections. Pass the returned workspace snapshot on the next call. Saved work requires an explicit storage choice and, on the hosted service, sign-in. The local and standalone Cloudflare adapters support MCP Events with signed callbacks. The Sites adapter does not advertise Events because its supported runtime does not provide an autonomous retry scheduler. Delivery work remains separate from simulated outcome checks.

## Native host extensions

The MCP server declares workspace entrypoints, selection context, saved-record mentions and deep links. `review_with_form` and `experiment_with_form` use MCP multi-round elicitation with OpenAI extended forms when advertised by the client. Otherwise they return the workspace interface. Protocol tests verify continuation handling; rendering and availability depend on the connected host.

Set `FD_FORMS_STATE_SECRET` to a random secret of at least 32 bytes in hosted runtime settings. Use the same value across instances. It signs form continuations, binds them to the actor and request, and is never sent to the UI. Rotating it expires pending forms. The local Node server generates an ephemeral process key if the variable is absent; hosted adapters fall back to workspace controls without a configured secret.

## Verification

```sh
npm run check
npm test
npm run build
```

Tests cover source/version links, rollback and retry behavior, account isolation, stateless continuation, scenario transitions and forks, exports, OAuth with a test identity provider, and signed event delivery. Live provider and AI-host acceptance must be verified separately when deploying.
