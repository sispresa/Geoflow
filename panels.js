/* Panel simulasi: bisa disembunyikan (desktop) dan menjadi lembar bawah (ponsel). */
(function () {
  'use strict';
  var app = document.getElementById('app'), L = document.querySelector('.left-panel'), R = document.querySelector('.right-panel');
  if (!app || !L || !R) return;
  function mk(cls, label) { var b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); b.title = label; app.appendChild(b); return b; }
  var tl = mk('panel-toggle tl', 'Sembunyikan/tampilkan panel kontrol'), tr = mk('panel-toggle tr', 'Sembunyikan/tampilkan panel informasi');
  function sync() {
    var lc = L.classList.contains('collapsed'), rc = R.classList.contains('collapsed');
    tl.textContent = lc ? '›' : '‹'; tr.textContent = rc ? '‹' : '›';
    tl.classList.toggle('collapsed', lc); tr.classList.toggle('collapsed', rc);
  }
  tl.addEventListener('click', function () { L.classList.toggle('collapsed'); sync(); });
  tr.addEventListener('click', function () { R.classList.toggle('collapsed'); sync(); });
  var bar = document.createElement('div'); bar.className = 'mobile-bar';
  bar.innerHTML = '<button type="button" data-t="L">⚙ Kontrol</button><button type="button" data-t="R">ℹ Info</button>';
  app.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var P = b.getAttribute('data-t') === 'L' ? L : R, O = P === L ? R : L;
    O.classList.remove('m-open'); P.classList.toggle('m-open');
  });
  document.getElementById('viewport').addEventListener('pointerdown', function () { L.classList.remove('m-open'); R.classList.remove('m-open'); });
  sync();
})();
