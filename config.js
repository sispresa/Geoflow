/* Konfigurasi GeoFlow.
   - GF_AUTH   : akses admin. Ubah kata sandi lewat panel admin (Pengaturan).
   - GF_REMOTE : (opsional) alamat Web App Google Apps Script untuk mengumpulkan kunjungan dari SEMUA perangkat.
                 Kosongkan untuk mode lokal saja. Petunjuk: lihat README dan folder sinkronisasi/. */
window.GF_AUTH = { user: "admin", salt: "geoflow-2026-", hash: "995a7357a3860486d16fc80d2cdc9d3be913863339c6e0b586840f2578dec1b0" };
window.GF_REMOTE = window.GF_REMOTE || { url: "" };
