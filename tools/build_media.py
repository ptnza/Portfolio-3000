#!/usr/bin/env python3
"""Optimise portfolio media from the Cargo export into assets/media/<project>/.

Usage: python3 tools/build_media.py [path-to-portfolio-content] [slug ...]
Needs ffmpeg/ffprobe (brew install ffmpeg) and macOS sips.
Updates only the named projects (all, if none named) in assets/media/manifest.json and
leaves the rest alone. Hand edits in the manifest (pairs, added slides, WebP stills)
are replaced for any project you rebuild, so name just the ones you mean to.
"""
import json, os, subprocess, sys

SRC = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Downloads/portfolio-content')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'media')
MAX = 2400          # long edge for stills
VMAX = 1920         # long edge for video
STILL = ('.jpg', '.jpeg', '.png')
MOVING = ('.gif', '.mov', '.mp4', '.m4v')

# Slideshow order: the three archive picks lead (matched to their project
# originals by 1-based page position), then the rest of the page in order.
PROJECTS = [
    ('calendly',   'calendly/selects',        [14, 12, 13]),
    ('superhuman', 'current-site/01-superhuman', [1, 3, 4]),
    ('lululemon',  'current-site/02-lululemon',  [2, 1, 3]),
    ('nike',       'current-site/03-nike',       [2, 5, 4]),
    ('microsoft',  'current-site/04-microsoft',  [1, 2, 7]),
    ('volta',      'current-site/05-volta',      [2, 3, 1]),
    ('dnd',        'current-site/07-dnd',        [1, 3, 2]),
]


def run(*cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def dims(path):
    out = run('ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
              'stream=width,height', '-of', 'csv=p=0', path)
    w, h = out.strip().split('\n')[0].split(',')[:2]
    return int(w), int(h)


def has_alpha(path):
    return 'hasAlpha: yes' in run('sips', '-g', 'hasAlpha', path)


def still(src, dst_base):
    png = src.lower().endswith('.png') and has_alpha(src)
    dst = dst_base + ('.png' if png else '.jpg')
    if not os.path.exists(dst):
        args = ['sips', '-Z', str(MAX)]
        args += ['-s', 'format', 'png'] if png else ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82']
        w, h = dims(src)
        if max(w, h) <= MAX:
            args = args[:1] + args[3:]
        run(*args, src, '--out', dst)
    w, h = dims(dst)
    return {'type': 'image', 'src': rel(dst), 'w': w, 'h': h}


def moving(src, dst_base):
    dst, poster = dst_base + '.mp4', dst_base + '-poster.jpg'
    if not os.path.exists(dst):
        scale = (f"scale='if(gt(iw,ih),min({VMAX},iw),-2)':'if(gt(iw,ih),-2,min({VMAX},ih))',"
                 "scale=trunc(iw/2)*2:trunc(ih/2)*2")
        run('ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', scale, '-c:v', 'libx264',
            '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            '-an', dst)
    if not os.path.exists(poster):
        run('ffmpeg', '-v', 'error', '-y', '-i', dst, '-frames:v', '1', '-q:v', '4', poster)
    w, h = dims(dst)
    return {'type': 'video', 'src': rel(dst), 'poster': rel(poster), 'w': w, 'h': h}


def rel(p):
    return os.path.relpath(p, ROOT)


def main():
    path = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(path)) if os.path.exists(path) else {}
    only = set(sys.argv[2:])
    for slug, folder, lead in PROJECTS:
        if only and slug not in only:
            continue
        d = os.path.join(SRC, folder)
        files = sorted(f for f in os.listdir(d) if f.lower().endswith(STILL + MOVING))
        order = [files[i - 1] for i in lead] + [f for i, f in enumerate(files, 1) if i not in lead]
        os.makedirs(os.path.join(OUT, slug), exist_ok=True)
        slides = []
        for n, f in enumerate(order, 1):
            src, base = os.path.join(d, f), os.path.join(OUT, slug, f'{slug}-{n:02d}')
            slides.append((still if f.lower().endswith(STILL) else moving)(src, base))
            print(slug, n, f, '->', slides[-1]['src'], flush=True)
        manifest[slug] = slides
    with open(path, 'w') as fh:
        json.dump(manifest, fh, indent=1)
        fh.write('\n')


if __name__ == '__main__':
    main()
