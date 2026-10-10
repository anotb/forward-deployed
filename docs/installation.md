# Installation

The skills are shared across hosts. The build produces a ChatGPT/Codex upload, a Claude Cowork upload, and the complete source package.

| Package | Contents |
|---|---|
| `forward-deployed-<version>-chatgpt.zip` | Portable `plugin.json` with OpenAI metadata and icon, skills and references, README, usage/installation guides, license and policies |
| `forward-deployed-<version>-cowork.zip` | `.claude-plugin/plugin.json`, the same skills and references, README, usage/installation guides, license and policies |
| `forward-deployed-<version>-source.zip` | All host manifests and catalogs, shared content, documentation, and build/validation tools |

Each ZIP has one `forward-deployed/` root. Upload packages contain no marketplace catalogs, build scripts, tests, generated showcase outputs or internal evaluations. The source repository keeps the host wrappers together; each upload contains only its host's manifest.

## Claude Cowork

Open **Cowork > Customize > Plugins** and use the custom-plugin file upload option. Select the `-cowork.zip` package. Then start a new conversation and select Forward Deployed or ask to use one of its skills.

For distribution from a published Git marketplace, use **Add > Add marketplace** and enter `https://github.com/anotb/forward-deployed`. The repository includes `.claude-plugin/marketplace.json` for that route. Organization admins can also distribute the ZIP through their plugin marketplace.

See [Use plugins in Claude](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) and [Claude's upload requirements](https://platform.claude.com/docs/en/manage-claude/plugins-api#upload-requirements).

## ChatGPT and Codex

For desktop use, register the GitHub marketplace:

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

## Confirm the installed copy

Check the displayed version and start a fresh conversation. Ask the assistant to use `get-started`, then try a focused task that uses a bundled reference. Confirm the expected skill is loaded and the reference is accessible. Installation and skill discovery do not establish the quality of every subsequent answer.

For another Agent Skills host, use its skill-directory installation mechanism. Copy complete skill folders, including references. Install the whole skills directory when using `get-started`, which links to the other skills.
