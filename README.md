# gavinpotenza.xyz

Portfolio of Gavin Potenza, creative director. A static one-pager: hand-written HTML, one stylesheet, vanilla JS. No framework and no build step to serve. Two Python scripts prepare media and generate the Work section. Hosted on Cloudflare Pages from `main` at [gavinpotenza.xyz](https://gavinpotenza.xyz).

## Structure

- `index.html` is the page: header, Profile (bio and info columns), Work, footer. Everything between the `<!-- archive:start -->` and `<!-- archive:end -->` markers is written by `tools/build_html.py`. Everything outside them is hand-written.
- `404.html` is the not-found page. Same stylesheet, `noindex`.
- `content/tools.json` is Side quests, the tool row that always leads Work. Top level: `title`, `summary`, `items`. Each item:
  - `name`, `desc`
  - `status`: `live` (lime badge), `progress` (outlined badge) or blank
  - `url`: blank for no link. A linked card with a `live` badge gets an ↗ and a glow on hover.
  - `image`: 16:10, or a video's first frame
  - `video`: optional, rests on `image` and plays on hover or focus

  Order is display order. Media lives in `assets/media/tools/`.
- `content/projects.json` is Work, in display order. Rendered: `title`, `summary`, `role`, `with`, `year` (empty hides the row). Optional `alts` gives each slide a description, in slide order. `client`, `lede`, `body`, `credits` and `link` are kept but not rendered.
- `assets/media/<project>/` holds the slides. `manifest.json` lists them per project slug, each `{type, src, w, h}`, plus `poster` for video. Stills are JPG, or WebP where the original was a PNG. Video is H.264 MP4 with a JPG first frame.
- A slide can be a pair: `{"type": "pair", "items": [a, b], "w", "h"}` shows two pieces side by side as one rounded image, each half sized by its own ratio. Pairs, WebP stills and added slides are hand edits in `manifest.json`. `build_media.py` doesn't make them and replaces them for any project it rebuilds.
- `assets/hover/` holds the bio hover media (the quote clipping, studio logos, project stills and video) and a screenshot for each footer link, `profile-{linkedin,github,twitter,instagram,datalands}.jpg`. A missing file means no hover image for that link.
- `assets/fonts/` holds PP Neue Montreal as `.woff2`: Book (350), Regular (400), Italic (400), Medium (500). Declared at the top of `site.css`. Regular and Book are preloaded.
- `assets/og.jpg` is the 1200×630 social card. `og:`, `twitter:`, canonical and the Person JSON-LD all use absolute URLs.
- `assets/favicon-{32,180,512}.png` and root `favicon.ico` are the orb.

## CSS

`assets/css/site.css`, in order: fonts, tokens, base, header, bio, profile, work, slideshow, footer, hover, motion, breakpoints.

- **Scale.** The root keeps the reader's browser font size as `--base`. `--rs` is the window-scaled unit (`1.08vw` between `.625em` and `1.0625em`), shifted by however far the reader's size is from 16px. Both are registered properties, computed once on `:root` and inherited as lengths. Every size and most spacing is a multiple of one or the other. (`--r` is something else: each slide's aspect ratio, set inline by the generator.)
- **Type.** Sizes are tokens named by role: `--text-display`, `--text-body`, `--text-body-md`, `--text-body-sm`, `--text-caption`, `--text-micro`, `--text-footer`, `--text-overlay`. Leading is `--leading-tight`, `--leading-ui` and `--leading-body`. Floors keep body at 16px and small text at 13px at the default setting.
- **Color.** One theme switch: `[data-theme]` on `<html>`, set to dark before paint by the head script. Light mode is its own palette on warm paper, not an inversion. `--soft` and `--faint` are opacities tuned to 5:1 or better in both themes. `--live` is the badge lime and means live, nothing else. `--glow-1` to `--glow-3` are its halo, stronger on paper.
- **Motion.** `--hover` is every hover transition: 200ms, `cubic-bezier(.4, 0, .2, 1)`. `--ease-out` is `cubic-bezier(.23, 1, .32, 1)`, used for one-time motion: the page entrance, images fading in, words and changelog lines settling. Hovers live inside `(hover: hover) and (pointer: fine)`. Movement lives inside `prefers-reduced-motion: no-preference` and falls back to opacity. Theme changes switch with transitions off.
- **Breakpoints.** 768px and below is the phone layout. 769–1100px puts project credits under the description and the profile in two columns.

## JS

All deferred, no dependencies.

- `archive.js` handles S/M/L (default L, remembered per browser), slideshows (lazy media, keyboard arrows, a Pause control for video) and the Side quests strip (counter, and arrows that land on exact card edges).
- `hover-media.js` handles bio and footer hovers on fine pointers: the clipping that follows the cursor, logos and work behind the text, the stretch effect on footer screenshots, and the dim. The dim fades one shared value (`--hm-t`), so all text moves together. Keyboard focus triggers the same images.
- `profile.js` folds the profile lists into `<details>` rows on phones, groups Recognition, Talks, Shows and Published in under "Recognition & appearances", and animates each panel's height. Wide screens keep everything open.
- `footer.js` writes the version line and build hash, runs the changelog and PO Box overlays (typed out visually, announced whole), and makes every email address copy on click.
- `media.js` fades images in as they finish loading.
- `theme.js` is the light and dark toggle, for the current visit only.

## Tools

- `tools/build_html.py` renders `content/` and `manifest.json` into `index.html` between the markers, and writes `sitemap.xml` with today's date.
- `tools/build_media.py [export folder] [slug …]` resizes stills to 2400px and video to 1920px H.264 with first-frame posters, and merges them into `manifest.json`. It only touches the projects named. Slide order and the three lead images per project are set in `PROJECTS` at the top. Needs ffmpeg, and `sips` on macOS.

## Editing

- Project text: edit `content/projects.json`, then `python3 tools/build_html.py`.
- A new tool: add it to `content/tools.json` with its media in `assets/media/tools/`, then `build_html.py`.
- New images: `python3 tools/build_media.py ~/Downloads/portfolio-content nike`, then `build_html.py`.
- A new version: `data-version` and `data-updated` on `.ft-base` in `index.html`, plus a changelog line.

## Hosting

Cloudflare Pages, deployed from `main`, output directory `/`, no build command.

- `_headers` caches media, hover images and the social card for a day and fonts for a year. HTML, CSS and JS revalidate on every visit, so changes show up at once.
- `404.html` is served with a real 404 status. `robots.txt` points to `sitemap.xml`.
- `wrangler.jsonc` and `.assetsignore` let the same repo deploy as a Worker with static assets. `.assetsignore` keeps `content/`, `tools/` and the rest of the repo-only files off the site.

## Preview

```
python3 -m http.server 4173
```

## Rights

The code is here to read and learn from. The work, images, video and writing are © Gavin Potenza, all rights reserved, and aren't licensed for reuse.
