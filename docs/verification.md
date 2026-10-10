# Building and checking the package

Python 3.10 or later is needed for source checks and release builds. The installed plugin has no Python runtime dependency.

```text
python scripts/validate_plugin.py
python -m unittest discover -s tests
python scripts/build_release.py --output-dir dist
```

`scripts/validate_plugin.py` checks the package's local structural contract: expected identity and version, consistent host wrappers and catalogs, the intended skill inventory, matching names and nonempty descriptions, local Markdown link targets, and absence of dependencies on source-only resources in installed skills. It also checks OpenAI listing text limits and icon references, Claude name/description limits, and XML tags in skill frontmatter. It is a package-specific structural checker, not a full YAML parser or a substitute for a host's validator.

`tests/test_package.py` tests those checks with valid and deliberately broken fixtures. It checks host manifest separation, identical shared skills, archive paths, missing resources and checksums. Runtime output excludes development material, and build output cannot become a subsequent build input. These tests do not evaluate the usefulness of a recommendation.

`scripts/build_release.py` produces ChatGPT/Codex, Claude Cowork and source ZIPs. Each has one `forward-deployed/` root. The ChatGPT package uses portable `plugin.json` with OpenAI metadata and an icon; the Cowork package uses `.claude-plugin/plugin.json`. Both include identical skills and references, README, installation/usage guides, license and policies. Source also includes all host wrappers and catalogs, further reading, this guide, and the package scripts and tests.

Fixed ZIP metadata and sorted paths make builds repeatable on the same Python/zlib toolchain. The build uses explicit allowlists. Add shared runtime files to `RUNTIME_FIXED` or `RUNTIME_RESOURCES`, host-specific selection to `HOST_FILES`, and source-only public files to `SOURCE_FIXED` in `scripts/package_files.py`. A file added under docs or references is not packaged automatically. Generated case studies, decks, demonstration sites and private evaluations are excluded.

The build validates source before writing. SHA-256 sidecars identify the bytes produced; they do not establish provenance, platform acceptance, installed behavior or the quality of a business recommendation. Verify the loaded skills in the destination host and assess their outputs against the task and its evidence.

## Host checks

Validate the Claude manifests explicitly. Passing the repository directory can select its marketplace rather than its plugin:

```text
claude plugin validate .claude-plugin/plugin.json
claude plugin validate .claude-plugin/marketplace.json
```

Also validate the extracted Cowork package's manifest and check that its referenced resources are present. Claude Code validation checks manifest compatibility; a live Cowork import checks account installation and discovery. See [Claude's upload requirements](https://platform.claude.com/docs/en/manage-claude/plugins-api#upload-requirements).

For OpenAI, check marketplace resolution and skill discovery with the installed Codex host, then use the desktop installation flow in the installation guide. The portable manifest follows the [Agent Plugins schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json); listing fields follow the [OpenAI submission reference](https://developers.openai.com/plugins/deploy/submission). Local discovery, upload acceptance and public review are separate checks.

In each destination, start a fresh conversation, verify the loaded version, invoke a focused skill and confirm it can read a bundled reference. Use representative tasks to assess behavior after installation.
