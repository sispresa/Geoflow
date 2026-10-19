# GeoFlow Premium — Angin Darat & Angin Laut

Media pembelajaran Geografi Kelas X dengan struktur: Beranda → Materi → Simulasi → Evaluasi → Profil, ditambah akses tersembunyi ke panel pengembang. Berisi halaman materi, simulasi 3D (Three.js), evaluasi, profil pengembang, dan panel riwayat kunjungan.
Dikembangkan oleh M. Hairul Jesri.

## Isi proyek
| Berkas | Fungsi |
|---|---|
| `index.html` | **Beranda**: perkenalan lima bagian, sekilas konsep, ajakan ke simulasi |
| `materi.html` | **Materi** lengkap dengan daftar isi: dasar, kalor jenis, sebab–akibat, siang–malam, fase harian, Indonesia, miskonsepsi, aktivitas, latihan, glosarium, referensi |
| `simulasi.html` | Laboratorium simulasi 3D (panel dapat disembunyikan; di ponsel menjadi lembar bawah) |
| `evaluasi.html` | Evaluasi 10 soal dengan penjelasan, skor, tinjauan jawaban, dan riwayat percobaan |
| `profil.html` | Profil pengembang dan perjalanan proyek |
| `akses.html` | Halaman masuk **tersembunyi** (tidak ada di menu) |
| `admin.html` | **Panel pengembang** (butuh login) dengan menu Ringkasan, Daftar pengunjung, Riwayat kunjungan, Hasil evaluasi, Pengaturan |
| `css/` | `landing.css` (beranda), `pages.css` (halaman lain), `style.css` (simulasi) |
| `js/main.js` | Scene Three.js, animasi, waktu, kuis simulasi |
| `js/common.js` | Gerbang nama pengunjung, pencatatan kunjungan, menu mobile, tautan rahasia |
| `js/auth.js`, `js/config.js`, `js/akses.js`, `js/admin.js` | Login dan panel admin |
| `js/evaluasi.js`, `js/panels.js` | Evaluasi dan panel simulasi |
| `assets/jesri.jpg` | Foto pengembang |
| `sinkronisasi/google-apps-script.gs` | (Opsional) skrip penerima data dari semua perangkat |

## Menjalankan
Halaman memakai ES Modules dan Three.js dari CDN, jadi jalankan lewat local server (bukan klik dua kali pada file HTML):
```bash
python -m http.server 8080
```
Lalu buka `http://localhost:8080`. Alternatif: Live Server di Visual Studio Code. Simulasi membutuhkan internet untuk memuat Three.js.

## Akses riwayat kunjungan (tersembunyi)
- Buka `akses.html` langsung, **atau** klik simbol **©** di footer beranda lima kali dalam 3 detik.
- Nama pengguna: `admin` · Kata sandi awal: `GeoFlow@2026`
- **Segera ubah** kata sandi lewat panel admin (menu "Ubah kata sandi").
- Lima kali salah memasukkan kata sandi mengunci login selama 60 detik; sesi berakhir otomatis setelah 30 menit tanpa aktivitas.

## Nama pengunjung
Di beranda, pengunjung mengeklik tombol **Masukkan Nama Pengunjung** untuk mengisi nama (minimal 2 karakter, mengandung huruf). Nama tersimpan di perangkatnya, tampil sebagai tombol 👋 di menu (klik untuk menggantinya), dipakai otomatis pada evaluasi, dan tercatat bersama setiap kunjungan. Nama lokal dapat dilihat di panel admin pada menu **Daftar pengunjung** (lengkap dengan jumlah kunjungan, kunjungan terakhir, dan skor evaluasi terbaik; bisa dicari dan diekspor CSV).

### Batasan penting
- Secara bawaan riwayat dan nama disimpan di **localStorage browser/perangkat yang sama**. Pengunjung di perangkat lain tidak terkumpul di satu tempat.
- Untuk menampilkan daftar nama lintas perangkat di bagian **Daftar pengunjung** pada beranda, aktifkan sinkronisasi opsional (di bawah).
- Login admin berjalan di sisi browser sehingga hanya mencegah akses iseng, **bukan keamanan sejati**.
- Data yang dicatat: nama yang diisi pengunjung, waktu, halaman, jenis perangkat, browser, ukuran layar, bahasa, asal rujukan, dan hasil evaluasi. Alamat IP tidak dicatat. Footer dan jendela nama menyampaikan hal ini kepada pengunjung.

### Sinkronisasi antarperangkat (opsional, Google Sheets)
1. Buat Google Sheet baru, lalu **Extensions → Apps Script**.
2. Tempel isi `sinkronisasi/google-apps-script.gs`, ganti `SECRET` dengan kunci buatanmu sendiri.
3. **Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: Anyone*, lalu salin URL `/exec`.
4. Isi `url` pada `js/config.js` (`window.GF_REMOTE = { url: "…/exec" }`).
5. Buka panel admin → **Pengaturan → Sinkronisasi**, masukkan kunci yang sama, klik *Simpan & sinkronkan*.

Catatan: fitur ini belum diuji langsung dengan layanan Google (alur klien diuji dengan simulasi). Siapa pun yang tahu URL dapat mengirim data palsu, tetapi hanya pemilik kunci yang dapat membacanya. Jika URL kosong, situs bekerja penuh dalam mode lokal.

## Interaksi simulasi
- Slider 00:00–24:00, tombol Putar/Jeda/Reset, seret untuk orbit, scroll untuk zoom.
- Tombol ‹ › di tepi panel menyembunyikan panel; di ponsel gunakan tombol "Kontrol" dan "Info" di bawah.
- Mode Amati, Jelajahi, Pahami, dan Kuis.

## Catatan ilmiah
Suhu yang ditampilkan adalah indikator konseptual, bukan pengukuran cuaca. Arah angin permukaan mengikuti model ideal angin laut (laut → darat ketika darat relatif lebih hangat) dan angin darat (darat → laut ketika laut relatif lebih hangat). Angin nyata dapat dipengaruhi angin regional, cuaca, topografi, dan faktor lokal lainnya.

## Catatan teknis
- Tema visual modern (indigo–cyan, kaca/glass, latar aurora) memakai variabel warna di `css/pages.css`.
- Three.js 0.160.0 melalui import map jsDelivr; scene dibuat dari geometri prosedural tanpa model GLB.
- Pixel ratio dibatasi 1.7 untuk GPU terbatas.
- Pengujian otomatis (tautan, pencatatan kunjungan, alur evaluasi, login, panel admin, panel simulasi) lulus 315 pemeriksaan; tampilan WebGL perlu dicek langsung di browser.
