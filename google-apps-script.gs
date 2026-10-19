/**
 * GeoFlow — penerima riwayat kunjungan (opsional) di Google Sheets.
 * Cara pakai: lihat README bagian "Sinkronisasi antarperangkat".
 * 1) Ganti SECRET dengan kunci rahasia buatanmu sendiri.
 * 2) Deploy > Web app > Execute as: Me, Who has access: Anyone.
 */
const SECRET = 'GANTI_DENGAN_KUNCI_RAHASIA';
const COLS = { visits: ['t','p','v','s','n','d','b','o','w','l','r'], evals: ['t','v','n','s','m'] };

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(COLS[name]); }
  return sh;
}
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents), r = b.rec || {};
    const name = b.type === 'visit' ? 'visits' : b.type === 'eval' ? 'evals' : null;
    if (name) sheet_(name).appendRow(COLS[name].map(function (k) { return r[k] === undefined ? '' : String(r[k]).slice(0, 200); }));
  } catch (err) {}
  return ContentService.createTextOutput('ok');
}
function doGet(e) {
  const out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  if (e.parameter && e.parameter.public === '1') {
    const sh = sheet_('visits'), rows = sh.getDataRange().getValues();
    if (rows.length < 2) return out({ visitors: [] });
    const head = rows.shift(), ni = head.indexOf('n'), seen = {};
    const visitors = rows.map(function (row) { return String(row[ni] || '').trim(); }).filter(function (n) { if (!n || seen[n.toLowerCase()]) return false; seen[n.toLowerCase()] = true; return true; });
    return out({ visitors: visitors });
  }
  if (!e.parameter || e.parameter.key !== SECRET) return out({ error: 'unauthorized' });
  const read = function (name) {
    const v = sheet_(name).getDataRange().getValues(), head = v.shift();
    return v.map(function (row) { const o = {}; head.forEach(function (k, i) { o[k] = row[i]; }); return o; });
  };
  return out({ visits: read('visits'), evals: read('evals') });
}
