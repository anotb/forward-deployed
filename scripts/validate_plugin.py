#!/usr/bin/env python3
"""Validate this skills-first package's structural contract using the standard library."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from package_files import RUNTIME_FIXED, RUNTIME_RESOURCES, SOURCE_FIXED, selected_files

SKILLS = {
    'get-started', 'enterprise-engagement', 'discovery', 'meeting-synthesis',
    'opportunity-design', 'use-case-portfolio', 'value-case', 'capability-exploration',
    'solution-design', 'enterprise-integration', 'context-design', 'evaluate-and-improve',
    'technical-delivery', 'adoption-and-scale', 'executive-communication', 'field-productization',
}
BASE_FIELDS = {'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords'}
STUDIO_URL = 'https://forward-deployed.unsol.dev/connect/mcp'
LINK = re.compile(r'!?\[[^\]\n]*\]\(([^)\n]+)\)')


def validate_plugin(root: Path) -> list[str]:
    root = root.resolve()
    errors = []

    def check(condition, message):
        if not condition:
            errors.append(message)

    def read_json(relative):
        try:
            value = json.loads((root / relative).read_text(encoding='utf-8'))
            if not isinstance(value, dict):
                raise ValueError('expected an object')
            return value
        except (OSError, ValueError) as error:
            errors.append(f'{relative}: {error}')
            return {}

    for relative in sorted(SOURCE_FIXED | RUNTIME_RESOURCES):
        check((root / relative).is_file(), f'Missing package file: {relative}')
    portable = read_json('plugin.json')
    check(set(portable) == BASE_FIELDS | {'$schema', 'extensions'}, 'Portable manifest fields differ from this package contract')
    check(portable.get('$schema') == 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'Unexpected portable manifest schema')
    check(portable.get('name') == 'forward-deployed', 'Unexpected plugin name')
    check(portable.get('version') == '0.6.3', 'Unexpected plugin version')
    check(portable.get('license') == 'MIT', 'Unexpected plugin license')
    for key in ('description',):
        check(isinstance(portable.get(key), str) and bool(portable.get(key)), f'Missing manifest {key}')
    extensions = portable.get('extensions', {})
    interface = extensions.get('com.openai', {}).get('interface', {}) if isinstance(extensions, dict) else {}
    openai = extensions.get('com.openai', {})
    compatibility_extensions = {'com.openai': {key: value for key, value in openai.items() if key != 'interface'}}
    check(openai.get('onboardingSkill') == './skills/get-started/SKILL.md', 'Invalid OpenAI onboarding skill')
    review = openai.get('review', {})
    cases = review.get('test_cases', {})
    check(len(cases.get('positive', [])) == 5 and len(cases.get('negative', [])) == 3, 'Review requires five positive and three negative cases')
    check(review.get('demo_recording_url') == 'https://forward-deployed.unsol.dev/review-demo.mp4', 'Unexpected review demo URL')
    check(review.get('commerce') is False, 'Unexpected commerce declaration')
    check(isinstance(interface, dict) and bool(interface.get('displayName')), 'Missing OpenAI interface metadata')
    for field, limit in [('displayName', 30), ('shortDescription', 30), ('longDescription', 4000), ('developerName', 80)]:
        value = interface.get(field)
        check(isinstance(value, str) and 0 < len(value) <= limit, f'OpenAI {field} must contain 1-{limit} characters')
    for field in ('logo', 'composerIcon'):
        check(interface.get(field) == './assets/icon.svg', f'OpenAI {field} must reference the bundled icon')
    prompts = interface.get('defaultPrompt', [])
    check(isinstance(prompts, list) and 1 <= len(prompts) <= 3 and all(isinstance(p, str) and 0 < len(p) <= 128 for p in prompts), 'Invalid OpenAI starter prompts')

    for relative, extra in [('.claude-plugin/plugin.json', {'mcpServers'}), ('.codex-plugin/plugin.json', {'skills', 'interface', 'mcpServers', 'extensions'})]:
        wrapper = read_json(relative)
        check(set(wrapper) == BASE_FIELDS | extra, f'{relative}: unexpected fields')
        for key in BASE_FIELDS:
            check(wrapper.get(key) == portable.get(key), f'{relative}: {key} differs from portable manifest')
        if relative.startswith('.claude'):
            check(isinstance(wrapper.get('name'), str) and bool(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', wrapper['name'])) and len(wrapper['name']) <= 64, 'Invalid Claude plugin name')
            check(isinstance(wrapper.get('description'), str) and 0 < len(wrapper['description']) <= 500, 'Claude plugin description must contain 1-500 characters')
        check(wrapper.get('mcpServers') == './.mcp.json', f'{relative}: invalid MCP configuration path')
        if relative.startswith('.codex'):
            check(wrapper.get('extensions') == compatibility_extensions, f'{relative}: OpenAI extensions differ from portable manifest')
            check(wrapper.get('skills') == './skills/', f'{relative}: invalid skills discovery path')
            check(wrapper.get('interface') == interface, f'{relative}: interface differs from portable manifest')

    for relative, transport in [('mcp.json', 'streamable-http'), ('.mcp.json', 'http')]:
        config = read_json(relative)
        expected = {'mcpServers': {'forward-deployed-studio': {'type': transport, 'url': STUDIO_URL}}}
        if relative == 'mcp.json':
            expected['$schema'] = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
            expected['mcpServers']['forward-deployed-studio']['extensions'] = {'com.openai': {'auth': {
                'type': 'oauth',
                'client': {'mode': 'provided', 'clientId': '0nTE7Sq3GVFJLAs6', 'tokenEndpointAuthMethod': 'none'},
                'oidcEnabled': False,
                'authorizationServerBase': 'https://forward-deployed.unsol.dev',
                'authorizationUrl': 'https://forward-deployed.unsol.dev/connect/authorize',
                'tokenUrl': 'https://forward-deployed.unsol.dev/connect/token',
                'resource': STUDIO_URL,
                'defaultScopes': ['workspace', 'offline_access'],
            }}}
        check(config == expected, f'{relative}: expected only the hosted Studio MCP endpoint without commands or credentials')

    for relative in ('.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json'):
        catalog = read_json(relative)
        check(catalog.get('name') == 'anotb-forward-deployed', f'{relative}: unexpected catalog identity')
        plugins = catalog.get('plugins', [])
        if not isinstance(plugins, list) or len(plugins) != 1 or not isinstance(plugins[0], dict):
            errors.append(f'{relative}: expected exactly one plugin')
            continue
        entry = plugins[0]
        check(entry.get('name') == portable.get('name'), f'{relative}: plugin identity differs')
        if relative.startswith('.claude'):
            check(entry.get('source') == './', f'{relative}: source must resolve to this plugin root')
            check(entry.get('version') == portable.get('version'), f'{relative}: version differs')
            check(entry.get('description') == portable.get('description'), f'{relative}: description differs')
        else:
            check(entry.get('source') == {'source': 'local', 'path': './'}, f'{relative}: source must resolve to this plugin root')
            check(entry.get('policy') == {'installation': 'AVAILABLE', 'authentication': 'ON_INSTALL'}, f'{relative}: unexpected registration policy')

    discovered = {path.parent.name for path in (root / 'skills').glob('*/SKILL.md')}
    check(discovered == SKILLS, f'Skill discovery differs: missing={sorted(SKILLS - discovered)} extra={sorted(discovered - SKILLS)}')
    for path in sorted((root / 'skills').glob('*/SKILL.md')):
        text = path.read_text(encoding='utf-8')
        blocks = text.split('---', 2)
        if len(blocks) != 3 or blocks[0].strip():
            errors.append(f'{path.relative_to(root)}: missing frontmatter')
            continue
        fields = {}
        for line in blocks[1].strip().splitlines():
            # This package uses plain scalar frontmatter only; fail instead of guessing at YAML.
            match = re.fullmatch(r'([a-z][a-z-]*): (.+)', line)
            if not match or match[1] in fields:
                errors.append(f'{path.relative_to(root)}: unsupported or duplicate frontmatter')
                continue
            fields[match[1]] = match[2]
        check(fields.get('name') == path.parent.name, f'{path.relative_to(root)}: name differs from directory')
        check(bool(fields.get('description', '').strip()), f'{path.relative_to(root)}: missing description')
        check(not re.search(r'<[^>]*>', fields.get('name', '') + fields.get('description', '')), f'{path.relative_to(root)}: XML tags in skill frontmatter')
        check(bool(blocks[2].strip()), f'{path.relative_to(root)}: empty skill body')
        for target in re.findall(r'(?<![\w/-])(?:research|references|examples|scripts|templates|schemas)/[^\s`)]*', blocks[2]):
            resource = (path.parent / target).resolve()
            if not resource.is_relative_to(root) or resource.relative_to(root).as_posix() not in RUNTIME_RESOURCES:
                errors.append(f'{path.relative_to(root)}: source-only resource dependency {target}')

    try:
        runtime = set(selected_files(root))
        source = selected_files(root, source=True)
    except ValueError as error:
        errors.append(str(error))
        return errors
    for relative in source:
        if relative.suffix != '.md':
            continue
        content = (root / relative).read_text(encoding='utf-8')
        # Code examples are not rendered Markdown links.
        content = re.sub(r'```.*?```', '', content, flags=re.S)
        for match in LINK.finditer(content):
            destination = match[1].strip().split(' "', 1)[0].strip('<>')
            parsed = urlsplit(destination)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = (root / relative).parent / unquote(parsed.path)
            resolved = target.resolve()
            if not resolved.is_relative_to(root):
                errors.append(f'{relative}: link escapes package root: {destination}')
            elif not resolved.exists():
                errors.append(f'{relative}: link does not exist: {destination}')
            elif relative in runtime and resolved.relative_to(root) not in runtime:
                errors.append(f'{relative}: link excluded from runtime: {destination}')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        errors = validate_plugin(args.root)
    except (OSError, ValueError, TypeError, AttributeError) as error:
        errors = [f'Malformed package input: {error}']
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Package structure valid: consistent skills, host manifests, hosted MCP configuration and local links.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
