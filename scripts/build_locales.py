#!/usr/bin/env python3
"""Validate locale keys/placeholders and compile catalogs for synchronous content scripts."""
import argparse
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]


def compile_locales():
    locales=json.loads((ROOT/'scripts/locale-metadata.json').read_text(encoding='utf-8'))
    messages={}
    expected=None
    placeholders={}
    for locale in locales:
        path=ROOT/'extension/_locales'/locale['folder']/'messages.json'
        raw=json.loads(path.read_text(encoding='utf-8'))
        values={key:row['message'] for key,row in raw.items()}
        if expected is None:
            expected=set(values)
            placeholders={key:set(re.findall(r'\{(\w+)\}',text))for key,text in values.items()}
        if set(values)!=expected:
            raise ValueError(f"{locale['id']}: missing {expected-set(values)}, extra {set(values)-expected}")
        for key,text in values.items():
            if not isinstance(text,str) or not text.strip():raise ValueError(f"{locale['id']}.{key}: empty message")
            if set(re.findall(r'\{(\w+)\}',text))!=placeholders[key]:raise ValueError(f"{locale['id']}.{key}: placeholder mismatch")
        messages[locale['id']]=values
    runtime=(ROOT/'scripts/i18n-runtime.js').read_text(encoding='utf-8')
    result=runtime.replace('__MESSAGES__',json.dumps(messages,ensure_ascii=False,indent=2)).replace('__LOCALES__',json.dumps(locales,ensure_ascii=False))
    return result,locales


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    compiled,locales=compile_locales();path=ROOT/'extension/i18n.js'
    if args.check:
        if path.read_text(encoding='utf-8')!=compiled:raise SystemExit('Run npm run locales to regenerate extension/i18n.js')
    else:path.write_text(compiled,encoding='utf-8')
    print(f'Validated {len(locales)} locale catalogs and message placeholders')


if __name__=='__main__':main()
