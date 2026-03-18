#!/usr/bin/env python3
"""
Merge all poem JSON files into the existing data.js.
This script reads the current data.js, adds all missing poems, and outputs a new data.js.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Read current data.js
with (ROOT / 'data.js').open('r', encoding='utf-8') as f:
    content = f.read()

# Parse out the JSON
json_str = content.replace('const SHIJING_DATA = ', '').rstrip(';')
data = json.loads(json_str)

# Helper to find a section by name
def find_section(sections, name):
    for s in sections:
        if s['name'] == name:
            return s
    return None

# Helper to find a subsection by name within a section
def find_subsection(section, name):
    for sub in section['subsections']:
        if sub['name'] == name:
            return sub
    return None

# ===== 1. Add 小雅 subsections =====
xiaoya = find_section(data['sections'], '小雅')

# Load all xiaoya JSON files
xiaoya_files = [
    'poems_xiaoya_1.json',
    'poems_xiaoya_2.json', 
    'poems_xiaoya_3.json',
    'poems_xiaoya_4.json',
]

for fname in xiaoya_files:
    with (ROOT / fname).open('r', encoding='utf-8') as f:
        subsections = json.load(f)
    for sub in subsections:
        existing = find_subsection(xiaoya, sub['name'])
        if existing:
            # Merge poems that don't already exist
            existing_titles = {p['title'] for p in existing['poems']}
            for poem in sub['poems']:
                if poem['title'] not in existing_titles:
                    existing['poems'].append(poem)
        else:
            xiaoya['subsections'].append(sub)

# ===== 2. Add 大雅 subsections =====
daya = find_section(data['sections'], '大雅')

with (ROOT / 'poems_daya.json').open('r', encoding='utf-8') as f:
    daya_subs = json.load(f)

for sub in daya_subs:
    existing = find_subsection(daya, sub['name'])
    if existing:
        existing_titles = {p['title'] for p in existing['poems']}
        for poem in sub['poems']:
            if poem['title'] not in existing_titles:
                existing['poems'].append(poem)
    else:
        daya['subsections'].append(sub)

# ===== 3. Add 周颂 subsections =====
zhousong = find_section(data['sections'], '周颂')

with (ROOT / 'poems_zhousong.json').open('r', encoding='utf-8') as f:
    zhou_subs = json.load(f)

for sub in zhou_subs:
    existing = find_subsection(zhousong, sub['name'])
    if existing:
        existing_titles = {p['title'] for p in existing['poems']}
        for poem in sub['poems']:
            if poem['title'] not in existing_titles:
                existing['poems'].append(poem)
    else:
        zhousong['subsections'].append(sub)

# ===== 4. Add 鲁颂 and 商颂 poems =====
with (ROOT / 'poems_lusong_shangsong.json').open('r', encoding='utf-8') as f:
    lu_shang = json.load(f)

# 鲁颂
lusong = find_section(data['sections'], '鲁颂')
lusong_sub = lusong['subsections'][0]  # Only one subsection
existing_titles = {p['title'] for p in lusong_sub['poems']}
for poem in lu_shang['鲁颂']:
    if poem['title'] not in existing_titles:
        lusong_sub['poems'].append(poem)

# 商颂
shangsong = find_section(data['sections'], '商颂')
shangsong_sub = shangsong['subsections'][0]  # Only one subsection
existing_titles = {p['title'] for p in shangsong_sub['poems']}
for poem in lu_shang['商颂']:
    if poem['title'] not in existing_titles:
        shangsong_sub['poems'].append(poem)

# ===== Count total poems =====
total = 0
for sec in data['sections']:
    for sub in sec['subsections']:
        total += len(sub['poems'])
        
print(f"Total poems: {total}")

# Detailed count
for sec in data['sections']:
    sec_total = sum(len(sub['poems']) for sub in sec['subsections'])
    print(f"  {sec['name']}: {sec_total} poems")
    for sub in sec['subsections']:
        print(f"    {sub['name']}: {len(sub['poems'])} poems")

# ===== Write output =====
js_content = f"const SHIJING_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};"

with (ROOT / 'data.js').open('w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\nSuccessfully wrote data.js with {total} poems")
