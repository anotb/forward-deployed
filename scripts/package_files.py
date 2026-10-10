"""Explicit source and runtime file selection; no installed executable component."""
from pathlib import Path

RUNTIME_FIXED = {
    'plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json',
    'README.md', 'LICENSE', 'PRIVACY.md', 'TERMS.md',
    'docs/installation.md', 'docs/usage.md', 'assets/icon.svg',
}
HOST_MANIFESTS = {'plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json'}
HOST_FILES = {
    'chatgpt': (RUNTIME_FIXED - HOST_MANIFESTS) | {'plugin.json'},
    'cowork': (RUNTIME_FIXED - HOST_MANIFESTS - {'assets/icon.svg'}) | {'.claude-plugin/plugin.json'},
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
SOURCE_FIXED = RUNTIME_FIXED | {
    '.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json',
    '.gitignore', '.gitattributes',
    'docs/installation.md', 'docs/usage.md', 'docs/practice.md', 'docs/verification.md',
    'scripts/build_release.py', 'scripts/package_files.py', 'scripts/validate_plugin.py',
    'tests/test_package.py',
}
EXCLUDED_PARTS = {'.git', '__pycache__', '.venv', 'node_modules', 'dist', 'work'}
EXCLUDED_NAMES = {'.env', 'auth.json', 'credentials.json'}


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
        if path.name in EXCLUDED_NAMES or path.name.startswith('.env.'):
            continue
        if path.suffix.lower() in {'.pyc', '.pyo', '.zip', '.sha256', '.pem', '.key'}:
            continue
        include = is_runtime_path(relative) or (source and relative.as_posix() in SOURCE_FIXED)
        if host is not None and relative.as_posix() in RUNTIME_FIXED:
            include = relative.as_posix() in HOST_FILES[host]
        if include and path.is_file():
            if path.is_symlink() or not path.resolve().is_relative_to(root):
                raise ValueError(f'Package path escapes root or is a symlink: {relative}')
            selected.append(relative)
    return sorted(selected, key=lambda path: path.as_posix())
