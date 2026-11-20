/* Profile lists: open columns on wide screens; on phones each list folds to one row
   ("Experience +") so Work isn't buried. Recognition, Published in, Talks and Shows
   share one row on phones, "Recognition & appearances", and go back to their own columns
   on wide screens. Markup ships open, so no-JS shows everything. */
(function () {
  var folds = [].slice.call(document.querySelectorAll('.ed-fold'));
  if (!folds.length) return;
  var phone = matchMedia('(max-width: 768px)');

  var still = matchMedia('(prefers-reduced-motion: reduce)');

  // open and close by animating the panel's height: 200ms, ease-out both ways.
  // A click mid-animation reverses from wherever the panel is.
  function toggle(d) {
    var panel = d.querySelector(':scope > :not(summary)');
    var from = d.open ? panel.getBoundingClientRect().height : 0;
    if (d._anim) d._anim.cancel();
    var opening = !d.open || d.classList.contains('is-closing');
    d.classList.remove('is-closing');
    d.open = true;
    var to = opening ? panel.getBoundingClientRect().height : 0;   // its natural height, now that it's open
    if (!opening) d.classList.add('is-closing');   // the × turns back to + right away
    if (still.matches) { finish(); return; }
    panel.style.overflow = 'hidden'; panel.style.boxSizing = 'border-box';   // the height we animate includes the padding
    var pad = getComputedStyle(panel).paddingBottom;   // the gap under the list folds away with it
    d._anim = panel.animate([{ height: from + 'px', paddingBottom: opening ? '0px' : pad }, { height: to + 'px', paddingBottom: opening ? pad : '0px' }],
      { duration: 200, easing: 'cubic-bezier(0, 0, .2, 1)' });
    d._anim.onfinish = finish;
    function finish() {
      d._anim = null; panel.style.overflow = panel.style.boxSizing = '';
      if (!opening) { d.open = false; d.classList.remove('is-closing'); }
    }
  }
  function fold(d) {
    d.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault();   // wide screens and sections inside the group never toggle
      if (phone.matches && !d.parentNode.closest('.ed-group')) toggle(d);
    });
  }
  folds.forEach(fold);

  // the phone-only group, and a marker where each member lives on wide screens
  var members = folds.filter(function (d) { return d.hasAttribute('data-group'); });
  var group = document.createElement('details');
  group.className = 'ed-sec ed-fold ed-group';
  group.innerHTML = '<summary><h2 class="label">Recognition &amp; appearances</h2></summary><div class="ed-group-body"></div>';
  fold(group);
  var body = group.querySelector('.ed-group-body');
  var homes = members.map(function (d) { var m = document.createComment('group'); d.parentNode.insertBefore(m, d); return m; });

  function sync() {
    if (phone.matches && members.length) {
      homes[0].parentNode.insertBefore(group, homes[0]);
      members.forEach(function (d) { body.appendChild(d); });
    } else if (group.parentNode) {
      members.forEach(function (d, i) { homes[i].parentNode.insertBefore(d, homes[i].nextSibling); });
      group.remove();
    }
    folds.concat(group).forEach(function (d) {
      var inGroup = d !== group && !!d.parentNode.closest('.ed-group');
      if (d._anim) { d._anim.cancel(); d._anim = null; d.classList.remove('is-closing'); var pn = d.querySelector(':scope > :not(summary)'); pn.style.overflow = pn.style.boxSizing = ''; }
      d.open = inGroup || !phone.matches;   // sections inside the group are always open, with plain headings
      d.querySelector('summary').tabIndex = phone.matches && !inGroup ? 0 : -1;
    });
  }
  sync();
  phone.addEventListener('change', sync);
})();
