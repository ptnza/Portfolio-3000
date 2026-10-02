#!/usr/bin/env python3
"""Render Work from content/tools.json (the Side quests row, always first),
content/projects.json and assets/media/manifest.json into index.html, between
the <!-- archive:start --> and <!-- archive:end --> markers.

Usage: python3 tools/build_html.py
Edit project text in content/projects.json, then re-run. Everything outside
the markers in index.html is hand-written and left alone.
"""
import datetime, html, json, os, re, statistics

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START, END = '<!-- archive:start -->', '<!-- archive:end -->'


def esc(s):
    return html.escape(s, quote=True)


def media(s, alt, first, extra=''):
    src = 'src' if first else 'data-src'
    if s['type'] == 'video':
        poster = 'poster' if first else 'data-poster'
        return (f'<video {src}="{s["src"]}" {poster}="{s["poster"]}" width="{s["w"]}" height="{s["h"]}"{extra} '
                f'muted loop playsinline preload="none" aria-label="{alt}"></video>')
    return (f'<img {src}="{s["src"]}" width="{s["w"]}" height="{s["h"]}"{extra} alt="{alt}" '
            f'decoding="async" loading="lazy">')


def slide(s, i, n, title, first, frame, desc=''):
    alt = esc(f'{title}, {i + 1} of {n}' + (f': {desc}' if desc else ''))
    cls = 'ss-slide is-on' if first else 'ss-slide'
    ar = f' data-ar="{s["w"] / s["h"]:.4f}"'  # a slide wider than the frame shortens it while it shows (archive.js)
    if s['type'] == 'pair':
        # two pieces side by side, no gap, rounded as one image; sized to fit the frame
        fit = 'fit-w' if s['w'] / s['h'] >= frame else 'fit-h'
        # each half takes width in proportion to its own shape, so neither gets cropped
        halves = ''.join(media(x, f'{alt} ({side})', first, f' style="flex-grow: {x["w"] / x["h"]:.4f}"')
                         for x, side in zip(s['items'], ('left', 'right')))
        return f'<figure class="{cls}"{ar}><div class="ss-pair {fit}" style="aspect-ratio: {s["w"]} / {s["h"]}">{halves}</div></figure>'
    shape = f' style="--r: {s["w"] / s["h"]:.4f}"'  # CSS fits the picture to the frame by this ratio
    return f'<figure class="{cls}"{ar}>{media(s, alt, first, shape)}</figure>'


def item(p, slides):
    slug, title = p['slug'], esc(p['title'])
    n = len(slides)
    # frame: the usual slide shape, but never narrower than the first slide, so the lead image always fills it
    ratio = max(statistics.median(s['w'] / s['h'] for s in slides), slides[0]['w'] / slides[0]['h'])
    meta = [('Role', p['role']), ('With', p['with'])] + ([('Year', p['year'])] if p['year'] else [])
    meta_html = ''.join(f'<span class="k">{k}</span><span class="v">{esc(v)}</span>' for k, v in meta)

    alts = p.get('alts', [])  # optional: one description per slide, in slide order
    slides_html = '\n'.join(slide(s, i, n, p['title'], i == 0, ratio, alts[i] if i < len(alts) else '') for i, s in enumerate(slides))
    controls = '' if n < 2 else (
        # click halves for the mouse; keyboard and screen readers use the arrows below
        f'<div class="ss-hit ss-hit-prev" aria-hidden="true"></div>'
        f'<div class="ss-hit ss-hit-next" aria-hidden="true"></div>')
    bar = '' if n < 2 else (
        f'<div class="ss-bar alt-body"><span class="ss-count" aria-live="polite">01 / {n:02d}</span>'
        f'<span class="ss-nav"><button class="ss-prev" type="button" aria-label="Previous image">←</button>'
        f'<button class="ss-next" type="button" aria-label="Next image">→</button></span></div>')

    return f'''<article class="arc-item" id="{slug}">
<div class="arc-head alt-body">
<h2 class="arc-title"><a href="#{slug}">{title}</a></h2>
<p class="arc-desc">{esc(p["summary"])}</p>
<span class="arc-meta">{meta_html}</span>
</div>
<div class="arc-img">
<div class="ss" style="--ar: {ratio:.4f}" tabindex="0" role="region" aria-roledescription="carousel" aria-label="{title} images">
{slides_html}
{controls}
</div>
{bar}
</div>
</article>'''


BADGES = {'live': ('is-live', 'Live'), 'progress': ('is-progress', 'In progress')}


def tools(t):
    n = len(t['items'])
    cards = []
    hinted = False
    for it in t['items']:
        name, desc = esc(it['name']), esc(it['desc'])
        if it.get('video'):  # still frame at rest; plays on hover / focus (archive.js)
            media = (f'<video data-src="{esc(it["video"])}" poster="{esc(it["image"])}" muted loop playsinline '
                     f'preload="none" aria-hidden="true"></video>')
            if not hinted:  # one hint teaches the whole row
                media += '<span class="tool-hint" aria-hidden="true">Hover</span>'
                hinted = True
        else:
            media = f'<img src="{esc(it["image"])}" alt="" loading="lazy" decoding="async">'
        badge = ''
        if it.get('status') in BADGES:
            cls, label = BADGES[it['status']]
            badge = f'<span class="tool-badge {cls}">{label}</span>'
        inner = (f'<figure class="tool-img">{media}</figure>'
                 f'<span class="tool-title"><span class="tool-name" title="{name}">{name}</span>{badge}</span>'
                 f'<span class="tool-desc">{desc}</span>')
        cards.append(f'<li class="tool">' + (f'<a href="{esc(it["url"])}" target="_blank" rel="noopener">{inner}</a>'
                                             if it['url'] else f'<div>{inner}</div>') + '</li>')
    cards = '\n'.join(cards)
    return f'''<article class="arc-item arc-tools" id="side-quests">
<div class="arc-head alt-body">
<h2 class="arc-title"><a href="#side-quests">{esc(t["title"])}</a></h2>
<p class="arc-desc">{esc(t["summary"])}</p>
<span class="arc-meta"><span class="k">Count</span><span class="v">{n}</span></span>
</div>
<div class="tools-wrap">
<ul class="tools alt-body" aria-label="{esc(t["title"])}">
{cards}
</ul>
<div class="ss-bar tools-bar alt-body" hidden><span class="ss-count" aria-live="polite"></span><span class="ss-nav"><button class="tools-prev" type="button" aria-label="Previous tools">←</button><button class="tools-next" type="button" aria-label="Next tools">→</button></span></div>
</div>
</article>'''


def main():
    projects = json.load(open(os.path.join(ROOT, 'content', 'projects.json')))
    manifest = json.load(open(os.path.join(ROOT, 'assets', 'media', 'manifest.json')))
    side = json.load(open(os.path.join(ROOT, 'content', 'tools.json')))
    out = '\n\n'.join([tools(side)] + [item(p, manifest[p['slug']]) for p in projects])
    path = os.path.join(ROOT, 'index.html')
    page = open(path).read()
    page = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda m: f'{START}\n{out}\n{END}', page, flags=re.S)
    open(path, 'w').write(page)
    # one URL for now; lastmod is the build date
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>https://gavinpotenza.xyz/</loc><lastmod>{datetime.date.today().isoformat()}</lastmod></url>\n'
        '</urlset>\n')
    print(f'Wrote {len(side["items"])} side quests and {len(projects)} projects to index.html')


if __name__ == '__main__':
    main()
