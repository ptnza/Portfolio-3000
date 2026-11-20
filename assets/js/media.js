/* Images fade in as they finish loading (see "loading and first-impression motion" in site.css).
   Slides and tool posters load late (archive.js swaps data-src for src), so each one is watched. */
(function () {
  var root = document.documentElement;
  root.classList.add('fade-media');
  function done(img) { img.classList.add('is-loaded'); }
  document.querySelectorAll('.ss img, .tool-img img').forEach(function (img) {
    if (img.complete && img.naturalWidth) { done(img); return; }   // already here: no fade
    img.addEventListener('load', function () { done(img); }, { once: true });
    img.addEventListener('error', function () { done(img); }, { once: true });   // never leave a broken image hidden
  });
})();
