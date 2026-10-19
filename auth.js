/* GeoFlow — autentikasi sisi-klien untuk halaman admin (pencegah akses iseng, BUKAN keamanan server). */
(function () {
  'use strict';
  var CFG = window.GF_AUTH || {};
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, r = '', words = [], al = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pc = k.length, ic = {};
    for (var c = 2; pc < 64; c++) {
      if (!ic[c]) { for (i = 0; i < 313; i += c) ic[i] = c; hash[pc] = (mp(c, .5) * mw) | 0; k[pc++] = (mp(c, 1 / 3) * mw) | 0; }
    }
    ascii += '\x80'; while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); if (j >> 8) return ''; words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((al / mw) | 0); words[words.length] = al;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; r += ((b < 16) ? 0 : '') + b.toString(16); }
    return r;
  }
  function hash(p) { return sha256(unescape(encodeURIComponent((CFG.salt || '') + p))); }
  function curHash() { try { return localStorage.getItem('gf_pw') || CFG.hash; } catch (e) { return CFG.hash; } }
  function lockLeft() { try { var l = JSON.parse(localStorage.getItem('gf_lock') || '{}'); return l.until && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; } catch (e) { return 0; } }
  function fail() {
    var l = {}; try { l = JSON.parse(localStorage.getItem('gf_lock') || '{}'); } catch (e) {}
    l.n = (l.n || 0) + 1; if (l.n >= 5) { l.until = Date.now() + 60000; l.n = 0; }
    try { localStorage.setItem('gf_lock', JSON.stringify(l)); } catch (e) {}
  }
  function authed() { try { var a = JSON.parse(sessionStorage.getItem('gf_auth')); return !!(a && a.exp > Date.now()); } catch (e) { return false; } }
  function setSession() { sessionStorage.setItem('gf_auth', JSON.stringify({ u: CFG.user, exp: Date.now() + 30 * 60000 })); }
  window.GFAuth = {
    hash: hash, authed: authed, lockLeft: lockLeft,
    login: function (u, p) {
      if (lockLeft()) return { ok: false, locked: lockLeft() };
      if (String(u).trim().toLowerCase() === String(CFG.user).toLowerCase() && hash(p) === curHash()) {
        try { localStorage.removeItem('gf_lock'); } catch (e) {}
        setSession(); return { ok: true };
      }
      fail(); return { ok: false, locked: lockLeft() };
    },
    touch: function () { if (authed()) setSession(); },
    logout: function () { try { sessionStorage.removeItem('gf_auth'); } catch (e) {} },
    change: function (oldP, newP) {
      if (hash(oldP) !== curHash()) return false;
      try { localStorage.setItem('gf_pw', hash(newP)); } catch (e) { return false; }
      return true;
    }
  };
})();
