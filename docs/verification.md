# Building and checking the package

Python 3.10 or later is needed for source checks and release builds. The installed plugin has no Python runtime dependency.

```text
python scripts/validate_plugin.py
python -m unittest discover -s tests
python scripts/build_release.py --output-dir dist
```

`scripts/validate_plugin.py` checks the package's local structural contract: expected identity and version, consistent host wrappers and catalogs, the intended skill inventory, matching names and nonempty descriptions, local Markdown link targets, and absence of dependencies on source-only resources in installed skills. It also checks OpenAI listing text limits and icon references, Claude name/description limits, XML tags in skill frontmatter, and the exact hosted MCP endpoint without commands or credentials. It is a package-specific structural checker, not a full YAML parser or a substitute for a host's validator.

`tests/test_package.py` tests those checks with valid and deliberately broken fixtures. It checks host manifest separation, identical shared skills, archive paths, missing resources and checksums. Runtime output excludes development material, and build output cannot become a subsequent build input. These tests do not evaluate the usefulness of a recommendation.

`scripts/build_release.py` produces ChatGPT/Codex, Claude Cowork and source ZIPs. Each has one `forward-deployed/` root. The ChatGPT package uses portable `plugin.json` and `mcp.json` with OpenAI metadata and an icon; the Cowork package uses `.claude-plugin/plugin.json` and `.mcp.json`. Both include identical skills and references, README, user guides, license and policies. Source also includes all host wrappers and catalogs, the maintenance reading list, this verification guide, package scripts and tests, and the reviewed Studio source. Installed packages do not include server code or dependencies.

Fixed ZIP metadata and sorted paths make builds repeatable on the same Python/zlib toolchain. The build uses explicit allowlists. Add shared runtime files to `RUNTIME_FIXED` or `RUNTIME_RESOURCES`, host-specific selection to `HOST_FILES`, source-only public files to `SOURCE_FIXED`, and reviewed Studio files to `STUDIO_SOURCE` in `scripts/package_files.py`. New files are not packaged automatically. Generated outputs, screenshots, internal notes, dependencies, `.wrangler` state, environment files and databases are excluded.

The build validates source before writing. SHA-256 sidecars identify the bytes produced; they do not establish provenance, platform acceptance, installed behavior or the quality of a business recommendation. Verify the loaded skills in the destination host and assess their outputs against the task and its evidence.

## Host checks

Validate the Claude manifests explicitly. Passing the repository directory can select its marketplace rather than its plugin:

```text
claude plugin validate .claude-plugin/plugin.json
claude plugin validate .claude-plugin/marketplace.json
```

Also validate the extracted Cowork package's manifest and check that its referenced resources are present. Claude Code validation checks manifest compatibility; a live Cowork import checks account installation and discovery. See [Claude's upload requirements](https://platform.claude.com/docs/en/manage-claude/plugins-api#upload-requirements).

For OpenAI, check marketplace resolution and skill discovery with the installed Codex host, then use the desktop installation flow in the installation guide. The portable manifest follows the [Agent Plugins schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json); listing fields follow the [OpenAI submission reference](https://developers.openai.com/plugins/deploy/submission). Local discovery, upload acceptance and public review are separate checks.

Check the extracted ChatGPT ZIP through the host parser, with a temporary marketplace outside the package pointing at its root. Confirm the returned version, skill inventory and icon paths. Inspect the MCP entries and parser warnings separately: an empty list can indicate unsupported authentication metadata, as described in the [installation guide](installation.md#chatgpt-and-codex). Preserve the portal's authentication configuration and check the hosted connection through the published plugin. The portable package has no `.codex-plugin` fallback. Then validate the extracted Cowork manifest and its `.mcp.json`. Parser checks alone do not establish network connectivity or OAuth behavior.

For Studio source, run `npm ci`, `npm run check`, `npm test` and `npm run build` from `studio/`. Its hosted MCP and browser interface have their own tests. See [Sites deployment](../studio/sites/README.md) for the hosted adapter and [standalone Cloudflare deployment](../studio/cloudflare/README.md) for that optional configuration and [export behavior](export.md) for the file and Git workflow.

In each destination, start a fresh conversation, verify the loaded version, invoke a focused skill and confirm it can read a bundled reference. Use representative tasks to assess behavior after installation.
