(function () {
  'use strict';
  if (GFAuth.authed()) { location.replace('./admin.html'); return; }
  var f = document.getElementById('loginForm'), err = document.getElementById('err'), u = document.getElementById('u'),
      p = document.getElementById('p'), sh = document.getElementById('showPw'), btn = document.getElementById('loginBtn'), timer;
  function tick() {
    var s = GFAuth.lockLeft();
    clearTimeout(timer);
    if (s > 0) { err.textContent = 'Terlalu banyak percobaan. Coba lagi dalam ' + s + ' detik.'; err.hidden = false; btn.disabled = true; timer = setTimeout(tick, 1000); }
    else { btn.disabled = false; if (/Terlalu/.test(err.textContent)) err.hidden = true; }
  }
  sh.addEventListener('change', function () { p.type = sh.checked ? 'text' : 'password'; });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = GFAuth.login(u.value, p.value);
    if (r.ok) { location.href = './admin.html'; return; }
    if (r.locked) { tick(); } else { err.textContent = 'Nama pengguna atau kata sandi salah.'; err.hidden = false; }
    p.value = ''; p.focus();
  });
  tick();
})();
