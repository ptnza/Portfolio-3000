/* Light / dark: one switch, [data-theme] on <html>. The site always opens dark (head script);
   the toggle switches for the current visit only. */
(function () {
  var root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]');
  var btn = document.querySelector('.theme-btn');
  function set(t) {
    // switch with every transition off, so the page snaps instead of smearing
    var off = document.createElement('style');
    off.textContent = '*,*::before,*::after{transition:none !important}';
    document.head.appendChild(off);
    root.dataset.theme = t;
    void document.body.offsetHeight;
    requestAnimationFrame(function () { requestAnimationFrame(function () { off.remove(); }); });
    paint();
  }
  function paint() {
    var dark = root.dataset.theme !== 'light';
    if (btn) btn.setAttribute('aria-pressed', String(dark));
    if (meta) meta.content = dark ? '#000000' : '#f3f1ec';
  }
  if (btn) btn.addEventListener('click', function () { set(root.dataset.theme === 'light' ? 'dark' : 'light'); });
  paint();
})();
