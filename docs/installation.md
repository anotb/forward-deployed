# Installation

For ChatGPT and Codex, [install Forward Deployed from the Plugins Directory](https://chatgpt.com/plugins/plugin_asdk_app_6ac9d1460b1481919b7284262bce73fe). For Claude, follow the [Cowork](#claude-cowork) or [Claude Code](#claude-code) instructions below.

The skills are shared across hosts. The plugin also declares an optional hosted Studio at `https://forward-deployed.unsol.dev/connect/mcp` for working with engagement snapshots, Field Lab runs and exports. The build produces a ChatGPT/Codex upload, a Claude Cowork upload, and the complete source package.

| Package | Contents |
|---|---|
| `forward-deployed-<version>-chatgpt.zip` | Portable `plugin.json`, `mcp.json`, OpenAI metadata and icon, skills and references, user guides, license and policies |
| `forward-deployed-<version>-cowork.zip` | `.claude-plugin/plugin.json`, `.mcp.json`, the same skills and references, user guides, license and policies |
| `forward-deployed-<version>-source.zip` | All host manifests and catalogs, shared content, documentation, Studio source, and build/validation tools |

Each ZIP has one `forward-deployed/` root. Upload packages contain no server executable, marketplace catalogs, build scripts or tests. The source repository keeps the host wrappers together; each upload contains its host's manifest and MCP configuration.

## Claude Cowork

Open **Cowork > Customize > Plugins** and use the custom-plugin file upload option. Select the `-cowork.zip` package. Then start a new conversation and select Forward Deployed or ask to use one of its skills.

For distribution from a published Git marketplace, use **Add > Add marketplace** and enter `https://github.com/anotb/forward-deployed`. The repository includes `.claude-plugin/marketplace.json` for that route. Organization admins can also distribute the ZIP through their plugin marketplace.

See [Use plugins in Claude](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) and [Claude's upload requirements](https://platform.claude.com/docs/en/manage-claude/plugins-api#upload-requirements).

## ChatGPT and Codex

Install the published [Forward Deployed plugin](https://chatgpt.com/plugins/plugin_asdk_app_6ac9d1460b1481919b7284262bce73fe) from the Plugins Directory. For source installation and local development, register the GitHub marketplace:

```text
codex plugin marketplace add anotb/forward-deployed
```

For an unpublished local copy, replace `anotb/forward-deployed` with the source directory containing `.agents/plugins/marketplace.json`.

Open the desktop app's **Plugins Directory**, choose **Forward Deployed** as the marketplace source, and install the plugin. Restart the app if the new local source is not visible. The local CLI also supports:

```text
codex plugin add forward-deployed@anotb-forward-deployed
codex plugin list --marketplace anotb-forward-deployed --json
```

The `-chatgpt.zip` is the portable upload package for OpenAI's plugin import/submission flow. Uploading a draft, installing a local plugin, and publishing a directory listing are separate actions. Use the local marketplace for desktop testing before submitting a public listing.

Codex CLI `0.164.0-alpha.11.1` discovers the skills but rejects the OpenAI OAuth extension in portable `mcp.json`, leaving the Studio connection undiscovered during local import. The published marketplace connection works. Use the directory installation for Studio; keep the OAuth metadata in packages submitted to the portal.

See [OpenAI packaging and local installation](https://developers.openai.com/plugins/build/plugins) and [plugin upload and publication](https://developers.openai.com/plugins/deploy/submission).

## Claude Code

Register the GitHub marketplace and install:

```text
claude plugin marketplace add anotb/forward-deployed
claude plugin install forward-deployed@anotb-forward-deployed
claude plugin list
```

Start a new session. `/forward-deployed:get-started` opens the entry skill. A local Claude Code installation is distinct from importing the plugin into your Claude account through Cowork.

See [Claude plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).

## Use the optional Studio

The configured endpoint is `https://forward-deployed.unsol.dev/connect/mcp`. Enable the plugin's `forward-deployed-studio` connection in your host and sign in with ChatGPT. A connected host with MCP Apps support can open the Studio interface; the tools also return structured results for work in chat. Authentication from Claude hosts has not been verified. The [website](https://forward-deployed.unsol.dev) is also available directly.

The website supports local work without sign-in. Sign in with ChatGPT to save or reopen account workspaces. MCP connections use ChatGPT authentication, but connected work remains stateless until you explicitly save it: carry the supplied snapshot between requests and export it when you finish. Connecting the MCP server does not grant it access to a Git repository. [Exporting work](export.md) explains downloads and saving through the host's existing Git access.

The skills work without the Studio connection. Leave its MCP server disabled if you only want the methods and references. To use another Agent Skills host, copy the complete `skills/` directory with its bundled references. No Studio code or local Node/Python process is required by an installed plugin.

OpenAI's GitHub import route currently marks plugins with bundled MCP configuration as desktop-only. Use the plugin portal's remote MCP connection flow for a hosted ChatGPT distribution. See [OpenAI plugin management](https://learn.chatgpt.com/docs/enterprise/plugin-management) and [remote MCP submission](https://developers.openai.com/plugins/deploy/submission).

## Confirm the installed copy

Check the displayed version and start a fresh conversation. Ask the assistant to use `get-started`, then try a focused task that uses a bundled reference. Confirm the expected skill is loaded and the reference is accessible. If using Studio, open a snapshot and export it to check the connection and file flow.

For another Agent Skills host, use its skill-directory installation mechanism. Copy complete skill folders, including references. Install the whole skills directory when using `get-started`, which links to the other skills.
