# gavinpotenza.xyz

Portfolio of Gavin Potenza, creative director. A static one-pager with no build step to serve, hosted on
Cloudflare Workers (static assets) from `main` at [gavinpotenza.xyz](https://gavinpotenza.xyz).

## Structure
- `index.html` — header, Profile (bio + info columns), Work, footer. Everything outside the
  `<!-- archive:start/end -->` markers is hand-written.
- `content/tools.json` — Side quests, the tool row that always leads Work. Each item: `name`, `desc`,
  `status` (`live` = lime badge, `progress` = outlined badge, blank = none), `url` (blank = no link),
  `image` (16:10, or a video's still frame) and optional `video` (plays on hover). Order = display order.
  Media lives in `assets/media/tools/`.
- `content/projects.json` — Work copy: summary and role/with/year are rendered. `client`, `lede`, `body`, `credits`, `link` are kept but not shown (the Details drawer was removed).
- `assets/media/<project>/` — optimised slides; `manifest.json` lists them with sizes. Stills are JPG, or
  WebP where the original was a PNG; video is H.264 MP4 with a JPG still frame.
  A slide can be a **pair**: `{"type": "pair", "items": [a, b], "w", "h"}` shows two pieces side by side as one
  rounded image. Pairs, WebP stills and added slides are hand edits in `manifest.json`: `build_media.py` doesn't
  make them and replaces them for any project it rebuilds, so rebuild only the projects you mean to.
- `assets/og.jpg` — the 1200×630 social card; `og:` / `twitter:` tags, canonical and JSON-LD use
  absolute `https://gavinpotenza.xyz/` URLs.
- `404.html`, `robots.txt`, `_headers` — Cloudflare serves `404.html` (with a 404 status) for
  unknown paths and applies `_headers` (media cached a day; CSS/JS/HTML revalidate every visit). `sitemap.xml` is written by `build_html.py`.
- `wrangler.jsonc`, `.assetsignore` — Cloudflare deploy config; `.assetsignore` keeps repo-only files (`content/`, `tools/`, `.git` …) off the site.
- `assets/favicon-{32,180,512}.png` + root `favicon.ico` — the orb.
- `assets/hover/` — bio hover images (quote clipping, studio logos, Superhuman/Calendly), plus
  footer hover screenshots: `profile-{linkedin,github,twitter,instagram,datalands}.jpg`.
  A missing file just means no hover image for that link.
- `assets/js/` — `hover-media.js` (bio hovers), `archive.js` (S/M/L, slideshows), `footer.js` (changelog / PO Box overlays, footer email: Copy / Copied), `theme.js` (light / dark toggle).

## Editing
- Change project text → edit `content/projects.json`, then `python3 tools/build_html.py`.
- Add a tool → add an entry to `content/tools.json` (16:10 image, or an mp4 plus a still frame, in `assets/media/tools/`), then `python3 tools/build_html.py`.
- Change or add images → put originals in the export folder layout and run
  `python3 tools/build_media.py ~/Downloads/portfolio-content nike` (needs `brew install ffmpeg`; name the projects to rebuild),
  then `python3 tools/build_html.py`. Slide order and the three lead picks are set in `PROJECTS` at the top of `build_media.py`.
- Bump the footer version: `data-version` / `data-updated` on `.ft-base` in `index.html`, and add a changelog line.
- Leave `Year` empty in `projects.json` to hide that row.

## Preview
```
python3 -m http.server 4173
```

## Rights
The code is here to read and learn from. The work, images, video and writing are © Gavin Potenza,
all rights reserved, and aren't licensed for reuse.
