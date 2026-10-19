/* GeoFlow — fungsi bersama: gerbang nama pengunjung, pencatatan kunjungan, menu mobile, tautan rahasia. */
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var KV = 'gf_visits', KE = 'gf_evals', KN = 'gf_name', MAX = 3000;
  var TRACKED = { 'index.html': 1, 'materi.html': 1, 'simulasi.html': 1, 'evaluasi.html': 1, 'profil.html': 1 };

  function load(k) { try { var a = JSON.parse(localStorage.getItem(k)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(k, a) { try { localStorage.setItem(k, JSON.stringify(a.slice(-MAX))); } catch (e) {} }
  function rid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function keep(st, k, p) { try { var v = st.getItem(k); if (!v) { v = p + rid(); st.setItem(k, v); } return v; } catch (e) { return p + 'anon'; } }
  function isAdmin() { try { var a = JSON.parse(sessionStorage.getItem('gf_auth')); return !!(a && a.exp > Date.now()); } catch (e) { return false; } }
  function env() {
    var u = navigator.userAgent, b = 'Lainnya', o = 'Lainnya';
    var tab = /iPad|Tablet/i.test(u), mob = /Mobi|Android|iPhone/i.test(u);
    var d = tab ? 'Tablet' : (mob ? 'Ponsel' : 'Desktop');
    if (/Edg\//.test(u)) b = 'Edge'; else if (/OPR\/|Opera/.test(u)) b = 'Opera'; else if (/Firefox\//.test(u)) b = 'Firefox'; else if (/Chrome\//.test(u)) b = 'Chrome'; else if (/Safari\//.test(u)) b = 'Safari';
    if (/Windows/.test(u)) o = 'Windows'; else if (/Android/.test(u)) o = 'Android'; else if (/iPhone|iPad|iOS/.test(u)) o = 'iOS'; else if (/Mac OS/.test(u)) o = 'macOS'; else if (/Linux/.test(u)) o = 'Linux';
    return { d: d, b: b, o: o };
  }
  function ref() { try { if (!document.referrer) return 'Langsung'; var u = new URL(document.referrer); return u.host === location.host ? 'Internal' : u.host; } catch (e) { return 'Langsung'; } }

  /* ---- nama pengunjung ---- */
  function getName() { try { return (localStorage.getItem(KN) || '').trim(); } catch (e) { return ''; } }
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
  function valid(s) {
    if (s.length < 2) return false;
    try { return new RegExp('\\p{L}', 'u').test(s); } catch (e) { return /[A-Za-z\u00C0-\u024F]/.test(s); }
  }
  function remote(type, rec) {
    var u = window.GF_REMOTE && window.GF_REMOTE.url;
    if (!u || typeof fetch !== 'function') return;
    try {
      fetch(u, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: type, rec: rec }) })
        .catch(function () {});
    } catch (e) {}
  }

  var PUBLIC = !!TRACKED[page] && !isAdmin(), tracked = false;
  function track() {
    if (tracked || !PUBLIC) return;
    var n = getName(); if (!n) return;
    tracked = true;
    var list = load(KV), last = list[list.length - 1], now = Date.now(), vid = keep(localStorage, 'gf_vid', 'v-');
    if (last && last.p === page && last.v === vid && now - last.t < 5000) return;
    var e = env();
    var rec = { t: now, p: page, v: vid, s: keep(sessionStorage, 'gf_sid', 's-'), n: n, d: e.d, b: e.b, o: e.o,
      w: screen.width + 'x' + screen.height, l: navigator.language || '', r: ref() };
    list.push(rec); save(KV, list); remote('visit', rec);
  }
  function setName(raw) {
    var n = clean(raw);
    if (!valid(n)) return false;
    try { localStorage.setItem(KN, n); } catch (e) { return false; }
    track();
    try { document.dispatchEvent(new CustomEvent('gf:name', { detail: n })); } catch (e) {}
    return true;
  }
  track();

  function localVisitorNames() {
    var names = []; load(KV).forEach(function (r) { if (r && r.n && names.indexOf(r.n) < 0) names.push(r.n); });
    var current = getName(); if (current && names.indexOf(current) < 0) names.push(current);
    return names;
  }
  function renderVisitorList(names, status) {
    var el = document.getElementById('gf-visitor-list'); if (!el) return;
    if (!names.length) { el.innerHTML = '<p class="gf-list-status">Belum ada nama pengunjung. Jadilah yang pertama!</p>'; return; }
    el.innerHTML = '<div class="gf-visitor-grid">' + names.map(function (n, i) { return '<div class="gf-visitor-item"><span class="gf-visitor-number">' + (i + 1) + '</span><span class="gf-visitor-avatar" aria-hidden="true">' + String(n).trim().charAt(0).toUpperCase().replace(/[&<>"']/g, '') + '</span><strong></strong></div>'; }).join('') + '</div>';
    Array.prototype.forEach.call(el.querySelectorAll('.gf-visitor-item strong'), function (node, i) { node.textContent = names[i]; });
    if (status) { var note = document.createElement('p'); note.className = 'gf-list-status'; note.textContent = status; el.appendChild(note); }
  }
  function refreshVisitorList() {
    var names = localVisitorNames(), u = window.GF_REMOTE && window.GF_REMOTE.url;
    renderVisitorList(names, u ? 'Daftar sedang disinkronkan dari perangkat yang terhubung.' : 'Mode lokal: daftar ini hanya memuat nama dari browser/perangkat ini. Aktifkan sinkronisasi Google Sheets untuk daftar bersama.');
    if (!u || typeof fetch !== 'function') return;
    fetch(u + (u.indexOf('?') >= 0 ? '&' : '?') + 'public=1', { method: 'GET' }).then(function (r) { return r.json(); }).then(function (data) {
      if (data && Array.isArray(data.visitors)) renderVisitorList(data.visitors);
    }).catch(function () { renderVisitorList(names, 'Daftar online belum dapat dimuat. Periksa pengaturan sinkronisasi.'); });
  }

  window.GeoFlow = {
    page: page, load: load, save: save, keys: { v: KV, e: KE }, isAdmin: isAdmin, getName: getName, setName: setName,
    refreshVisitorList: refreshVisitorList,
    logEval: function (o) {
      if (isAdmin()) return;
      var rec = { t: Date.now(), v: keep(localStorage, 'gf_vid', 'v-'), n: getName() || String(o.n || '').slice(0, 40), s: o.s, m: o.m };
      var a = load(KE); a.push(rec); save(KE, a); remote('eval', rec);
    }
  };

  /* ---- tampilan gerbang nama + chip ---- */
  var STYLE = '.gf-gate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(6,9,18,.8);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}' +
    '.gf-card{width:min(440px,100%);padding:32px;border-radius:28px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(160deg,rgba(99,102,241,.25),rgba(10,14,29,.95) 58%);box-shadow:0 30px 90px rgba(0,0,0,.55);color:#e8eefc;font-family:"DM Sans",system-ui,sans-serif}' +
    '.gf-mark{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font:800 22px "Manrope",system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#22d3ee,#6366f1 60%,#a78bfa);box-shadow:0 8px 26px rgba(99,102,241,.5)}' +
    '.gf-card h2{margin:16px 0 6px;font:800 26px/1.15 "Manrope",system-ui,sans-serif}.gf-card p{margin:0 0 18px;opacity:.75;font-size:14px;line-height:1.55}' +
    '.gf-card input{width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);color:inherit;font:inherit;font-size:16px}' +
    '.gf-card input:focus{outline:2px solid #67e8f9;outline-offset:2px}.gf-row{display:flex;gap:10px;margin-top:16px}' +
    '.gf-card button{flex:1;padding:13px 18px;border-radius:99px;border:0;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#22d3ee,#6366f1 60%,#a78bfa);box-shadow:0 10px 28px rgba(99,102,241,.4)}' +
    '.gf-card button.ghost{flex:none;background:rgba(255,255,255,.1);box-shadow:none}.gf-err{margin-top:10px;font-size:13px;color:#fca5a5}.gf-note{margin-top:14px;font-size:12px;opacity:.55}' +
    '.gf-who{display:inline-flex;gap:6px;align-items:center;max-width:170px;padding:8px 13px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font-family:"DM Sans",system-ui,sans-serif;font-weight:600;font-size:13px;cursor:pointer}' +
    '.gf-who:hover{border-color:#67e8f9}.gf-who span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}body.gf-lock{overflow:hidden}';
  var gate = null, who = null;

  function updateWho() { if (who) who.querySelector('span').textContent = getName(); }
  function closeGate() { if (gate) { gate.remove(); gate = null; } document.body.classList.remove('gf-lock'); }
  function openGate(change) {
    if (gate) return;
    var prev = getName();
    gate = document.createElement('div'); gate.className = 'gf-gate';
    gate.innerHTML = '<form class="gf-card" role="dialog" aria-modal="true" aria-labelledby="gfT" novalidate>' +
      '<div class="gf-mark" aria-hidden="true">G</div><h2 id="gfT"></h2><p></p>' +
      '<label for="gfName" style="display:block;font-size:13px;opacity:.8;margin-bottom:6px">Nama kamu</label>' +
      '<input id="gfName" type="text" maxlength="40" autocomplete="name" placeholder="Contoh: Aisyah Putri" required>' +
      '<div class="gf-err" id="gfErr" role="alert" hidden></div>' +
      '<div class="gf-row"><button type="submit"></button></div>' +
      '<div class="gf-note">Namamu dicatat bersama riwayat kunjungan agar pengembang dapat melihat siapa saja yang sudah belajar. Alamat IP tidak dicatat.</div></form>';
    var f = gate.firstChild, inp = f.querySelector('#gfName'), err = f.querySelector('#gfErr');
    f.querySelector('h2').textContent = change ? 'Ganti nama' : 'Selamat datang di GeoFlow';
    f.querySelector('p').textContent = change ? 'Masukkan nama yang ingin ditampilkan.' : 'Sebelum mulai belajar, masukkan namamu terlebih dahulu.';
    f.querySelector('button[type=submit]').textContent = change ? 'Simpan nama' : 'Mulai belajar →';
    if (change) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'ghost'; c.textContent = 'Batal';
      c.addEventListener('click', closeGate); f.querySelector('.gf-row').appendChild(c); inp.value = prev;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (setName(inp.value)) { closeGate(); updateWho(); if (who) who.focus(); }
      else { err.textContent = 'Tulis nama yang valid (minimal 2 karakter, mengandung huruf).'; err.hidden = false; inp.focus(); }
    });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && change) closeGate();
      if (e.key === 'Tab') { var els = f.querySelectorAll('input,button'), first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    document.body.appendChild(gate); document.body.classList.add('gf-lock'); inp.focus();
    if (change) inp.select();
  }
  function mountWho() {
    var host = document.querySelector('.nav-cta') || document.querySelector('.back-link');
    if (!host || who) return;
    who = document.createElement('button'); who.type = 'button'; who.className = 'gf-who'; who.title = 'Ganti nama';
    who.setAttribute('aria-label', 'Ganti nama pengunjung');
    who.innerHTML = '<b aria-hidden="true">👋</b><span></span>';
    host.parentNode.insertBefore(who, host); updateWho();
    who.addEventListener('click', function () { openGate(true); });
  }

  function ready(f) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f(); }
  ready(function () {
    var mb = document.querySelector('.menu-btn'), nl = document.querySelector('.navlinks');
    if (mb && nl) {
      mb.addEventListener('click', function () { var o = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      nl.addEventListener('click', function (e) { if (e.target.tagName === 'A') nl.classList.remove('open'); });
    }
    document.querySelectorAll('.navlinks a').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (h.indexOf('#') < 0 && h.replace('./', '').toLowerCase() === page) a.classList.add('active');
    });
    var tocA = document.querySelectorAll('.toc a');
    if (tocA.length && 'IntersectionObserver' in window) {
      var map = {};
      tocA.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          tocA.forEach(function (x) { x.classList.remove('on'); });
          var a = map[e.target.id]; if (a) a.classList.add('on');
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
    var s = document.getElementById('gf-secret');
    if (s) {
      var c = 0, t;
      s.addEventListener('click', function () {
        c++; clearTimeout(t); t = setTimeout(function () { c = 0; }, 3000);
        if (c >= 5) { c = 0; location.href = './akses.html'; }
      });
    }
    if (PUBLIC) {
      var st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
      mountWho();
      var openName = document.getElementById('gf-open-name');
      if (openName) { openName.addEventListener('click', function () { openGate(!!getName()); }); if (getName()) openName.textContent = 'Ganti Nama Pengunjung ✎'; }
      if (!getName() && !openName) { /* halaman selain beranda tetap menyediakan gerbang melalui tombol nama */ }
      refreshVisitorList();
      document.addEventListener('gf:name', refreshVisitorList);
    }
  });
})();
