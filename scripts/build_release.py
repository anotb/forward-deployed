#!/usr/bin/env python3
"""Build ChatGPT/Codex, Claude Cowork, and source ZIPs with checksums."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

from package_files import selected_files
from validate_plugin import validate_plugin


def build_release(root: Path, output_dir: Path) -> list[Path]:
    root, output_dir = root.resolve(), output_dir.resolve()
    if output_dir.is_relative_to(root) and output_dir != root / 'dist':
        raise ValueError('Inside the source tree, build output must use its excluded dist directory')
    errors = validate_plugin(root)
    if errors:
        raise ValueError('Package validation failed:\n' + '\n'.join(errors))
    manifest = json.loads((root / 'plugin.json').read_text(encoding='utf-8'))
    name, version = manifest['name'], manifest['version']
    # Select all file sets before writing output.
    sets = [('-chatgpt', selected_files(root, host='chatgpt')),
            ('-cowork', selected_files(root, host='cowork')),
            ('-source', selected_files(root, source=True))]
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = []
    for suffix, paths in sets:
        archive = output_dir / f'{name}-{version}{suffix}.zip'
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
            for relative in paths:
                info = zipfile.ZipInfo(f'{name}/{relative.as_posix()}', date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                bundle.writestr(info, (root / relative).read_bytes(), compresslevel=9)
        checksum = archive.with_suffix('.zip.sha256')
        checksum.write_text(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n', encoding='ascii', newline='\n')
        outputs.extend([archive, checksum])
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output-dir', type=Path)
    args = parser.parse_args()
    try:
        outputs = build_release(args.root, args.output_dir or args.root / 'dist')
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    for output in outputs:
        print(f'Wrote {output}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
