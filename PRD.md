# PRD — Aplikasi Monitoring Availability Fasilitas Sipil PT Pelabuhan Indonesia (Persero)

| | |
|---|---|
| **Dokumen** | Product Requirements Document (PRD) |
| **Produk** | SIMFAS — Sistem Informasi Monitoring Availability Fasilitas Pelabuhan |
| **Versi** | 1.0 (Draft) |
| **Tanggal** | 13 Juli 2026 |
| **Sumber referensi** | `template-output-rekapxlsx`, `data-output-regional2.xlsx`, `template-output-inspeksi.pdf` |

---

## 1. Latar Belakang

Saat ini pencatatan **availability fasilitas sipil pelabuhan** (dermaga, lapangan penumpukan, gudang, terminal penumpang, dll.) dilakukan secara manual melalui dua jalur:

1. **Form inspeksi lapangan kertas** (`template-output-inspeksi.pdf`) — diisi petugas Cabang & Mitra/Anak Usaha per item fasilitas, dengan kode kondisi 1–4.
2. **Rekap Excel berjenjang** (`template-output-rekapxlsx`, `data-output-regional2.xlsx`) — data detail per bulan per pelabuhan digabung manual menjadi laporan Cabang, lalu direkap menjadi laporan Regional.

Proses ini rawan kesalahan input, sulit ditelusuri (auditability rendah), lambat untuk dikonsolidasi, dan tidak memberi visibilitas real-time kepada manajemen pusat.

## 2. Tujuan Produk

1. Mendigitalkan proses input inspeksi & pencatatan data fasilitas (menggantikan form kertas dan Excel manual).
2. Menghitung **availability** secara otomatis dan konsisten di semua level (Objek Fasilitas → Fasilitas → Kategori → Cabang/Pelabuhan → Regional).
3. Menyediakan **dashboard & tabel monitoring** yang setara tampilannya dengan laporan Excel eksisting, dapat difilter per periode/lokasi.
4. Menyediakan **ekspor Excel & PDF** yang formatnya identik dengan template/form yang sudah dipakai perusahaan saat ini, agar hasil tetap bisa dipakai untuk pelaporan formal/audit.
5. Berjalan **cepat, ringan, dan gratis di-host** (Cloudflare Free Tier), dengan basis kode yang mudah diaudit dan dikembangkan oleh developer junior.

## 3. Target Pengguna & Peran

| Role | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Inspektor Cabang/Mitra** | Petugas lapangan yang mengisi form inspeksi per fasilitas | Create/edit inspeksi di cabang miliknya, upload foto, submit |
| **Admin Cabang (PIC Pelabuhan)** | Memverifikasi hasil inspeksi, melengkapi data kuantitatif (dimensi, jumlah rusak) | Approve/reject inspeksi, edit data fasilitas cabangnya, generate laporan cabang |
| **Admin Regional** | Memantau & merekap seluruh cabang di regionalnya | View & export semua cabang di regionalnya, kelola master data cabang |
| **Manajemen Pusat / Viewer** | Direksi, korporat, auditor | Read-only dashboard seluruh regional, export laporan |
| **Superadmin (IT)** | Kelola pengguna, role, master data nasional | Full access, user management, konfigurasi tema |

Autentikasi berbasis **role-based access control (RBAC)**; setiap pengguna hanya melihat/mengubah data sesuai cakupan cabang/regionalnya.

## 4. Ruang Lingkup

**Termasuk (in-scope):**
- Form inspeksi digital (pengganti form PDF) + riwayat inspeksi & foto.
- Manajemen data master: Regional → Cabang/Pelabuhan → Kategori Fasilitas → Nama Fasilitas → Objek Fasilitas.
- Input/edit data availability bulanan per Objek Fasilitas.
- Kalkulasi otomatis availability berjenjang.
- Dashboard rekap (grafik tren, peta status per regional/cabang).
- Tabel laporan bulanan (tampilan identik struktur Excel `Lap. Cabang` & `Rekap Regional`).
- Ekspor ke `.xlsx` (format sama dengan template) dan `.pdf` (format laporan & form inspeksi).
- Multi-tema UI & responsif (desktop/tablet/smartphone).

