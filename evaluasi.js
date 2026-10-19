(function () {
  'use strict';
  var Q = [
    { q: 'Pada siang hari, ke mana arah angin permukaan di daerah pantai?', o: ['Dari darat ke laut', 'Dari laut ke darat', 'Sejajar garis pantai', 'Naik tegak lurus dari laut'], a: 1,
      e: 'Siang hari daratan lebih cepat panas sehingga tekanan udara di darat relatif rendah. Udara dari laut yang relatif sejuk bergerak ke darat sebagai angin laut.' },
    { q: 'Kapan angin darat umumnya bertiup?', o: ['Siang hari saat matahari terik', 'Malam hingga dini hari', 'Hanya saat hujan', 'Setiap saat dengan kekuatan yang sama'], a: 1,
      e: 'Pada malam hari daratan lebih cepat dingin. Laut relatif lebih hangat sehingga udara permukaan bergerak dari darat ke laut.' },
    { q: 'Mengapa daratan lebih cepat panas daripada lautan?', o: ['Laut tidak menerima sinar matahari', 'Daratan lebih dekat ke matahari', 'Kalor jenis daratan lebih kecil dan panasnya tidak menyebar ke lapisan dalam', 'Suhu air laut selalu sama sepanjang hari'], a: 2,
      e: 'Air memiliki kalor jenis besar, bercampur, dan sinar menembus lebih dalam. Daratan kalor jenisnya lebih kecil dan panasnya terkumpul di permukaan.' },
    { q: 'Pada siang hari, tekanan udara permukaan di atas daratan dibandingkan laut adalah…', o: ['Relatif lebih rendah', 'Relatif lebih tinggi', 'Selalu sama', 'Tidak berhubungan dengan suhu'], a: 0,
      e: 'Udara di atas daratan yang hangat naik sehingga tekanan permukaannya relatif rendah.' },
    { q: 'Pada siang hari, udara hangat naik di atas…', o: ['Daratan', 'Lautan', 'Garis pantai saja', 'Tidak ada yang naik'], a: 0,
      e: 'Daratan lebih hangat, sehingga udara di atasnya mengembang dan naik.' },
    { q: 'Pada malam hari, aliran udara di lapisan atas bergerak ke arah…', o: ['Dari laut menuju darat', 'Dari darat menuju laut', 'Diam di tempat', 'Turun tegak lurus di atas laut'], a: 0,
      e: 'Sirkulasinya tertutup: di permukaan darat → laut, udara naik di atas laut, lalu aliran balik di atas bergerak laut → darat dan turun di darat.' },
    { q: 'Seorang nelayan ingin berlayar meninggalkan pantai pada dini hari. Angin apa yang membantunya?', o: ['Angin laut', 'Angin darat', 'Angin muson', 'Angin puting beliung'], a: 1,
      e: 'Angin darat bertiup dari darat ke laut pada malam hingga dini hari, sehingga membantu perahu bergerak menjauhi pantai.' },
    { q: 'Pada Q = m · c · ΔT, jika Q dan m sama, bahan dengan kalor jenis (c) besar mengalami perubahan suhu…', o: ['Lebih kecil', 'Lebih besar', 'Sama persis', 'Tidak dapat dihitung'], a: 0,
      e: 'ΔT = Q / (m · c). Jika c besar, ΔT kecil. Itu sebabnya laut lebih lambat panas dan lebih lambat dingin.' },
    { q: 'Pernyataan yang paling tepat tentang angin laut dan angin darat adalah…', o: ['Laut yang dingin “menarik” udara sehingga angin terbentuk', 'Angin terjadi karena perbedaan tekanan akibat perbedaan pemanasan darat dan laut', 'Terjadi persis sama setiap hari tanpa dipengaruhi cuaca', 'Udara hanya bergerak mendatar tanpa sirkulasi'], a: 1,
      e: 'Angin bergerak dari tekanan relatif tinggi ke rendah, dan perbedaan tekanan itu berasal dari perbedaan pemanasan darat dan laut.' },
    { q: 'Mengapa angin permukaan melemah pada waktu peralihan (pagi dan senja)?', o: ['Matahari berhenti memanasi bumi', 'Beda suhu darat dan laut kecil sehingga beda tekanan juga kecil', 'Laut berhenti bergerak', 'Darat dan laut bertukar posisi'], a: 1,
      e: 'Saat suhu darat dan laut hampir sama, beda tekanan mengecil sehingga angin melemah sebelum berbalik arah.' }
  ];
  var $ = function (i) { return document.getElementById(i); };
  var order, idx, score, log, name, locked;

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function show(id) { ['evIntro', 'evQuiz', 'evResult'].forEach(function (x) { $(x).hidden = (x !== id); }); window.scrollTo(0, 0); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function start() {
    name = window.GeoFlow ? GeoFlow.getName() : '';
    order = shuffle(Q.map(function (_, i) { return i; }));
    idx = 0; score = 0; log = []; show('evQuiz'); render();
  }
  function render() {
    var item = Q[order[idx]], box = $('evOpts');
    locked = false;
    $('evCount').textContent = 'Soal ' + (idx + 1) + ' dari ' + Q.length;
    $('evBar').style.width = (idx / Q.length * 100) + '%';
    $('evQ').textContent = item.q;
    $('evFb').hidden = true; $('evNext').hidden = true; box.innerHTML = '';
    shuffle(item.o.map(function (t, i) { return { t: t, c: i === item.a }; })).forEach(function (o, n) {
      var b = el('button', 'ev-opt'); b.type = 'button'; b.setAttribute('data-n', n + 1);
      b.appendChild(el('span', 'k', String.fromCharCode(65 + n))); b.appendChild(el('span', '', o.t));
      b.addEventListener('click', function () { choose(b, o, item); });
      box.appendChild(b);
    });
  }
  function choose(btn, opt, item) {
    if (locked) return; locked = true;
    var all = $('evOpts').children;
    [].forEach.call(all, function (b) { b.disabled = true; if (b.lastChild.textContent === item.o[item.a]) b.classList.add('correct'); });
    if (!opt.c) btn.classList.add('wrong'); else score++;
    log.push({ q: item.q, ok: opt.c, mine: opt.t, right: item.o[item.a], e: item.e });
    var fb = $('evFb'); fb.hidden = false; fb.className = 'ev-fb ' + (opt.c ? 'ok' : 'bad');
    fb.innerHTML = ''; fb.appendChild(el('b', '', opt.c ? 'Benar! ' : 'Belum tepat. ')); fb.appendChild(document.createTextNode(item.e));
    var nx = $('evNext'); nx.hidden = false; nx.textContent = idx === Q.length - 1 ? 'Lihat hasil →' : 'Soal berikutnya →'; nx.focus();
  }
  function next() { if (idx === Q.length - 1) finish(); else { idx++; render(); } }
  function category(p) {
    if (p >= 90) return ['Sangat baik', 'Pemahamanmu tentang angin darat dan angin laut sudah sangat kuat. Coba jelaskan rantai sebab–akibatnya kepada temanmu.'];
    if (p >= 75) return ['Baik', 'Kamu sudah memahami konsep intinya. Periksa kembali soal yang salah, lalu amati simulasi pada jam peralihan.'];
    if (p >= 60) return ['Cukup', 'Konsep dasarnya sudah terbentuk. Pelajari lagi bagian kalor jenis dan rantai sebab–akibat, lalu ulangi evaluasi.'];
    return ['Perlu belajar lagi', 'Jangan khawatir. Baca ulang materi, amati simulasi 3D pada pukul 12:00 dan 02:00, lalu coba evaluasi lagi.'];
  }
  function finish() {
    var pct = Math.round(score / Q.length * 100), c = category(pct);
    $('evBar').style.width = '100%';
    $('evScore').textContent = pct; $('evRaw').textContent = score + ' dari ' + Q.length + ' soal benar';
    $('evCat').textContent = c[0]; $('evMsg').textContent = c[1];
    var rv = $('evReview'); rv.innerHTML = '';
    log.forEach(function (l, i) {
      var d = el('details', 'rv ' + (l.ok ? 'ok' : 'bad')), s = el('summary', '', (i + 1) + '. ' + l.q);
      d.appendChild(s);
      d.appendChild(el('p', '', 'Jawabanmu: ' + l.mine + (l.ok ? ' ✓' : ' ✗')));
      if (!l.ok) d.appendChild(el('p', '', 'Jawaban benar: ' + l.right));
      d.appendChild(el('p', 'why', l.e)); rv.appendChild(d);
    });
    if (window.GeoFlow) GeoFlow.logEval({ n: name, s: score, m: Q.length });
    history(); show('evResult');
  }
  function history() {
    var box = $('evHist'); box.innerHTML = '';
    var a = (window.GeoFlow ? GeoFlow.load(GeoFlow.keys.e) : []).slice(-5).reverse();
    if (!a.length) { box.appendChild(el('p', 'muted', 'Belum ada riwayat.')); return; }
    a.forEach(function (r) {
      var row = el('div', 'hist-row');
      row.appendChild(el('span', '', new Date(r.t).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })));
      row.appendChild(el('span', '', r.n || 'Tanpa nama'));
      row.appendChild(el('b', '', r.s + '/' + r.m));
      box.appendChild(row);
    });
  }
  $('evStart').addEventListener('click', start);
  $('evNext').addEventListener('click', next);
  $('evRetry').addEventListener('click', function () { show('evIntro'); });
  document.addEventListener('keydown', function (e) {
    if ($('evQuiz').hidden) return;
    if (e.key >= '1' && e.key <= '4' && !locked) { var b = $('evOpts').querySelector('[data-n="' + e.key + '"]'); if (b) b.click(); }
    else if (e.key === 'Enter' && locked && !$('evNext').hidden) next();
  });
  $('evTotal').textContent = Q.length;
  function hello() { $('evHello').textContent = (window.GeoFlow && GeoFlow.getName()) || 'teman belajar'; }
  hello(); document.addEventListener('gf:name', hello);
})();
