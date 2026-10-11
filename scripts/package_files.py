"""Explicit source and runtime selection; installed packages use a hosted MCP."""
from pathlib import Path

RUNTIME_FIXED = {
    'plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json',
    'README.md', 'LICENSE', 'PRIVACY.md', 'TERMS.md',
    'docs/installation.md', 'docs/usage.md', 'docs/export.md', 'assets/icon.svg',
    'mcp.json', '.mcp.json',
}
HOST_MANIFESTS = {'plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json'}
HOST_MCP_FILES = {'mcp.json', '.mcp.json'}
HOST_FILES = {
    'chatgpt': (RUNTIME_FIXED - HOST_MANIFESTS - HOST_MCP_FILES) | {'plugin.json', 'mcp.json'},
    'cowork': (RUNTIME_FIXED - HOST_MANIFESTS - HOST_MCP_FILES - {'assets/icon.svg'}) | {'.claude-plugin/plugin.json', '.mcp.json'},
}
RUNTIME_RESOURCES = {
    'skills/adoption-and-scale/references/workforce-practice.md',
    'skills/adoption-and-scale/references/workflow-adoption.md',
    'skills/adoption-and-scale/references/expansion.md',
    'skills/capability-exploration/references/workbench-probe.md',
    'skills/context-design/references/applicable-evidence.md',
    'skills/discovery/references/service-case-reconstruction.md',
    'skills/enterprise-engagement/references/quotation-engagement.md',
    'skills/enterprise-integration/references/uncertain-write.md',
    'skills/evaluate-and-improve/references/diagnosis-from-traces.md',
    'skills/executive-communication/references/evidence-to-decision.md',
    'skills/field-productization/references/covenant-review-boundary.md',
    'skills/meeting-synthesis/references/meeting-to-plan.md',
    'skills/opportunity-design/references/equipment-options.md',
    'skills/solution-design/references/supplier-delay.md',
    'skills/technical-delivery/references/quote-service-handoff.md',
    'skills/use-case-portfolio/references/constrained-allocation.md',
    'skills/value-case/references/service-economics.md',
}
STUDIO_SOURCE = {
    'studio/README.md', 'studio/package.json', 'studio/package-lock.json',
    'studio/tsconfig.json', 'studio/tsconfig.worker.json', 'studio/wrangler.jsonc',
    'studio/scripts/build.mjs', 'studio/scripts/sync-sites.mjs',
    'studio/web/index.html', 'studio/web/main.ts', 'studio/web/style.css',
    'studio/web/forms.ts', 'studio/web/review.ts', 'studio/web/selection.ts',
    'studio/web/sample.ts', 'studio/tests/sample.test.ts', 'studio/web/theme.ts', 'studio/tests/theme.test.ts',
    'studio/server/events.ts', 'studio/server/events-core.ts', 'studio/server/events-worker.ts',
    'studio/server/export.ts', 'studio/server/lab.ts', 'studio/server/main.ts',
    'studio/server/mcp.ts', 'studio/server/model.ts', 'studio/server/service.ts',
    'studio/server/review.ts', 'studio/server/forms.ts', 'studio/server/extensions.ts',
    'studio/server/stateless.ts', 'studio/server/store.ts',
    'studio/server/store-contract.ts', 'studio/server/workspace.ts',
    'studio/cloudflare/README.md', 'studio/cloudflare/auth.ts',
    'studio/cloudflare/store.ts', 'studio/cloudflare/telemetry.ts', 'studio/cloudflare/worker.ts',
    'studio/sites/README.md', 'studio/sites/handler.ts',
    'studio/sites/store.ts', 'studio/sites/schema.sql', 'studio/sites/telemetry.ts',
    'studio/sites/oauth.ts', 'studio/sites/oauth-store.ts',
    'studio/tests/build.test.ts', 'studio/tests/cloudflare-auth.test.ts', 'studio/tests/cloudflare-store.test.ts',
    'studio/tests/cloudflare-telemetry.test.ts', 'studio/tests/events-worker.test.ts',
    'studio/tests/events.test.ts', 'studio/tests/export.test.ts', 'studio/tests/export-mcp.test.ts', 'studio/tests/lab.test.ts',
    'studio/tests/stateless.test.ts', 'studio/tests/workspace.test.ts',
    'studio/tests/sites-store.test.ts', 'studio/tests/sites-telemetry.test.ts',
    'studio/tests/sites-handler.test.ts', 'studio/tests/sites-sync.test.ts',
    'studio/tests/sites-oauth.test.ts', 'studio/tests/review.test.ts',
    'studio/tests/web-interactions.test.ts', 'studio/tests/native-forms.test.ts',
}
SOURCE_FIXED = RUNTIME_FIXED | STUDIO_SOURCE | {
    '.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json',
    '.gitignore', '.gitattributes',
    'docs/installation.md', 'docs/usage.md', 'docs/practice.md', 'docs/verification.md',
    'scripts/build_release.py', 'scripts/package_files.py', 'scripts/validate_plugin.py',
    'tests/test_package.py',
}
EXCLUDED_PARTS = {'.git', '__pycache__', '.venv', 'node_modules', 'dist', 'work', '.wrangler', 'coverage', '.cache'}
EXCLUDED_NAMES = {'.env', '.dev.vars', 'auth.json', 'credentials.json'}


def is_runtime_path(path: Path) -> bool:
    return path.as_posix() in RUNTIME_FIXED | RUNTIME_RESOURCES or (
        len(path.parts) == 3 and path.parts[0] == 'skills' and path.name == 'SKILL.md'
    )


def selected_files(root: Path, *, source: bool = False, host: str | None = None) -> list[Path]:
    if host is not None and (source or host not in HOST_FILES):
        raise ValueError('Choose a supported runtime host or the complete source package')
    root = root.resolve()
    selected = []
    for path in root.rglob('*'):
        relative = path.relative_to(root)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.name in EXCLUDED_NAMES or path.name.startswith(('.env.', '.dev.vars.')):
            continue
        if path.suffix.lower() in {'.pyc', '.pyo', '.zip', '.sha256', '.pem', '.key', '.sqlite', '.sqlite3', '.db'}:
            continue
        include = is_runtime_path(relative) or (source and relative.as_posix() in SOURCE_FIXED)
        if host is not None and relative.as_posix() in RUNTIME_FIXED:
            include = relative.as_posix() in HOST_FILES[host]
        if include and path.is_file():
            if path.is_symlink() or not path.resolve().is_relative_to(root):
                raise ValueError(f'Package path escapes root or is a symlink: {relative}')
            selected.append(relative)
    return sorted(selected, key=lambda path: path.as_posix())