**Tidak termasuk (out-of-scope) — fase awal:**
- Integrasi otomatis dengan sistem aset/ERP Pelindo lain.
- Modul anggaran/biaya perbaikan.
- Notifikasi via WhatsApp/email (dicadangkan untuk fase 2).
- Native mobile app (cukup web responsif/PWA).

## 5. Struktur & Model Data

Hasil analisis file Excel menunjukkan hierarki data 5 level berikut (dipetakan dari sheet `Rekap Regional`, `Lap. Cabang`, dan sheet bulanan per pelabuhan):

```
Regional (mis. Regional 2)
 └─ Cabang / Pelabuhan (mis. Tanjung Priok)
     └─ Kategori Fasilitas (Dermaga, Lapangan Penumpukan, Gudang, Terminal Penumpang, ...)
         └─ Nama Fasilitas (mis. "Dermaga 01 - Nusantara I")
             └─ Objek Fasilitas (mis. Pelat Lantai, Fender, Bolder, Kanstin, Rel Crane, Manhole)
                 └─ Data Periodik Bulanan (per bulan/tahun)
```

Kolom kunci per **Objek Fasilitas per periode** (sesuai sheet bulanan, kolom 1–18):

| Kolom Excel | Field | Tipe | Keterangan |
|---|---|---|---|
| Fasilitas | facility_category | text | Dermaga / Lapangan / Gudang / Terminal, dst. |
| Nama Fasilitas | facility_name | text | Nama unit fasilitas |
| Objek Fasilitas | facility_object | text | Komponen (Pelat Lantai, Fender, dst.) |
| Panjang, Lebar, Luas | length, width, area | number | m, m, m² |
| Jumlah | quantity | number | unit |
| Konstruksi | construction_type | text | Beton, Tiang Pancang, dst. |
| Fasilitas Tersedia | available_qty | number | unit/m/m² |
| Rusak Ringan / Sedang / Berat | minor/moderate/severe_damage | number | unit/m/m² |
| Fasilitas Siap Pakai | ready_qty | number | unit/m/m² |
| Availability Objek Fasilitas | object_availability_pct | % | `= Fasilitas Siap Pakai / Fasilitas Tersedia × 100` |
| Availability Fasilitas | facility_availability_pct | % | rata-rata seluruh Objek Fasilitas dalam 1 Nama Fasilitas |
| Operator | operator | text | mis. SPTP, SPMT, SPSL |
| Keterangan | notes | text | Catatan temuan/perbaikan |

> **Asumsi terbuka:** bobot pengurangan availability untuk kategori Rusak Ringan/Sedang/Berat pada kolom "Fasilitas Siap Pakai" berbeda-beda di data historis (indikasi bobot ringan≈0.5, sedang≈0.75, berat=1.0 dari observasi contoh) — **perlu dikonfirmasi ke tim teknis Pelindo** sebelum formula dikunci sebagai *business rule* di sistem. Sampai dikonfirmasi, "Fasilitas Siap Pakai" tetap sebagai field **input**, bukan hasil kalkulasi otomatis.

## 6. Formula Perhitungan Availability (Roll-up)

Tervalidasi langsung dari data `template-output-rekapxlsx` (angka rekap cocok hingga 6 desimal):

1. **Availability Objek Fasilitas (%)** = `Fasilitas Siap Pakai ÷ Fasilitas Tersedia × 100`
2. **Availability Fasilitas** (per Nama Fasilitas) = rata-rata dari seluruh *Availability Objek Fasilitas* di dalamnya
3. **Availability Kategori** (mis. "Availability Dermaga") = rata-rata dari seluruh *Availability Fasilitas* dalam kategori tsb, per cabang
4. **Availability Cabang/Regional** = rata-rata dari seluruh *Availability Kategori*

Sistem **wajib** menggunakan formula berjenjang ini (bukan hardcode angka) sehingga rekap selalu konsisten saat data sumber berubah — mirroring pendekatan formula Excel asli.

## 7. Modul & Kebutuhan Fungsional

### 7.1 Modul Form Inspeksi Digital (mengganti form kertas)
- Header: Nama Pelabuhan, Fasilitas, Lokasi/Area, Tanggal Inspeksi, Tanggal Inspeksi Sebelumnya (auto-terisi dari inspeksi terakhir).
- Baris item inspeksi dinamis (tambah/hapus baris), tiap baris memilih kondisi via pilihan tunggal:
  1. Fasilitas dalam kondisi baik
  2. Tidak ada perubahan dari inspeksi sebelumnya
  3. Ditemukan kerusakan tambahan dari inspeksi sebelumnya
  4. Terdapat kerusakan yang sudah diperbaiki
