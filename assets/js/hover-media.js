/* Hover media for the bio and footer links.
   data-clip="img.png" data-clip-by="Caption"   → clipping that follows the cursor
   data-quad="img.jpg" (or .mp4)                → full-screen image behind the text
   data-center="logo.png" data-center-scale="1.3" → centered logo behind the text (scale is optional)
   data-quad="shot.jpg" data-fx="stretch" data-cut="529" → pixel-stretch marquee (see STRETCH)
   Quad and center hovers also dim the rest of the copy. */
(function () {
  if (!matchMedia('(hover: hover)').matches) return; // touch: links just work as links
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- settings ---------- */
  var CLIP = {
    follow: 0.18,     // how fast it catches the cursor (lower = lazier)
    tilt: 0.6,        // swing when moving sideways
    maxTilt: 6,       // cap on the swing, degrees
    rest: -2          // resting tilt, degrees
  };
  var BG = {
    drift: 1.09,      // Ken Burns zoom (1 = off)
    driftTime: 10,    // seconds
    fadeIn: 0.12,     // how fast images appear
    exitFade: 0.06,   // how fast they fade out (lower = softer)
    dim: 1,           // image brightness (0.7 = darker, helps text read)
    centerWidth: 1,   // logos: width, share of the window
    centerMaxH: 0.6,  // logos: tallest, share of the window height
    centerMaxW: 0.92  // logos: widest, share of the window width
  };
  var STRETCH = {
    speed: 300,       // px per second, right to left
    length: 1680,     // px of stretch after the cut
    amp: 0.03,        // peak bounce, share of the window height
    wave: 260,        // px from crest to crest along the trail
    tempo: 1,         // bounce speed multiplier (lower = slower)
    jitter: 0.3,      // share of each strip's bounce that's its own (0 = smooth wave, 1 = noise)
    peak: 0.75,       // where the bounce peaks: slow build before, quicker settle after
    band: [3, 20],    // strip widths, px (min, max)
    vary: 0.15        // each hover nudges amp / wave / tempo by up to ±15%
  };
  var TEXT_DIM = {
    amount: 0.3,      // copy opacity while an image is up
    time: 0.5         // fade, seconds (keep in step with site.css)
  };

  var isVideo = function (u) { return /\.(mp4|webm|m4v)$/i.test(u); };

  /* ---------- shared ---------- */
  var mx = innerWidth / 2, my = innerHeight / 2, raf = null, ratios = {}, missing = {};
  addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  function run() { if (!raf) raf = requestAnimationFrame(tick); }
  function preload(u, keepRatio) {
    if (isVideo(u)) return; // videos load on first hover, not with the page
    var im = new Image();
    im.onerror = function () { missing[u] = true; }; // no file yet: the link just stays a link
    if (keepRatio) im.onload = function () { if (im.naturalHeight) ratios[u] = im.naturalWidth / im.naturalHeight; };
    im.src = u;
  }

  /* ---------- clipping ---------- */
  var clip = document.createElement('figure');
  clip.className = 'clip-float';
  clip.setAttribute('aria-hidden', 'true');
  clip.innerHTML = '<img alt=""><figcaption></figcaption>';
  document.body.appendChild(clip);
  var cImg = clip.querySelector('img'), cCap = clip.querySelector('figcaption');
  var C = { x: 0, y: 0, rot: CLIP.rest, s: .9, o: 0, on: false };

  /* ---------- background layer (quad + center) ---------- */
  var bg = document.createElement('div');
  bg.setAttribute('aria-hidden', 'true');
  bg.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1';
  document.body.appendChild(bg);
  var cell = null, B = { o: 0, on: false };

  /* pixel stretch: [image up to cut][cut line stretched, strips bouncing][rest of image], looped.
     Horizontal by default (column stretched, scrolls right to left); data-axis="y" stretches a row
     and scrolls bottom to top. Any STRETCH setting can be overridden per link, e.g. data-amp="0.06",
     data-band="4,30". Each hover also nudges the settings a little, so no two runs match. */
  function hash(n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }
  function stretchOpts(d) {
    var o = {}, r = function (k) { return 1 + (Math.random() - .5) * 2 * STRETCH.vary; };
    for (var k in STRETCH) o[k] = STRETCH[k];
    ['speed', 'length', 'amp', 'peak', 'wave', 'tempo', 'jitter'].forEach(function (k) { if (d[k] !== undefined) o[k] = +d[k]; });
    if (d.band) o.band = d.band.split(',').map(Number);
    o.amp *= r(); o.wave *= r(); o.tempo *= r();
    o.cut = +d.cut || 0; o.axis = d.axis === 'y' ? 'y' : 'x'; o.seed = Math.random() * 1000;
    return o;
  }
  function stretchCanvas(url, o) {
    var cv = document.createElement('canvas'), g = cv.getContext('2d'), im = new Image(), src = null, t0 = null;
    im.onload = function () {
      if (o.axis === 'x') { src = im; return; }
      // vertical: work on a transposed copy, then draw it transposed back
      src = document.createElement('canvas'); src.width = im.naturalHeight; src.height = im.naturalWidth;
      var tg = src.getContext('2d'); tg.setTransform(0, 1, 1, 0, 0, 0); tg.drawImage(im, 0, 0);
    };
    im.src = url;
    function frame(t) {
      if (t0 !== null && !cv.isConnected) return; // hover image gone: stop
      if (t0 === null) t0 = t;
      requestAnimationFrame(frame);
      if (!src) return;
      var dpr = devicePixelRatio || 1, SW = innerWidth, SH = innerHeight;
      if (cv.width !== Math.round(SW * dpr) || cv.height !== Math.round(SH * dpr)) { cv.width = Math.round(SW * dpr); cv.height = Math.round(SH * dpr); }
      var flip = o.axis === 'y', W = flip ? SH : SW, H = flip ? SW : SH; // W runs along the stretch
      if (flip) g.setTransform(0, dpr, dpr, 0, 0, 0); else g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = false;
      var iw = src.width, ih = src.height, sc = Math.max(W / iw, H / ih), cut = o.cut;
      var dh = ih * sc, oy = (H - dh) / 2, ox = (W - iw * sc) / 2;
      var head = cut * sc, tail = (iw - cut) * sc, B = o.length, P = o.peak;
      var tile = head + B + tail, sec = (t - t0) / 1000, T = sec * o.tempo;
      var shift = still ? 0 : (sec * o.speed) % tile;
      g.clearRect(0, 0, W, H);
      for (var x0 = ox - shift; x0 < W; x0 += tile) {
        if (x0 + tile < 0) continue;
        g.drawImage(src, 0, 0, cut, ih, x0, oy, head + 1, dh);
        var w0 = x0 + head, x = w0, i = 0;
        while (x < w0 + B) {
          var bw = Math.min(o.band[0] + Math.floor(hash(i + o.seed) * (o.band[1] - o.band[0])), w0 + B - x);
          if (x + bw > 0 && x < W) {
            var u = (x - w0) / B; // 0 at both ends, so both joins are clean
            var env = u < P ? (1 - Math.cos(Math.PI * u / P)) / 2 : (1 + Math.cos(Math.PI * (u - P) / (1 - P))) / 2;
            var ph = (x - w0) / o.wave * 6.283;
            var dy = still ? 0 : env * o.amp * H * ((1 - o.jitter) * Math.sin(T * 1.6 + ph) + o.jitter * Math.sin(T * 2.7 + hash(i + o.seed + 99) * 6.283));
            var sy = ((dy / sc) % ih + ih) % ih; // wrap end to end
            if (ih - sy > 0) g.drawImage(src, cut, sy, 1, ih - sy, x, oy, bw + 1, (ih - sy) * sc);
            if (sy > 0) g.drawImage(src, cut, 0, 1, sy, x, oy + (ih - sy) * sc, bw + 1, sy * sc);
          }
          x += bw; i++;
        }
        g.drawImage(src, cut, 0, iw - cut, ih, w0 + B, oy, tail, dh);
      }
    }
    requestAnimationFrame(frame);
    return cv;
  }

  function showBg(url, center, scale, fx) {
    bg.innerHTML = '';
    var box = 'left:0;top:0;width:100vw;height:100vh';
    if (center) {
      var VW = innerWidth, VH = innerHeight, ratio = ratios[url] || 4 / 3;
      var cw = VW * BG.centerWidth * scale, ch = cw / ratio;
      if (ch > VH * BG.centerMaxH * scale) { ch = VH * BG.centerMaxH * scale; cw = ch * ratio; }
      if (cw > VW * BG.centerMaxW) { cw = VW * BG.centerMaxW; ch = cw / ratio; }
      box = 'left:' + (VW - cw) / 2 + 'px;top:' + (VH - ch) / 2 + 'px;width:' + cw + 'px;height:' + ch + 'px';
    }
    cell = document.createElement('div');
    cell.style.cssText = 'position:absolute;overflow:hidden;opacity:0;will-change:opacity;' + box;
    var im;
    if (fx && fx.fx === 'stretch') {
      im = stretchCanvas(url, stretchOpts(fx));
    } else if (isVideo(url)) {
      im = document.createElement('video');
      im.muted = true; im.loop = true; im.playsInline = true; im.autoplay = true;
      im.addEventListener('loadeddata', function () { im.play().catch(function () {}); });
      im.src = url;
    } else {
      im = document.createElement('img');
      im.src = url; im.alt = '';
    }
    im.style.cssText = 'display:block;width:100%;height:100%;max-width:none;max-height:none;' +
      'object-fit:' + (center ? 'contain' : 'cover') + ';filter:brightness(' + (fx && fx.dim ? +fx.dim : BG.dim) + ')' +
      (center && document.documentElement.dataset.theme === 'light' ? ' invert(1)' : ''); // white logos go black on the light page
    cell.appendChild(im); bg.appendChild(cell);
    if (im.play) im.play().catch(function () {});
    if (!still && BG.drift !== 1 && im.tagName !== 'CANVAS') {
      im.style.transformOrigin = (35 + Math.random() * 30) + '% ' + (35 + Math.random() * 30) + '%';
      void im.offsetWidth;
      im.style.transition = 'transform ' + BG.driftTime + 's cubic-bezier(.2,.6,.3,1)';
      im.style.transform = 'scale(' + BG.drift + ')';
    }
    B.o = 0; B.on = true; run();
  }

  /* ---------- text dim ---------- */
  var animTimer = null, lastBase = null;
  function rgbaOf(c) {
    var n = (c.match(/[\d.]+/g) || []).map(Number);
    if (/^color\(/.test(c)) n = [n[0] * 255, n[1] * 255, n[2] * 255, n.length > 3 ? n[3] : 1];
    return { r: Math.round(n[0] || 0), g: Math.round(n[1] || 0), b: Math.round(n[2] || 0), a: n.length > 3 ? n[3] : 1 };
  }
  function rgba(c, a) { return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
  function dimOn(el) {
    var body = document.body;
    // read the resting color once, not mid-fade when sliding between links
    if (!body.classList.contains('hm-anim')) el._hmBase = rgbaOf(getComputedStyle(el).color);
    else if (!el._hmBase) el._hmBase = lastBase || rgbaOf(getComputedStyle(el).color);
    var base = lastBase = el._hmBase;
    clearTimeout(animTimer);
    body.style.setProperty('--hm-dim', rgba(base, TEXT_DIM.amount));
    if (el._hmColor === undefined) el._hmColor = [el.style.getPropertyValue('color'), el.style.getPropertyPriority('color')];
    el.style.setProperty('color', rgba(base, base.a), 'important'); // hovered link stays bright
    el.classList.add('hm-active');
    body.classList.add('hm-anim');
    void body.offsetWidth;
    body.classList.add('hm-on');
  }
  function dimOff(el) {
    document.body.classList.remove('hm-on');
    el.classList.remove('hm-active');
    if (el._hmColor) { el.style.setProperty('color', el._hmColor[0], el._hmColor[1]); el._hmColor = undefined; }
    clearTimeout(animTimer);
    animTimer = setTimeout(function () { document.body.classList.remove('hm-anim'); }, TEXT_DIM.time * 1000 + 100);
  }

  /* ---------- animation loop ---------- */
  function tick() {
    var active = false;

    // clipping
    var px = C.x, ease = still ? 1 : CLIP.follow;
    C.x += (mx - C.x) * ease; C.y += (my - C.y) * ease;
    var tr = still ? CLIP.rest : CLIP.rest + Math.max(-CLIP.maxTilt, Math.min(CLIP.maxTilt, (C.x - px) * CLIP.tilt));
    C.rot += (tr - C.rot) * .15;
    C.s += ((C.on ? 1 : .96) - C.s) * .2; // exit shrinks less than it grew
    C.o += ((C.on ? 1 : 0) - C.o) * .25;
    if (C.on || C.o > .01) {
      active = true;
      var w = clip.offsetWidth, h = clip.offsetHeight;
      var left = Math.min(Math.max(C.x - w / 2, 12), innerWidth - w - 12);
      var top = Math.max(C.y - h - 20, 12);
      clip.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0) rotate(' + C.rot + 'deg) scale(' + C.s + ')';
    }
    clip.style.opacity = C.o;
    clip.style.filter = !still && !C.on && C.o < .99 ? 'blur(' + ((1 - C.o) * 4).toFixed(2) + 'px)' : ''; // exits soften, entrances stay crisp

    // background image
    if (cell) {
      B.o += ((B.on ? 1 : 0) - B.o) * (still ? 1 : (B.on ? BG.fadeIn : BG.exitFade));
      cell.style.opacity = B.o;
      if (B.on || B.o > .01) active = true;
      else { bg.innerHTML = ''; cell = null; }
    }

    raf = active ? requestAnimationFrame(tick) : null;
  }

  /* ---------- wiring ---------- */
  function enterClip(e) {
    var el = e.currentTarget;
    if (cImg.getAttribute('src') !== el.dataset.clip) cImg.src = el.dataset.clip;
    cCap.textContent = el.dataset.clipBy || '';
    if (e.type === 'focus') { var r = el.getBoundingClientRect(); e = { clientX: r.left + r.width / 2, clientY: r.top }; } // keyboard: float over the link
    mx = C.x = e.clientX; my = C.y = e.clientY; C.on = true; run();
  }
  function leaveClip() { C.on = false; run(); }
  function enterQuad(e) {
    var u = e.currentTarget.dataset.quad.trim();
    if (missing[u]) return;
    e.currentTarget._hmOn = true; showBg(u, false, 1, e.currentTarget.dataset); dimOn(e.currentTarget);
  }
  function enterCenter(e) {
    var el = e.currentTarget;
    showBg(el.dataset.center.trim(), true, +el.dataset.centerScale || 1, el.dataset); dimOn(el);
  }
  function leaveBg(e) {
    var el = e.currentTarget;
    if (el.dataset.quad && !el._hmOn) return;
    el._hmOn = false; B.on = false; run(); dimOff(el);
  }

  document.querySelectorAll('[data-clip], [data-quad], [data-center]').forEach(function (el) {
    var d = el.dataset;
    // hover and keyboard focus show the same image
    function on(enter, leave) { el.addEventListener('mouseenter', enter); el.addEventListener('focus', function (e) { if (el.matches(':focus-visible')) enter(e); }); el.addEventListener('mouseleave', leave); el.addEventListener('blur', leave); }
    if (d.clip) { preload(d.clip); on(enterClip, leaveClip); }
    else if (d.quad) { preload(d.quad.trim()); on(enterQuad, leaveBg); }
    else { preload(d.center.trim(), true); on(enterCenter, leaveBg); }
  });
})();
