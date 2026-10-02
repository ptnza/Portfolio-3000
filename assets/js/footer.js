/* Footer: version line + changelog overlay, PO Box overlay, copy-email. */
(function () {
  var el = document.querySelector('.ft-base');
  if (!el) return;
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* version line: the build hash changes whenever the bio or archive copy does */
  var meta = el.querySelector('.ft-meta');
  var up = new Date(el.dataset.updated + 'T12:00:00');
  var src = Array.prototype.map.call(document.querySelectorAll('.ed-set, .arc'), function (e) { return e.textContent; }).join('|');
  var h = 5381; for (var i = 0; i < src.length; i++) { h = ((h << 5) + h + src.charCodeAt(i)) >>> 0; }
  meta.textContent = 'v' + el.dataset.version + ', updated ' +
    up.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', build ' + h.toString(16).slice(-6);

  /* overlays live on <html>, above everything */
  function overlay(html) {
    var o = document.createElement('ft-log'); o.innerHTML = html; o.setAttribute('aria-hidden', 'true'); root.appendChild(o);
    o.querySelectorAll('.t').forEach(function (t) { t.dataset.full = t.textContent; t.textContent = ''; });
    return o;
  }
  var logO = overlay(el.querySelector('.ft-entries').innerHTML);
  var lines = (el.querySelector('.ft-address').dataset.lines || '').split('|').join('\n');
  var addrO = overlay('<span class="e changelog"><span class="v"></span><span class="t"></span></span>'); // the address starts with "PO Box", so no label
  addrO.querySelector('.t').dataset.full = lines;
  var overlays = [logO, addrO];

  /* snap the overlay to the header grid: labels under the name, text under the nav */
  function align() {
    var c1 = document.querySelector('.top-name'), c2 = document.querySelector('.top-nav');
    overlays.forEach(function (o) { o.style.removeProperty('--pad-l'); o.style.removeProperty('--ver-col'); });
    if (!c1 || !c2) return;
    var l = c1.getBoundingClientRect().left, r = c2.getBoundingClientRect().left;
    if (r - l < 40) return;
    overlays.forEach(function (o) { o.style.setProperty('--pad-l', l + 'px'); o.style.setProperty('--ver-col', (r - l) + 'px'); });
  }
  addEventListener('resize', align);

  /* typewriter: entries appear one after another, each typed out */
  function type(o, on) {
    clearInterval(o._t);
    var ts = [].slice.call(o.querySelectorAll('.t')), es = [].slice.call(o.querySelectorAll('.e'));
    ts.forEach(function (t) { t.textContent = ''; }); es.forEach(function (e) { e.classList.remove('go'); });
    if (!on) return;
    if (still) { ts.forEach(function (t) { t.textContent = t.dataset.full; }); es.forEach(function (e) { e.classList.add('go'); }); return; }
    var k = 0, n = 0; if (es[0]) es[0].classList.add('go');
    o._t = setInterval(function () {
      var t = ts[k]; if (!t) { clearInterval(o._t); return; }
      n++; t.textContent = t.dataset.full.slice(0, n);
      if (n >= t.dataset.full.length) { k++; n = 0; if (es[k]) es[k].classList.add('go'); }
    }, 22);
  }

  var active = null, pinned = false;
  function show(o, trigger, on) {
    if (on) align();
    o.classList.toggle('on', on);
    trigger.setAttribute('aria-expanded', String(on));
    type(o, on);
    // the overlay types itself out visually; screen readers get the whole text once
    var st = document.getElementById('ft-status');
    if (st && on) { st.textContent = ''; st.textContent = [].map.call(o.querySelectorAll('.e'), function (e) { return [e.querySelector('.v').textContent, e.querySelector('.t').dataset.full].join(' ').trim(); }).join(' '); }
    active = on ? { o: o, t: trigger } : null;
  }
  function hideAll() { if (active) show(active.o, active.t, false); pinned = false; }
  function bind(trigger, o) {
    trigger.addEventListener('mouseenter', function () { if (!pinned) { if (active) show(active.o, active.t, false); show(o, trigger, true); } });
    trigger.addEventListener('mouseleave', function () { if (!pinned) show(o, trigger, false); });
    function toggle() { var on = !(pinned && active && active.o === o); hideAll(); if (on) { pinned = true; show(o, trigger, true); } }
    trigger.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
  }
  bind(meta, logO);
  var po = document.querySelector('.ft-po'); if (po) bind(po, addrO);
  document.addEventListener('click', function () { if (pinned) hideAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideAll(); });

  addEventListener('scroll', function () { if (pinned) hideAll(); }, { passive: true });

  /* email: every address on the page copies instead of opening a mail app.
     The footer word shows "Copy" on hover; all of them show "Copied" after a click. */
  var st = document.getElementById('ft-status');
  document.querySelectorAll('[data-email]').forEach(function (em) {
    var addr = em.dataset.email, arrow = em.classList.contains('ft-email'), rest = em.textContent, timer, copied = false, over = false;
    function paint() {
      var word = copied ? 'Copied' : arrow && over ? 'Copy' : arrow ? 'Email' : rest;
      if (arrow) em.innerHTML = '<span aria-hidden="true">↖</span>' + word; else em.textContent = word;
    }
    function copy() {
      if (!(navigator.clipboard && window.isSecureContext)) { location.href = 'mailto:' + addr; return; }
      navigator.clipboard.writeText(addr).then(function () {
        if (!arrow && !copied) em.style.minWidth = em.offsetWidth + 'px';   // "Copied" is shorter: keep the width so nothing shifts
        copied = true; paint(); clearTimeout(timer);
        if (st) { st.textContent = ''; st.textContent = 'Email address copied'; }
        timer = setTimeout(function () { copied = false; paint(); em.style.minWidth = ''; }, 1600);
      }, function () { location.href = 'mailto:' + addr; });
    }
    if (arrow) {
      ['mouseenter', 'focus'].forEach(function (t) { em.addEventListener(t, function () { over = true; paint(); }); });
      ['mouseleave', 'blur'].forEach(function (t) { em.addEventListener(t, function () { over = false; paint(); }); });
    }
    em.addEventListener('click', function (e) { e.stopPropagation(); copy(); });
    paint();
  });
})();
