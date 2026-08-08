#!/usr/bin/env python3
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
STORE = os.path.join(ROOT, 'local_store.json')
OUT = os.path.join(ROOT, 'public', 'keywords.txt')

def load_titles():
    if os.path.exists(STORE):
        with open(STORE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [a.get('title','').strip() for a in data.get('animes', []) if a.get('title')]
    return []

templates = [
    '{title} смотреть онлайн',
    '{title} смотреть в хорошем качестве',
    '{title} uzbek',
    '{title} o‘zbek tilida',
    '{title} 2026',
    '{title} barcha qismlar',
    '{title} ep 1',
    '{title} epizod',
    '{title} tomosha qilish',
    '{title} online',
    '{title} trakt',
    '{title} bio',
    '{title} review',
    '{title} synopsis',
    '{title} eng yaxshi',
]

extra_keywords = [
    'anime uzbek', 'anime uz', 'uzbek anime', 'animem.uz', 'anime online', 'anime HD', 'o\'zbekcha anime'
]

# Modifiers to multiply keyword variations
modifiers = [
    'HD', 'full', 'bepul', 'yangi', '2026', '2025', 'online', 'uzbekcha', "o\'zbek tilida", 'tomosha', 'HD 1080p', 'HD 720p', 'tarjima', 'toliq', 'EP', 'EP1',
    'yangi season', 'oxirgi', 'part 1', 'part 2', 's1', 's2', 'season 1', 'season 2', 'dub', 'dubbed', 'sub', 'subbed', '1280p', '4k', '1080p',
    '720p', '480p', 'eng yaxshi', 'top', 'watch', 'online free', 'stream', 'streaming', 'download', 'full episode', 'all episodes', 'complete series',
    'eng yaxshi anime', 'replay', 'trailer', 'preview', 'raw', 'uncensored', 'urt', 'new ep', 'new episode', 'HD online'
]

def generate(titles):
    out = set()
    for t in titles:
        clean = t.replace('\n',' ').strip()
        for temp in templates:
            out.add(temp.format(title=clean))
        # add some permutations
        words = clean.split()
        if len(words) > 1:
            out.add(clean + ' serial')
            out.add(clean + ' complete')
        # variations with year range
        out.add(f"{clean} {2024}")
        out.add(f"{clean} {2025}")
        # multiply with modifiers
        for m in modifiers:
            out.add(f"{clean} {m}")
            for ex in extra_keywords:
                out.add(f"{clean} {m} {ex}")
    # mix extras to reach larger set
    base = list(out)
    # add combinations of base + extras to grow keyword set until target
    target = 120000
    i = 0
    for b in base:
        for ex in extra_keywords:
            out.add(f"{b} {ex}")
        i += 1
        if len(out) >= target:
            break
        if i % 100 == 0 and len(out) > 0 and i > 0 and i % 1000 == 0:
            pass
    return out

def main():
    titles = load_titles()
    if not titles:
        # fallback to reading server-side local_store.json if present
        print('No titles found in local_store.json — generating basic keywords')
        titles = ['Animem Uz']
    kws = generate(titles)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        for k in sorted(kws):
            f.write(k + '\n')
    print('Wrote', len(kws), 'keywords to', OUT)

if __name__ == '__main__':
    main()
