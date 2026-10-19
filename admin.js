(function () {
  'use strict';
  if (!window.GFAuth || !GFAuth.authed()) { location.replace('./akses.html'); return; }
  var $ = function (i) { return document.getElementById(i); };
  var PN = { 'index.html': 'Beranda', 'materi.html': 'Materi', 'simulasi.html': 'Simulasi', 'evaluasi.html': 'Evaluasi', 'profil.html': 'Profil' };
  var V = [], E = [], pg = 1, PER = 15;

  function fmt(t) { return new Date(t).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function dkey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function cell(tr, txt, cls) { var c = document.createElement('td'); c.textContent = txt; if (cls) c.className = cls; tr.appendChild(c); }
  function uniq(a, k) { var o = {}; a.forEach(function (x) { o[x[k]] = 1; }); return Object.keys(o).length; }
  function count(a, f) { var o = {}; a.forEach(function (x) { var k = f(x); o[k] = (o[k] || 0) + 1; }); return o; }
  var RV = [], RE = [], CR = window.GF_REMOTE || {};
  function mergeK(a, b, kf) {
    var seen = {}, out = [];
    a.concat(b).forEach(function (x) { var k = kf(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
    return out.sort(function (x, y) { return x.t - y.t; });
  }
  function load() {
    V = mergeK(GeoFlow.load(GeoFlow.keys.v), RV, function (v) { return v.t + '|' + v.v + '|' + v.p; });
    E = mergeK(GeoFlow.load(GeoFlow.keys.e), RE, function (e) { return e.t + '|' + e.v; });
  }
  function people() {
    var m = {}, ks = [];
    function get(k, t) { return m[k] || (ks.push(k), m[k] = { v: k, n: '', c: 0, f: t, l: t, p: '', d: '', best: null, att: 0 }); }
    V.forEach(function (v) {
      var o = get(v.v, v.t); o.c++; if (v.t < o.f) o.f = v.t;
      if (v.t >= o.l) { o.l = v.t; o.p = v.p; o.d = v.d; }
      if (v.n) o.n = v.n;
    });
    E.forEach(function (e) {
      var o = get(e.v, e.t); o.att++; if (e.n && !o.n) o.n = e.n;
      var pc = Math.round(e.s / e.m * 100); if (o.best === null || pc > o.best) o.best = pc;
    });
    return ks.map(function (k) { return m[k]; }).sort(function (a, b) { return b.l - a.l; });
  }

  function stats() {
    var today = dkey(Date.now()), td = V.filter(function (v) { return dkey(v.t) === today; }).length;
    var s = 0, m = 0; E.forEach(function (e) { s += e.s; m += e.m; });
    $('stTotal').textContent = V.length; $('stUnique').textContent = uniq(V, 'v'); $('stToday').textContent = td;
    $('stNamed').textContent = people().filter(function (p) { return p.n; }).length; $('stAvg').textContent = m ? Math.round(s / m * 100) + '%' : '—';
    $('stEval').textContent = E.length + ' percobaan evaluasi';
  }
  function chart() {
    var days = [], i, d, W = 700, H = 190, bw = W / 14;
    for (i = 13; i >= 0; i--) { d = new Date(); d.setDate(d.getDate() - i); days.push({ k: dkey(d), l: d.getDate() + '/' + (d.getMonth() + 1), n: 0 }); }
    V.forEach(function (v) { var k = dkey(v.t); days.forEach(function (x) { if (x.k === k) x.n++; }); });
    var mx = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([1])), s = '';
    days.forEach(function (x, j) {
      var h = Math.round(x.n / mx * (H - 50)), X = j * bw + 8;
      s += '<rect x="' + X + '" y="' + (H - 28 - h) + '" width="' + (bw - 16) + '" height="' + Math.max(h, 2) + '" rx="6" fill="' + (x.n ? 'url(#g)' : 'rgba(255,255,255,.12)') + '"/>';
      s += '<text x="' + (X + (bw - 16) / 2) + '" y="' + (H - 32 - h) + '" text-anchor="middle" font-size="12" fill="#cfe">' + (x.n || '') + '</text>';
      s += '<text x="' + (X + (bw - 16) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#8aa">' + x.l + '</text>';
    });
    $('chart').innerHTML = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>' + s;
  }
  function bars(id, obj, label) {
    var box = $(id), keys = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }), mx = Math.max.apply(null, keys.map(function (k) { return obj[k]; }).concat([1]));
    box.innerHTML = '';
    if (!keys.length) { var p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Belum ada data.'; box.appendChild(p); return; }
    keys.slice(0, 6).forEach(function (k) {
      var r = document.createElement('div'); r.className = 'bar-row';
      var a = document.createElement('span'); a.textContent = label(k);
      var t = document.createElement('div'); t.className = 'bar-track'; var f = document.createElement('i'); f.style.width = (obj[k] / mx * 100) + '%'; t.appendChild(f);
      var n = document.createElement('b'); n.textContent = obj[k];
      r.appendChild(a); r.appendChild(t); r.appendChild(n); box.appendChild(r);
    });
  }
  function filtered() {
    var p = $('fPage').value, q = $('fQ').value.trim().toLowerCase();
    return V.slice().reverse().filter(function (v) {
      if (p !== 'all' && v.p !== p) return false;
      return !q || [v.n, v.d, v.b, v.o, v.r, v.v, v.l, v.w].join(' ').toLowerCase().indexOf(q) > -1;
    });
  }
  function table() {
    var rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / PER)), tb = $('tblV').querySelector('tbody');
    if (pg > pages) pg = pages; tb.innerHTML = '';
    if (!rows.length) { var tr0 = document.createElement('tr'), c0 = document.createElement('td'); c0.colSpan = 7; c0.className = 'muted'; c0.textContent = 'Belum ada kunjungan yang cocok.'; tr0.appendChild(c0); tb.appendChild(tr0); }
    rows.slice((pg - 1) * PER, pg * PER).forEach(function (v) {
      var tr = document.createElement('tr');
      cell(tr, fmt(v.t)); cell(tr, v.n || '—'); cell(tr, PN[v.p] || v.p, 'pill'); cell(tr, v.d + ' · ' + v.o); cell(tr, v.b); cell(tr, v.w); cell(tr, v.r);
      tb.appendChild(tr);
    });
    $('pInfo').textContent = 'Halaman ' + pg + ' / ' + pages + ' · ' + rows.length + ' data';
    $('pPrev').disabled = pg <= 1; $('pNext').disabled = pg >= pages;
  }
  function peopleTable() {
    var q = $('fP').value.trim().toLowerCase(), all = people(), tb = $('tblP').querySelector('tbody');
    var rows = all.filter(function (p) { return !q || [p.n, p.d, p.v].join(' ').toLowerCase().indexOf(q) > -1; });
    tb.innerHTML = '';
    if (!rows.length) { var t0 = document.createElement('tr'), c0 = document.createElement('td'); c0.colSpan = 7; c0.className = 'muted'; c0.textContent = 'Belum ada pengunjung yang cocok.'; t0.appendChild(c0); tb.appendChild(t0); }
    rows.forEach(function (p) {
      var tr = document.createElement('tr');
      cell(tr, p.n || 'Tanpa nama', p.n ? 'pill' : 'muted'); cell(tr, p.d || '—'); cell(tr, p.c); cell(tr, fmt(p.f)); cell(tr, fmt(p.l));
      cell(tr, PN[p.p] || '—'); cell(tr, p.best === null ? '—' : p.best + '%');
      tb.appendChild(tr);
    });
    $('pCount').textContent = rows.length + ' dari ' + all.length + ' pengunjung (perangkat/browser berbeda dihitung terpisah).';
  }
  function evals() {
    var tb = $('tblE').querySelector('tbody'); tb.innerHTML = '';
    if (!E.length) { var tr0 = document.createElement('tr'), c0 = document.createElement('td'); c0.colSpan = 4; c0.className = 'muted'; c0.textContent = 'Belum ada hasil evaluasi.'; tr0.appendChild(c0); tb.appendChild(tr0); return; }
    E.slice().reverse().slice(0, 20).forEach(function (e) {
      var tr = document.createElement('tr');
      cell(tr, fmt(e.t)); cell(tr, e.n || '—'); cell(tr, e.s + ' / ' + e.m); cell(tr, Math.round(e.s / e.m * 100) + '%');
      tb.appendChild(tr);
    });
  }
  function render() {
    load(); stats(); chart();
    bars('popPages', count(V, function (v) { return v.p; }), function (k) { return PN[k] || k; });
    bars('popDev', count(V, function (v) { return v.d; }), function (k) { return k; });
    bars('popBrw', count(V, function (v) { return v.b; }), function (k) { return k; });
    table(); peopleTable(); evals();
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) { c = String(c == null ? '' : c); if (/^[=+\-@]/.test(c)) c = "'" + c; return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\r\n');
  }
  function csvVisits() { load(); return csv([['Waktu', 'Nama', 'Halaman', 'Perangkat', 'Sistem', 'Browser', 'Layar', 'Bahasa', 'Asal', 'ID Pengunjung', 'ID Sesi']].concat(V.map(function (v) { return [new Date(v.t).toISOString(), v.n || '', PN[v.p] || v.p, v.d, v.o, v.b, v.w, v.l, v.r, v.v, v.s]; }))); }
  function csvPeople() {
    load();
    return csv([['Nama', 'Perangkat', 'Jumlah kunjungan', 'Pertama', 'Terakhir', 'Halaman terakhir', 'Percobaan evaluasi', 'Skor terbaik (%)', 'ID']].concat(people().map(function (p) {
      return [p.n, p.d, p.c, new Date(p.f).toISOString(), new Date(p.l).toISOString(), PN[p.p] || '', p.att, p.best === null ? '' : p.best, p.v];
    })));
  }
  function csvEvals() { load(); return csv([['Waktu', 'Nama', 'Benar', 'Total', 'Persen']].concat(E.map(function (e) { return [new Date(e.t).toISOString(), e.n, e.s, e.m, Math.round(e.s / e.m * 100)]; }))); }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  window.GFAdmin = { csvVisits: csvVisits, csvEvals: csvEvals, csvPeople: csvPeople, people: people, render: render };

  $('fPage').addEventListener('change', function () { pg = 1; table(); });
  $('fQ').addEventListener('input', function () { pg = 1; table(); });
  $('pPrev').addEventListener('click', function () { pg--; table(); });
  $('pNext').addEventListener('click', function () { pg++; table(); });
  $('expV').addEventListener('click', function () { download('riwayat-kunjungan-geoflow.csv', csvVisits()); });
  $('fP').addEventListener('input', peopleTable);
  $('expP').addEventListener('click', function () { download('daftar-pengunjung-geoflow.csv', csvPeople()); });
  $('expE').addEventListener('click', function () { download('hasil-evaluasi-geoflow.csv', csvEvals()); });
  $('clearAll').addEventListener('click', function () {
    if (confirm('Hapus semua riwayat kunjungan dan hasil evaluasi di browser ini? Tindakan ini tidak dapat dibatalkan.')) {
      localStorage.removeItem(GeoFlow.keys.v); localStorage.removeItem(GeoFlow.keys.e); render();
    }
  });
  $('logout').addEventListener('click', function () { GFAuth.logout(); location.href = './index.html'; });
  $('pwForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('pwOld').value, n = $('pwNew').value, n2 = $('pwNew2').value, m = $('pwMsg');
    m.hidden = false; m.className = 'form-msg bad';
    if (n.length < 8) { m.textContent = 'Kata sandi baru minimal 8 karakter.'; return; }
    if (n !== n2) { m.textContent = 'Konfirmasi kata sandi tidak sama.'; return; }
    if (!GFAuth.change(o, n)) { m.textContent = 'Kata sandi lama salah.'; return; }
    m.className = 'form-msg ok'; m.textContent = 'Kata sandi berhasil diubah (berlaku di browser ini).'; $('pwForm').reset();
  });
  window.addEventListener('storage', render);
  ['click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { GFAuth.touch(); }); });
  setInterval(function () { if (!GFAuth.authed()) location.replace('./akses.html'); }, 20000);
  /* ---- sinkronisasi opsional ---- */
  function rmsg(t, ok) { var m = $('rMsg'); m.hidden = false; m.className = 'form-msg ' + (ok ? 'ok' : 'bad'); m.textContent = t; }
  function nv(x) { return { t: Number(x.t), p: String(x.p || ''), v: String(x.v || ''), s: String(x.s || ''), n: String(x.n == null ? '' : x.n), d: String(x.d || ''), b: String(x.b || ''), o: String(x.o || ''), w: String(x.w || ''), l: String(x.l || ''), r: String(x.r || '') }; }
  function ne(x) { return { t: Number(x.t), v: String(x.v || ''), n: String(x.n == null ? '' : x.n), s: Number(x.s), m: Number(x.m) }; }
  function sync(silent) {
    var key = ''; try { key = localStorage.getItem('gf_rkey') || ''; } catch (e) {}
    if (!CR.url || !key) return Promise.resolve();
    return fetch(CR.url + (CR.url.indexOf('?') < 0 ? '?' : '&') + 'key=' + encodeURIComponent(key), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.error) throw new Error('kunci ditolak oleh server');
        RV = (d.visits || []).map(nv).filter(function (x) { return x.t && x.v; });
        RE = (d.evals || []).map(ne).filter(function (x) { return x.t && x.m; });
        render(); if (!silent) rmsg('Tersinkron: ' + RV.length + ' kunjungan dan ' + RE.length + ' evaluasi dari server.', true);
      })
      .catch(function (e) { rmsg('Gagal sinkron: ' + (e.message || 'periksa URL dan koneksi'), false); });
  }
  $('rInfo').textContent = CR.url ? 'Terhubung ke server sinkronisasi. Masukkan kunci yang sama dengan SECRET pada skrip Google Apps Script.' : 'Belum dikonfigurasi. Pasang skrip Google Apps Script lalu isi url pada js/config.js (lihat README). Sampai saat itu, panel hanya menampilkan data dari perangkat ini.';
  $('rSave').disabled = !CR.url; $('rKey').disabled = !CR.url;
  $('rSave').addEventListener('click', function () {
    var k = $('rKey').value.trim(); if (!k) { rmsg('Isi kunci sinkronisasi terlebih dahulu.', false); return; }
    try { localStorage.setItem('gf_rkey', k); } catch (e) {}
    sync(false);
  });
  window.GFAdmin.sync = sync;
  var TITLES = { ringkasan: 'Ringkasan', pengunjung: 'Daftar pengunjung', kunjungan: 'Riwayat kunjungan', evaluasi: 'Hasil evaluasi', pengaturan: 'Pengaturan' };
  function tab(n) {
    if (!TITLES[n]) n = 'ringkasan';
    [].forEach.call(document.querySelectorAll('[data-pane]'), function (p) { p.hidden = p.getAttribute('data-pane') !== n; });
    [].forEach.call(document.querySelectorAll('.side-btn[data-tab]'), function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === n); });
    $('paneTitle').textContent = TITLES[n];
    try { if (location.hash !== '#' + n) history.replaceState(null, '', '#' + n); } catch (e) {}
  }
  [].forEach.call(document.querySelectorAll('.side-btn[data-tab]'), function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); }); });
  window.addEventListener('hashchange', function () { tab((location.hash || '').slice(1)); });
  tab((location.hash || '').slice(1));
  render(); sync(true);
})();