- Kolom catatan bebas + unggah foto (opsional, disimpan di object storage).
- Tanda tangan digital/persetujuan dua pihak: **Cabang** dan **Anak Usaha/Mitra**.
- Setelah disetujui, data menjadi dasar update tabel Objek Fasilitas kuantitatif (Admin Cabang melengkapi angka Rusak Ringan/Sedang/Berat).

### 7.2 Modul Data Fasilitas & Availability Bulanan
- CRUD data master Regional/Cabang/Kategori/Fasilitas/Objek Fasilitas.
- Input data kuantitatif bulanan per Objek Fasilitas (form terstruktur, validasi angka, duplikasi data bulan sebelumnya sebagai starting point).
- Kalkulasi otomatis availability sesuai §6, tampil real-time saat input.

### 7.3 Dashboard & Tabel Monitoring
- Tabel data dengan struktur & urutan kolom **identik** dengan sheet `Lap. Cabang` / `Rekap Regional` (No, Fasilitas, Nama Fasilitas, Objek Fasilitas, dimensi, kondisi, availability, operator, keterangan).
- Filter: Regional, Cabang, Kategori Fasilitas, Periode (bulan/tahun), status availability (mis. <80% sebagai peringatan).
- Grafik tren availability bulanan per kategori/cabang/regional.
- Indikator warna (badge) untuk availability: Baik (≥95%), Perhatian (80–95%), Kritis (<80%).
- Drill-down: klik Kategori → Nama Fasilitas → Objek Fasilitas → riwayat inspeksi.

### 7.4 Ekspor Laporan
- **Excel (.xlsx):** replikasi struktur `Rekap Regional` dan `Lap. Cabang`/sheet bulanan (header perusahaan, judul, tabel bernomor kolom 1–18, baris subtotal per kategori, baris total availability), lengkap dengan format angka & lebar kolom yang setara.
- **PDF:** dua varian — (a) laporan rekap availability (layout tabel A3/landscape sesuai Excel), dan (b) cetak ulang **Form Pemeriksaan Inspeksi Lapangan** per inspeksi (identik tata letak `template-output-inspeksi.pdf`, termasuk kop PELINDO, kolom keterangan bernomor 1–4, kolom tanda tangan Cabang/Anak Usaha-Mitra).
- Ekspor dapat difilter sesuai scope tampilan (per cabang, per regional, per rentang bulan).

### 7.5 Manajemen Pengguna & Tema
- CRUD user & role, reset password, log aktivitas (audit trail) minimal: siapa mengubah data apa, kapan.
- Panel pengaturan tema (lihat §8) untuk memilih preset tema, mode terang/gelap, dan kustom warna brand Pelindo.

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Performa** | First load < 2 detik pada koneksi 4G rata-rata; TTFB rendah lewat edge hosting; render tabel besar (>500 baris) menggunakan virtualisasi/pagination agar tetap responsif |
| **Desain UI** | Mengikuti prinsip desain sistem **tweakcn** (`github.com/jnsahaj/tweakcn`): berbasis token CSS variable (OKLCH/HSL) di atas Tailwind CSS + shadcn/ui, sehingga tema dapat diganti tanpa mengubah kode komponen |
| **Multi-tema** | Minimal 1 tema default "Pelindo" + beberapa preset tweakcn, mode light/dark, tersimpan per-pengguna |
| **Responsif** | Breakpoint mengikuti konvensi Tailwind: mobile (<640px), tablet (640–1024px), desktop (>1024px). Tabel besar beralih ke tampilan kartu (card view) pada layar sempit |
| **Clean code** | Konvensi penamaan konsisten (camelCase untuk variabel/fungsi, PascalCase untuk komponen), **komentar pada tiap unit/blok logika** (bukan hanya per-file) menjelaskan *apa* dan *mengapa*, agar mudah diaudit dan dilanjutkan developer junior |
| **Clean architecture** | Pemisahan layer tegas (lihat §9.3): UI tidak boleh memanggil database langsung; semua akses data lewat repository/use-case |
| **Keamanan** | HTTPS wajib (default Cloudflare), hashing password (bcrypt/argon2 di edge-compatible lib), RBAC di level API, validasi input di server (bukan hanya client) |
| **Auditability** | Setiap perubahan data availability/inspeksi tersimpan riwayatnya (siapa, kapan, nilai lama→baru) |
| **Biaya operasional** | Wajib tetap dalam batas **Cloudflare Free Tier** (lihat §9.2) |

