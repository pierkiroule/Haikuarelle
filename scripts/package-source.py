"""Bundle the runnable source and lightweight validation plates, without nested
archives, credentials, dependencies, build output or heavy intermediate renders.
Sites accepts individual files up to 25 MiB; fail before publication if exceeded.
"""
from pathlib import Path
import json, zipfile

root = Path(__file__).resolve().parents[1]
archive = root / 'public/haikuarelle-v11-1-source.zip'
version = json.loads((root / 'package.json').read_text())['version']
exclude = {'node_modules', '.git', 'dist', '.openai', '.sites-runtime', '__pycache__'}
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if not path.is_file() or any(part in exclude for part in rel.parts):
            continue
        if path.suffix in {'.zip', '.tsbuildinfo'} or path.name.startswith(('.env', 'qa-')):
            continue
        if '-4096' in path.name:
            continue
        if rel.parts[0] == 'docs' and path.suffix == '.png' and path.stat().st_size > 250_000:
            continue
        output.write(path, Path('haikuarelle-v11-1') / rel)
with zipfile.ZipFile(archive) as check:
    assert check.testzip() is None
    assert json.loads(check.read('haikuarelle-v11-1/package.json'))['version'] == version
assert archive.stat().st_size <= 25 * 1024 * 1024, 'Source ZIP exceeds the hosting file limit.'
print(f'{archive}: {archive.stat().st_size:,} bytes')
