/* Work: S / M / L image sizes, per-project slideshows, and the Side quests row. */
(function () {
  var arc = document.querySelector('.arc');
  if (!arc) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (x) { return (x < 10 ? '0' : '') + x; };

  /* ---------- sizes ---------- */
  var SIZE_KEY = 'arc-size';
  function setSize(size) {
    arc.dataset.size = size;
    arc.querySelectorAll('.arc-btn').forEach(function (b) {
      var on = b.dataset.size === size;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem(SIZE_KEY, size); } catch (e) {}
  }
  // restore the saved size without animating it on page load
  arc.classList.add('is-settling');
  try { var saved = localStorage.getItem(SIZE_KEY); if (/^[sml]$/.test(saved)) setSize(saved); } catch (e) {}
  requestAnimationFrame(function () { requestAnimationFrame(function () { arc.classList.remove('is-settling'); }); });
  arc.querySelectorAll('.arc-btn').forEach(function (b) {
    b.addEventListener('click', function () { setSize(b.dataset.size); });
  });

  /* ---------- slideshows ---------- */
  function load(slide) { // a slide holds one piece, or two side by side
    if (!slide) return;
    slide.querySelectorAll('[data-src]').forEach(function (m) {
      if (m.dataset.poster) { m.poster = m.dataset.poster; m.removeAttribute('data-poster'); }
      if (m.tagName === 'VIDEO') m.addEventListener('loadeddata', function () { if (slide.classList.contains('is-on') && m._want) m.play().catch(function () {}); });
      m.src = m.dataset.src;
      m.removeAttribute('data-src');
    });
  }

  function Slideshow(root) {
    var slides = [].slice.call(root.querySelectorAll('.ss-slide'));
    var n = slides.length, i = 0, visible = false;
    var item = root.closest('.arc-item');
    var count = item.querySelector('.ss-count');
    // the frame keeps its shape for normal slides and shortens for a wider one, so no image sits under empty space
    var base = parseFloat(root.style.getPropertyValue('--ar')) || 1.5;
    function fit(k) { root.style.setProperty('--ar', Math.max(base, parseFloat(slides[k].dataset.ar) || base)); }
    var playing = !still; // reduced motion: videos wait for Play

    // looping video gets a visible Pause / Play, shown while a video slide is up
    var toggle = null;
    if (root.querySelector('video')) {
      toggle = document.createElement('button');
      toggle.type = 'button'; toggle.className = 'ss-play';
      var nav = item.querySelector('.ss-nav');
      if (nav) nav.insertBefore(toggle, nav.firstChild);
      toggle.addEventListener('click', function () { playing = !playing; sync(); });
    }

    function sync() {
      if (toggle) {
        toggle.hidden = !slides[i].querySelector('video');
        toggle.textContent = playing ? 'Pause' : 'Play';
      }
      slides.forEach(function (s, k) {
        s.querySelectorAll('video').forEach(function (v) {
          v._want = k === i && visible && playing;
          if (v._want) { if (v.getAttribute('src')) v.play().catch(function () {}); }
          else if (!v.paused) v.pause();
        });
      });
    }
    function go(k) {
      if (n < 2) return;
      k = (k + n) % n;
      load(slides[k]);
      slides[i].classList.remove('is-on');
      slides[k].classList.add('is-on');
      fit(k);
      // paired videos start together so the two halves stay in step
      var pv = slides[k].querySelectorAll('video');
      if (pv.length > 1) pv.forEach(function (v) { if (v.readyState) v.currentTime = 0; });
      i = k;
      load(slides[(k + 1) % n]); // warm the next one
      if (count) count.textContent = pad(i + 1) + ' / ' + pad(n);
      sync();
    }

    root.addEventListener('click', function (e) {
      if (e.target.closest('.ss-hit-prev')) go(i - 1);
      else if (e.target.closest('.ss-hit-next')) go(i + 1);
    });
    var prev = item.querySelector('.ss-prev'), next = item.querySelector('.ss-next');
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    });

    // swipe
    var sx = null, sy = null;
    root.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? i + 1 : i - 1);
      sx = sy = null;
    });

    // only load + play what's near the screen
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { load(slides[i]); load(slides[(i + 1) % n]); }
      });
    }, { rootMargin: '600px 0px' }).observe(root);
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting; sync();
    }, { threshold: 0.25 }).observe(root);
  }
  arc.querySelectorAll('.ss').forEach(Slideshow);

  /* ---------- side quests: video cards rest on a still frame and play on hover / focus ---------- */
  arc.querySelectorAll('.tool').forEach(function (card) {
    var v = card.querySelector('video');
    if (!v || still) return;
    function play() { if (v.dataset.src) { v.src = v.dataset.src; v.removeAttribute('data-src'); } v.play().catch(function () {}); }
    function rest() { v.pause(); }
    card.addEventListener('mouseenter', play); card.addEventListener('mouseleave', rest);
    card.addEventListener('focusin', play); card.addEventListener('focusout', rest);
  });

  /* ---------- side quests: sideways scroll with counter + arrows ---------- */
  arc.querySelectorAll('.tools-wrap').forEach(function (wrap) {
    var row = wrap.querySelector('.tools'), bar = wrap.querySelector('.tools-bar');
    var count = bar.querySelector('.ss-count'), cards = [].slice.call(row.children);
    var desc = wrap.parentNode.querySelector('.arc-desc');
    function inset() { // first card lines up with the description's left edge
      if (desc) row.style.setProperty('--inset', desc.getBoundingClientRect().left + 'px');
    }
    function update() {
      var over = row.scrollWidth > row.clientWidth + 2;
      bar.hidden = !over;
      if (!over) return;
      var l = row.getBoundingClientRect().left, r = l + row.clientWidth, first = 0, last = 0;
      cards.forEach(function (c, k) {
        var b = c.getBoundingClientRect(), mid = (b.left + b.right) / 2;
        if (mid >= l && mid <= r) { if (!first) first = k + 1; last = k + 1; }
      });
      count.textContent = pad(first) + '–' + pad(last) + ' / ' + pad(cards.length);
    }
    function page(dir) { // one screenful of cards: the visible stretch right of the inset
      var step = row.clientWidth - (parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0);
      row.scrollBy({ left: dir * step, behavior: still ? 'auto' : 'smooth' });
    }
    bar.querySelector('.tools-prev').addEventListener('click', function () { page(-1); });
    bar.querySelector('.tools-next').addEventListener('click', function () { page(1); });
    row.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', function () { inset(); update(); });
    inset();
    new MutationObserver(function () { setTimeout(update, 550); }).observe(arc, { attributes: true, attributeFilter: ['data-size'] });
    update();
  });
})();