## 9. Arsitektur Sistem

### 9.1 Ringkasan Tumpukan Teknologi

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | React + Vite (atau Next.js mode static export) + TypeScript, Tailwind CSS, shadcn/ui, engine tema ala **tweakcn** | Ringan, di-deploy statis ke Cloudflare Pages, tema mudah dikustom via CSS variables |
| Hosting Frontend | **Cloudflare Pages** (Free) | CDN global, build otomatis dari Git, gratis |
| Backend API | **Cloudflare Workers** + framework **Hono** (ringan, native Fetch API, cocok untuk V8 isolate) | Compute di edge, latensi rendah, gratis hingga 100rb request/hari |
| Database | **Cloudflare D1** (SQLite di edge) | Relasional, cocok untuk struktur hierarkis Regional→Cabang→Fasilitas, gratis hingga 5 GB & 5 juta baris baca/hari |
| Penyimpanan file (foto inspeksi) | **Cloudflare R2** | S3-compatible, tanpa biaya egress, gratis 10 GB |
| Cache/konfigurasi ringan | **Cloudflare KV** (opsional) | Cache hasil rekap agar dashboard cepat, gratis 100rb baca/hari |
| Autentikasi | JWT custom via Hono middleware (atau **Cloudflare Access** untuk SSO internal jika tersedia) | Ringan, kompatibel Workers |

> Semua layanan di atas berada pada **Cloudflare Free Tier** per Juli 2026: Workers 100.000 req/hari (10ms CPU/invocation), Pages 500 build/bulan, D1 5 GB penyimpanan & 100.000 baris tulis/hari, R2 10 GB penyimpanan. Batasan ini perlu dipantau (lihat §9.2) dan dicek ulang di dokumentasi resmi Cloudflare saat implementasi, karena kuota dapat berubah.

### 9.2 Implikasi Batas Free Tier terhadap Desain
- **Tulis data D1 dibatasi 100rb/hari** → hindari menulis ulang seluruh tabel rekap setiap request; hitung agregat *on read* (query) atau cache di KV, bukan disimpan ulang tiap perubahan kecil.
- **Workers CPU 10 ms/invocation** → logika berat (mis. generate Excel/PDF besar) sebaiknya diproses secara streaming/potongan kecil, atau dibatasi ukurannya (per cabang/per bulan, bukan seluruh nasional sekaligus).
- **R2 untuk foto** → kompres gambar sebelum unggah agar hemat kuota 10 GB.
- Jika kelak volume Regional bertambah signifikan, sediakan jalur upgrade ke Workers Paid (mulai ~US$5/bulan) sebagai mitigasi non-blocking terhadap arsitektur.

### 9.3 Clean Architecture (layer pemisahan tanggung jawab)

```
src/
├─ presentation/     # Komponen UI, halaman, hook React — hanya memanggil "application"
├─ application/       # Use-case (mis. HitungAvailabilityFasilitas, SubmitInspeksi) — logika bisnis murni
├─ domain/            # Entity & tipe inti (Regional, Cabang, Fasilitas, ObjekFasilitas, Inspeksi) + aturan bisnis (formula §6)
├─ infrastructure/     # Implementasi repository ke D1/R2/KV, adapter Excel/PDF generator
└─ api/               # Route Hono (Workers) — menerjemahkan HTTP request ke pemanggilan use-case
```
Aturan: `presentation` & `api` boleh bergantung ke `application`; `application` hanya bergantung ke `domain`; `infrastructure` mengimplementasikan interface yang didefinisikan `domain`/`application` (dependency inversion). Setiap fungsi/unit logika diberi komentar ringkas berisi tujuan, parameter, dan efek samping, agar auditor & developer baru mudah menelusuri alur.

## 10. Skema Basis Data (Ringkas)

