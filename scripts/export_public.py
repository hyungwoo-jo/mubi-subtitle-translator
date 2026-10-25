#!/usr/bin/env python3
"""Export reviewed source paths without private deployment history or runtime data."""
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    version = json.loads((ROOT / 'package.json').read_text())['version']
    prefix = f'mubi-subtitle-translator-source-{version}'
    destination = ROOT / 'out' / f'{prefix}.zip'
    destination.parent.mkdir(exist_ok=True)
    files = {Path('README.md'): ROOT / 'docs/README.public.md'}
    for folder in ('extension',):
        for source in (ROOT / folder).rglob('*'):
            if source.is_file() and source.suffix in ('.js', '.json', '.html', '.css', '.svg', '.png'):
                files[source.relative_to(ROOT)] = source
    for name in ('LICENSE', '.gitignore', 'package.json', 'native/host.py', 'native/install.py', 'native/setup.py',
                 'scripts/check.mjs', 'scripts/build.mjs', 'scripts/export_public.py',
                 'docs/README.public.md', 'docs/README.ko.md', 'docs/README.ja.md', 'docs/PRIVACY.md', 'docs/STORE.md', 'docs/assets/popup-en.png', 'tests/browser_check.py', 'tests/browser_oauth_check.py', 'tests/native_test.py',
                 'tests/core.test.mjs', 'tests/connection.test.mjs', 'tests/oauth.test.mjs'):
        files[Path(name)] = ROOT / name
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, source in sorted(files.items()):
            archive.write(source, f'{prefix}/{name.as_posix()}')
    print(destination.relative_to(ROOT))


if __name__ == '__main__':
    main()
