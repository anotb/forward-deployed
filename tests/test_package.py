"""Local package checks, not skill-quality or host-compatibility claims."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build_release import build_release
from package_files import selected_files
from validate_plugin import validate_plugin


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='forward deployed ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source with spaces'
        self.root.mkdir()
        for relative in selected_files(ROOT, source=True):
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)

    def write(self, relative, content):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')

    def edit_json(self, relative, update):
        path = self.root / relative
        value = json.loads(path.read_text(encoding='utf-8'))
        update(value)
        path.write_text(json.dumps(value), encoding='utf-8')

    def test_complete_package_validates(self):
        self.assertEqual(validate_plugin(self.root), [])

    def test_manifest_version_and_discovery_drift_are_rejected(self):
        self.edit_json('.codex-plugin/plugin.json', lambda data: data.update(version='9.0.0', skills='./elsewhere/'))
        errors = validate_plugin(self.root)
        self.assertTrue(any('version differs' in value for value in errors))
        self.assertTrue(any('invalid skills discovery path' in value for value in errors))

    def test_portable_manifest_rejects_compatibility_mcp_field(self):
        self.edit_json('plugin.json', lambda data: data.update(mcpServers={'unexpected': {}}))
        self.assertTrue(any('manifest fields differ' in value for value in validate_plugin(self.root)))

    def test_hosted_mcp_configuration_rejects_commands_credentials_and_url_drift(self):
        self.edit_json('mcp.json', lambda data: data['mcpServers']['forward-deployed-studio'].update(command='node', headers={'Authorization': 'example'}))
        self.edit_json('.mcp.json', lambda data: data['mcpServers']['forward-deployed-studio'].update(url='http://localhost:3000/mcp'))
        errors = validate_plugin(self.root)
        self.assertTrue(any(value.startswith('mcp.json: expected only') for value in errors))
        self.assertTrue(any(value.startswith('.mcp.json: expected only') for value in errors))

    def test_missing_mcp_configuration_and_wrong_wrapper_path_are_rejected(self):
        (self.root / 'mcp.json').unlink()
        self.edit_json('.claude-plugin/plugin.json', lambda data: data.update(mcpServers='./other.json'))
        errors = validate_plugin(self.root)
        self.assertTrue(any('Missing package file: mcp.json' in value for value in errors))
        self.assertTrue(any('invalid MCP configuration path' in value for value in errors))

    def test_host_metadata_limits_and_missing_icon_are_rejected(self):
        self.edit_json('plugin.json', lambda data: data['extensions']['com.openai']['interface'].update(shortDescription='x' * 31))
        self.edit_json('.claude-plugin/plugin.json', lambda data: data.update(description='x' * 501))
        (self.root / 'assets/icon.svg').unlink()
        errors = validate_plugin(self.root)
        self.assertTrue(any('OpenAI shortDescription' in value for value in errors))
        self.assertTrue(any('Claude plugin description' in value for value in errors))
        self.assertTrue(any('Missing package file: assets/icon.svg' in value for value in errors))

    def test_skill_frontmatter_rejects_xml_tags(self):
        self.write('skills/value-case/SKILL.md', '---\nname: value-case\ndescription: Use <example> tags.\n---\nBody.\n')
        self.assertTrue(any('XML tags in skill frontmatter' in value for value in validate_plugin(self.root)))

    def test_catalog_target_drift_is_rejected(self):
        self.edit_json('.claude-plugin/marketplace.json', lambda data: data['plugins'][0].update(source='./missing'))
        self.assertTrue(any('source must resolve' in value for value in validate_plugin(self.root)))

    def test_missing_skill_and_mismatched_name_are_rejected(self):
        (self.root / 'skills/discovery/SKILL.md').unlink()
        self.write('skills/value-case/SKILL.md', '---\nname: wrong\ndescription: Example.\n---\nBody.\n')
        errors = validate_plugin(self.root)
        self.assertTrue(any('Skill discovery differs' in value for value in errors))
        self.assertTrue(any('name differs from directory' in value for value in errors))

    def test_duplicate_metadata_and_empty_skill_are_rejected(self):
        self.write('skills/value-case/SKILL.md', '---\nname: value-case\nname: value-case\ndescription: Example.\n---\n')
        errors = validate_plugin(self.root)
        self.assertTrue(any('duplicate frontmatter' in value for value in errors))
        self.assertTrue(any('empty skill body' in value for value in errors))

    def test_missing_and_escaping_links_are_rejected(self):
        self.write('skills/value-case/SKILL.md', '---\nname: value-case\ndescription: Example.\n---\n[missing](missing.md)\n[outside](../../../outside.md)\n')
        errors = validate_plugin(self.root)
        self.assertTrue(any('link does not exist' in value for value in errors))
        self.assertTrue(any('link escapes package root' in value for value in errors))

    def test_skill_cannot_depend_on_source_docs_or_unlinked_research(self):
        self.write('skills/value-case/SKILL.md', '---\nname: value-case\ndescription: Example.\n---\n[guide](../../docs/verification.md)\nRead `research/field-guide.md`.\n')
        errors = validate_plugin(self.root)
        self.assertTrue(any('link excluded from runtime' in value for value in errors))
        self.assertTrue(any('source-only resource dependency' in value for value in errors))

    def test_missing_runtime_reference_is_rejected(self):
        (self.root / 'skills/adoption-and-scale/references/workforce-practice.md').unlink()
        errors = validate_plugin(self.root)
        self.assertTrue(any('Missing package file: skills/adoption-and-scale/references/workforce-practice.md' in value for value in errors))

    def test_unlisted_skill_reference_is_not_an_installed_dependency(self):
        self.write('skills/value-case/references/unlisted.md', 'Unlisted guidance.\n')
        self.write('skills/value-case/SKILL.md', '---\nname: value-case\ndescription: Example.\n---\n[guide](references/unlisted.md)\n')
        errors = validate_plugin(self.root)
        self.assertTrue(any('link excluded from runtime' in value for value in errors))

    def test_archives_have_one_root_and_separate_runtime_from_source(self):
        self.write('research/scratch.md', 'not runtime or source\n')
        self.write('references/guide.md', 'not runtime or source\n')
        self.write('schemas/model.json', '{}')
        self.write('templates/report.md', 'not runtime or source\n')
        self.write('scripts/.env', 'not packaged\n')
        self.write('docs/unlisted.md', 'unlisted document\n')
        self.write('examples/sample.md', 'unlisted example\n')
        self.write('tests/notes.md', 'unlisted notes\n')
        self.write('skills/adoption-and-scale/references/unlisted.md', 'unlisted skill material\n')
        for relative in ['studio/.env', 'studio/.dev.vars', 'studio/.wrangler/state.sqlite', 'studio/node_modules/package/index.js', 'studio/dist/server.js', 'studio/workspace.sqlite', 'studio/workspace.sqlite-wal', 'studio/screenshot.png', 'studio/launch-notes.md', 'studio/server/unreviewed.ts']:
            self.write(relative, 'not packaged\n')
        outputs = build_release(self.root, Path(self.temp.name) / 'packages')
        chatgpt, cowork, source = outputs[0], outputs[2], outputs[4]
        for host, archive, manifest in [('chatgpt', chatgpt, 'plugin.json'), ('cowork', cowork, '.claude-plugin/plugin.json')]:
            with zipfile.ZipFile(archive) as bundle:
                names = bundle.namelist()
                expected = {'forward-deployed/' + p.as_posix() for p in selected_files(self.root, host=host)}
                self.assertEqual(set(names), expected)
                self.assertEqual(len(names), len(expected))
                self.assertTrue(all(name.startswith('forward-deployed/') for name in names))
                self.assertEqual([name for name in names if name.endswith('/plugin.json')], ['forward-deployed/' + manifest])
                self.assertFalse(any(part in name for name in names for part in ['/scripts/', '/tests/', '/examples/', '/research/', '/schemas/', '/templates/', '/marketplace.json', '/studio/']))
                self.assertIn('forward-deployed/docs/installation.md', names)
                self.assertIn('forward-deployed/docs/usage.md', names)
                self.assertIn('forward-deployed/docs/export.md', names)
                expected_mcp = 'mcp.json' if host == 'chatgpt' else '.mcp.json'
                self.assertIn('forward-deployed/' + expected_mcp, names)
                self.assertNotIn('forward-deployed/' + ('.mcp.json' if host == 'chatgpt' else 'mcp.json'), names)
                self.assertNotIn('forward-deployed/docs/verification.md', names)
                self.assertIn('forward-deployed/skills/adoption-and-scale/references/workforce-practice.md', names)
                self.assertNotIn('forward-deployed/skills/adoption-and-scale/references/unlisted.md', names)
                for relative in selected_files(self.root, host=host):
                    self.assertEqual(bundle.read('forward-deployed/' + relative.as_posix()), (self.root / relative).read_bytes())
        with zipfile.ZipFile(chatgpt) as left, zipfile.ZipFile(cowork) as right:
            skill_paths = {name for name in left.namelist() if '/skills/' in name}
            self.assertEqual(skill_paths, {name for name in right.namelist() if '/skills/' in name})
            self.assertTrue(all(left.read(name) == right.read(name) for name in skill_paths))
            self.assertIn('forward-deployed/assets/icon.svg', left.namelist())
            self.assertNotIn('forward-deployed/assets/icon.svg', right.namelist())
        with zipfile.ZipFile(source) as bundle:
            names = bundle.namelist()
            self.assertIn('forward-deployed/.agents/plugins/marketplace.json', names)
            self.assertIn('forward-deployed/tests/test_package.py', names)
            self.assertIn('forward-deployed/scripts/build_release.py', names)
            self.assertFalse(any('/.env' in name or '/research/' in name or name.startswith('forward-deployed/references/') for name in names))
            self.assertFalse(any(part in name for name in names for part in ['/examples/', '/docs/unlisted.md', '/tests/notes.md']))
            self.assertIn('forward-deployed/docs/usage.md', names)
            self.assertIn('forward-deployed/studio/server/mcp.ts', names)
            self.assertIn('forward-deployed/studio/package-lock.json', names)
            self.assertIn('forward-deployed/docs/export.md', names)
            self.assertFalse(any(part in name for name in names for part in ['/.wrangler/', '/node_modules/', '/dist/', '/.dev.vars', '.sqlite', '/screenshot.png', '/launch-notes.md', '/unreviewed.ts']))
        for archive, checksum in zip(outputs[::2], outputs[1::2]):
            self.assertEqual(checksum.read_text().split()[0], hashlib.sha256(archive.read_bytes()).hexdigest())

    def test_invalid_host_selection_is_rejected(self):
        with self.assertRaises(ValueError):
            selected_files(self.root, host='unknown')
        with self.assertRaises(ValueError):
            selected_files(self.root, host='cowork', source=True)

    def test_build_is_repeatable_and_cannot_consume_its_own_outputs(self):
        outputs = build_release(self.root, self.root / 'dist')
        first_bytes = [path.read_bytes() for path in outputs]
        outputs = build_release(self.root, self.root / 'dist')
        self.assertEqual(first_bytes, [path.read_bytes() for path in outputs])
        with self.assertRaisesRegex(ValueError, 'excluded dist directory'):
            build_release(self.root, self.root / 'examples/generated')


if __name__ == '__main__':
    unittest.main()
