/* Profile lists: open columns on wide screens; on phones each list folds to one row
   ("Experience 6 +") so Work isn't buried. Recognition, Published in, Talks and Shows
   share one row on phones, "Recognition & appearances", and go back to their own columns
   on wide screens. Markup ships open, so no-JS shows everything. */
(function () {
  var folds = [].slice.call(document.querySelectorAll('.ed-fold'));
  if (!folds.length) return;
  var phone = matchMedia('(max-width: 768px)');

  function count(d, n) { var c = document.createElement('span'); c.className = 'ed-count'; c.textContent = n; d.querySelector('summary').appendChild(c); }
  function fold(d) { d.querySelector('summary').addEventListener('click', function (e) { if (!phone.matches || d.parentNode.closest('.ed-group')) e.preventDefault(); }); }
  folds.forEach(function (d) { var list = d.querySelector('ul'); if (list) count(d, list.children.length); fold(d); });

  // the phone-only group, and a marker where each member lives on wide screens
  var members = folds.filter(function (d) { return d.hasAttribute('data-group'); });
  var group = document.createElement('details');
  group.className = 'ed-sec ed-fold ed-group';
  group.innerHTML = '<summary><h2 class="label">Recognition &amp; appearances</h2></summary><div class="ed-group-body"></div>';
  count(group, members.reduce(function (n, d) { return n + d.querySelectorAll('li').length; }, 0));
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
      d.open = inGroup || !phone.matches;   // sections inside the group are always open, with plain headings
      d.querySelector('summary').tabIndex = phone.matches && !inGroup ? 0 : -1;
    });
  }
  sync();
  phone.addEventListener('change', sync);
})();