| Tabel | Field Utama | Relasi |
|---|---|---|
| `regions` | id, name | 1—N ke `branches` |
| `branches` | id, region_id, name (Pelabuhan) | 1—N ke `facility_categories` |
| `facility_categories` | id, branch_id, name (Dermaga/Lapangan/Gudang/Terminal) | 1—N ke `facilities` |
| `facilities` | id, category_id, name, operator | 1—N ke `facility_objects` |
| `facility_objects` | id, facility_id, name, construction_type | 1—N ke `object_records` |
| `object_records` | id, object_id, period (bulan/tahun), length, width, area, quantity, available_qty, minor_damage, moderate_damage, severe_damage, ready_qty, notes | milik 1 `facility_objects`, 1 periode |
| `inspections` | id, branch_id, facility_id, inspection_date, previous_inspection_date, status | 1—N ke `inspection_items` |
| `inspection_items` | id, inspection_id, item_name, condition_code (1–4), notes, photo_url | milik 1 `inspections` |
| `users` | id, name, email, role, branch_id/region_id (scope akses) | — |
| `audit_logs` | id, user_id, entity, entity_id, action, old_value, new_value, timestamp | — |

## 11. Daftar Halaman (Screens)

1. Login
2. Dashboard Ringkasan (kartu availability per regional/cabang, grafik tren, daftar peringatan kritis)
3. Tabel Laporan Bulanan (setara sheet bulanan / `Lap. Cabang`) — dengan filter & aksi ekspor
4. Rekap Regional (setara sheet `Rekap Regional`)
5. Form Inspeksi Lapangan (create/edit, mobile-friendly untuk petugas di lokasi)
6. Riwayat Inspeksi per Fasilitas
7. Master Data (Regional, Cabang, Kategori, Fasilitas, Objek Fasilitas)
8. Manajemen Pengguna & Role
9. Pengaturan Tema (pilih preset, mode gelap/terang, warna brand)
10. Log Audit

## 12. Kriteria Sukses (Acceptance Criteria — ringkas)

- Data yang diinput via form digital dapat menghasilkan tabel & angka availability yang **sama persis** dengan hasil manual Excel pada kasus uji (dibandingkan terhadap contoh `template-output-rekapxlsx`).
- File Excel & PDF hasil ekspor dapat dibuka tanpa error dan strukturnya sesuai template (No, Fasilitas, Nama Fasilitas, Objek Fasilitas, dst.).
- Waktu muat dashboard < 2 detik pada uji beban wajar (≤100 pengguna aktif bersamaan, sesuai kapasitas free tier).
- Tampilan tetap utuh & fungsional pada lebar layar 375px (smartphone), 768px (tablet), dan ≥1280px (desktop).
- Minimal 2 tema (terang & gelap) tersedia dan dapat diganti tanpa reload halaman.

## 13. Pertanyaan Terbuka untuk Stakeholder

1. Konfirmasi formula/bobot resmi "Fasilitas Siap Pakai" terhadap Rusak Ringan/Sedang/Berat.
2. Apakah dibutuhkan integrasi SSO dengan sistem internal Pelindo, atau login mandiri (email/password) sudah cukup untuk fase 1?
3. Apakah kategori fasilitas (Dermaga, Lapangan, Gudang, Terminal Penumpang) tetap 4 jenis tersebut atau perlu diperluas (mis. dari sheet cabang lain seperti Reg 3)?
4. Batas retensi foto inspeksi di R2 (berapa lama disimpan) untuk menjaga kuota 10 GB tetap aman.
5. Siapa yang berwenang menjadi "Admin Regional" — apakah 1 akun per regional atau multi-akun?

## 14. Fase Pengembangan (Roadmap Ringkas)

| Fase | Cakupan |
|---|---|
| **Fase 1 (MVP)** | Master data, form inspeksi digital, input data bulanan, kalkulasi availability berjenjang, tabel & dashboard dasar, ekspor Excel/PDF, 1 tema |
| **Fase 2** | Multi-tema penuh (preset tweakcn), grafik tren lanjutan, notifikasi ambang kritis, log audit lengkap |
| **Fase 3** | Optimasi performa besar-skala, kemungkinan integrasi sistem aset Pelindo lain, PWA offline-first untuk inspeksi lapangan tanpa sinyal |
