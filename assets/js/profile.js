/* Profile lists: open columns on wide screens; on phones each list folds to one row
   ("Experience 6 +") so Work isn't buried. Markup ships open, so no-JS shows everything. */
(function () {
  var folds = document.querySelectorAll('.ed-fold');
  if (!folds.length) return;
  var phone = matchMedia('(max-width: 768px)');
  folds.forEach(function (d) {
    var sum = d.querySelector('summary'), list = d.querySelector('ul');
    if (list) { var n = document.createElement('span'); n.className = 'ed-count'; n.textContent = list.children.length; sum.appendChild(n); }
    sum.addEventListener('click', function (e) { if (!phone.matches) e.preventDefault(); }); // wide screens: always open
  });
  function sync() {
    folds.forEach(function (d) {
      d.open = !phone.matches;
      d.querySelector('summary').tabIndex = phone.matches ? 0 : -1;
    });
  }
  sync();
  phone.addEventListener('change', sync);
})();
