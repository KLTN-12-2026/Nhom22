"""Render and standardize this folder's Mermaid diagrams with one shared style."""
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / 'mermaid-config.json'
PATTERN = re.compile(
    r'(?:!\[[^\n]*\]\(assets/[^\n]*\.svg\)\s*'
    r'<details>\s*<summary>[^<]*</summary>\s*)?'
    r'```mermaid\s*\n(.*?)\n```(?:\s*</details>)?', re.S)

def main():
    config = json.loads(CONFIG.read_text(encoding='utf-8'))
    directive = '%%{init: ' + json.dumps(config, ensure_ascii=False, separators=(',', ':')) + '}%%'
    plans=[]
    diagrams=[]
    for file in sorted(ROOT.glob('*.md')):
        if file.name == 'README.md':
            continue
        original=file.read_text(encoding='utf-8-sig')
        number=0
        def replace(match):
            nonlocal number
            number+=1
            source=re.sub(r'^\s*%%\{init:.*?\}%%\s*\n', '', match.group(1), flags=re.S).strip()
            if source.startswith('sequenceDiagram'):
                source=source.replace(';', ',')
            if source.startswith('sequenceDiagram') and not re.search(r'^\s*autonumber\s*$',source,re.M):
                source=source.replace('sequenceDiagram','sequenceDiagram\n    autonumber',1)
            name=file.stem+'-'+str(number)+'.svg'
            kind='tuần tự' if source.startswith('sequenceDiagram') else 'hoạt động'
            diagrams.append((name,directive+'\n'+source))
            return ('![Sơ đồ '+kind+' '+file.stem+' — hình SVG](assets/'+name+')\n\n'
                    '<details>\n<summary>Xem mã Mermaid của sơ đồ</summary>\n\n'
                    '```mermaid\n'+directive+'\n'+source+'\n```\n\n</details>')
        normalized=PATTERN.sub(replace,original)
        if number:
            plans.append((file,normalized))
    cli=Path(os.environ.get('APPDATA',''))/'npm/node_modules/@mermaid-js/mermaid-cli/src/cli.js'
    node=shutil.which('node')
    if not node or not cli.exists():
        raise RuntimeError('Requires Node.js and @mermaid-js/mermaid-cli (mmdc).')
    assets=ROOT/'assets'
    assets.mkdir(exist_ok=True)
    # Commit Markdown only after all charts parse and render successfully.
    with tempfile.TemporaryDirectory(prefix='vocab-diagrams-') as tmp:
        temp=Path(tmp)
        source=temp/'source.md'
        output=temp/'render.md'
        source.write_text('\n\n'.join('```mermaid\n'+s+'\n```' for _,s in diagrams),encoding='utf-8')
        subprocess.run([node,str(cli),'-i',str(source),'-o',str(output),'-c',str(CONFIG),'-b','white'],check=True)
        for i,(name,_) in enumerate(diagrams,1):
            image=temp/('render-'+str(i)+'.svg')
            ET.parse(image)
            shutil.copy2(image,assets/name)
        for file,content in plans:
            file.write_text(content.rstrip()+'\n',encoding='utf-8')
    print('PASS:',len(diagrams),'SVG diagrams;',len(plans),'documents; shared style and valid XML.')

if __name__ == '__main__':
    main()
