#!/usr/bin/env python3
"""Guide first-run registration without downloading software or copying credentials."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description='Subtitle Translator for MUBI local helper setup')
    parser.add_argument('--browser', choices=['chrome', 'edge', 'chromium', 'brave'], default='chrome')
    parser.add_argument('--extension-id')
    parser.add_argument('--login', action='store_true', help='Launch the official Codex sign-in flow')
    args = parser.parse_args()
    print('Subtitle Translator for MUBI setup\nPython: OK (' + sys.version.split()[0] + ')')
    codex = shutil.which('codex')
    print('Codex CLI: ' + ('found' if codex else 'not found'))
    if not codex:
        print('Install Codex CLI first: https://learn.chatgpt.com/docs/codex/cli')
        print('If you use Ollama only, register with native/install.py --provider ollama instead.')
        return 1
    extension_id = args.extension_id or input('Paste the extension ID from the browser extensions page: ').strip()
    if not re.fullmatch(r'[a-p]{32}', extension_id):
        print('Expected the 32-letter extension ID shown in your browser.')
        return 1
    base = Path(__file__).resolve().parent
    manifest = base / 'com.hw.subtitle_translator.json'
    if sys.platform == 'win32' and manifest.exists():
        existing = json.loads(manifest.read_text(encoding='utf-8'))
        if (existing.get('allowed_origins') != [f'chrome-extension://{extension_id}/']
                or not Path(existing.get('path', '')).is_file()):
            print('Existing registration differs. Inspect and archive it before replacing it.')
            return 1
        print('A matching helper manifest already exists. Browser registration will be checked by the installer.')
    result = subprocess.run([sys.executable, str(base / 'install.py'), extension_id,
                             '--browser', args.browser, '--codex', codex, '--reuse'])
    if result.returncode:
        return result.returncode
    if args.login:
        return subprocess.run([codex, 'login']).returncode
    print('Next: run codex login, then use Check helper connection in Subtitle Translator for MUBI settings.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
