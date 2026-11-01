#!/usr/bin/env python3
"""Commit the Claude package to the branch Anthropic's directory tracks."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from package_files import selected_files
from validate_plugin import validate_plugin

BRANCH = 'claude-directory'


def publish(root: Path, trailer: str | None = None) -> str:
    root = root.resolve()

    def git(*args: str, env: dict | None = None, check: bool = True) -> str:
        result = subprocess.run(['git', *args], cwd=root, env=env, check=check, capture_output=True, text=True, encoding='utf-8')
        return result.stdout.strip()

    errors = validate_plugin(root)
    if errors:
        raise ValueError('Package validation failed:\n' + '\n'.join(errors))
    if git('status', '--porcelain'):
        raise ValueError('Commit source changes before publishing the package branch')
    head = git('rev-parse', 'HEAD')
    with tempfile.TemporaryDirectory() as temp:
        # A separate index leaves the checkout and its staged state alone.
        env = {**os.environ, 'GIT_INDEX_FILE': str(Path(temp) / 'index')}
        for relative in selected_files(root, host='cowork'):
            blob = git('rev-parse', f'{head}:{relative.as_posix()}')
            git('update-index', '--add', '--cacheinfo', f'100644,{blob},{relative.as_posix()}', env=env)
        tree = git('write-tree', env=env)
    parent = git('rev-parse', '--verify', '--quiet', f'refs/heads/{BRANCH}', check=False)
    if parent and git('rev-parse', f'{parent}^{{tree}}') == tree:
        return parent
    version = json.loads((root / 'plugin.json').read_text(encoding='utf-8'))['version']
    message = f'release: Claude directory package {version}\n\nBuilt from {head}.'
    if trailer:
        message += f'\n\n{trailer}'
    commit = git('commit-tree', tree, *(['-p', parent] if parent else []), '-m', message)
    git('update-ref', f'refs/heads/{BRANCH}', commit)
    return commit


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--trailer', help='Commit message trailer, such as a co-author line')
    args = parser.parse_args()
    try:
        commit = publish(args.root, args.trailer)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(getattr(error, 'stderr', None) or str(error), file=sys.stderr)
        return 1
    print(f'{BRANCH} is at {commit}. Push it with: git push origin {BRANCH}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
