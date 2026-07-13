# SIMFAS

**Sistem Informasi Monitoring Availability Fasilitas Pelabuhan**  
PT Pelabuhan Indonesia (Persero)

Aplikasi web fullstack untuk mendigitalkan form inspeksi lapangan, input data availability fasilitas sipil, kalkulasi berjenjang otomatis, dashboard, dan ekspor laporan Excel/PDF yang mengikuti template resmi.

Sumber referensi: `PRD.md`, `output-mafp3/template-output-rekap.xlsx`, `output-mafp3/data-output-regional2.xlsx`, `output-mafp3/template-output-inspeksi.pdf`.

---

## Arsitektur (Clean Architecture)

```
simfas/
├── shared/          # Domain: entity, formula availability, RBAC
├── worker/          # Backend: Cloudflare Workers + Hono + D1 + R2 + KV
│   ├── src/api/           # HTTP routes
│   ├── src/application/   # Use-case (report builder)
│   ├── src/domain/        # Env types
│   └── src/infrastructure/# Auth, audit, Excel/PDF, storage
└── web/             # Frontend: React + Vite + TS + Tailwind + shadcn-style
    └── src/presentation/  # UI pages, hooks, theme
```

**Hierarki data:** Regional → Cabang/Pelabuhan → Kategori Fasilitas → Nama Fasilitas → Objek Fasilitas → Data periodik bulanan.

**Formula availability (PRD §6, tervalidasi vs Excel template):**

1. Objek = `siap pakai ÷ tersedia × 100`
2. Fasilitas = rata-rata objek
3. Kategori = rata-rata fasilitas
4. Cabang/Regional = rata-rata kategori

Angka rekap **tidak di-hardcode** — selalu dihitung on-read (hemat write D1 Free Tier).

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, komponen ala shadcn/ui |
| Tema | CSS variables multi-preset (Pelindo, Modern Minimal, Ocean) light/dark tanpa reload |
| API | Cloudflare Workers + Hono |
| DB | Cloudflare D1 (SQLite) |
| Foto | Cloudflare R2 (kompres di browser sebelum upload) |
| Cache | Cloudflare KV (rekap 5 menit) |
| Deploy FE | Cloudflare Pages |

---

## Menjalankan lokal

### Prasyarat

- Node.js ≥ 20
- npm (workspaces)

### Install

```bash
cd simfas
npm install
```

### Database (D1 lokal)

```bash
cd worker
npx wrangler d1 migrations apply simfas-db --local
npx wrangler d1 execute simfas-db --local --file=./migrations/0002_seed.sql
```

### API (port 8787)

```bash
cd worker
npm run dev
```

### Web (port 5173, proxy `/api` → 8787)

```bash
cd web
npm run dev
```

Buka http://localhost:5173

### Uji formula availability

```bash
cd shared
npx tsx src/domain/availability.test.ts
```

---

## Akun demo

Password semua: `password123`

| Role | Email |
|------|-------|
| Superadmin | superadmin@pelindo.co.id |
| Manajemen Pusat | manajemen@pelindo.co.id |
| Admin Regional 2 | admin.reg2@pelindo.co.id |
| Admin Cabang Tanjung Priok | admin.tpriok@pelindo.co.id |
| Inspektor | inspektor.tpriok@pelindo.co.id |

---

## Modul

1. **Login + RBAC** — Inspektor, Admin Cabang, Admin Regional, Manajemen, Superadmin  
2. **Dashboard** — kartu regional, tren 6 bulan, alert &lt; 95%  
3. **Laporan Cabang** — tabel kolom 1–18 seperti Excel, filter cabang/periode, ekspor xlsx/pdf  
4. **Rekap Regional** — layout rekap template, ekspor xlsx  
5. **Form Inspeksi** — kondisi 1–4, foto terkompresi, approval Cabang & Mitra, cetak PDF form  
6. **Master Data & input bulanan** — edit siap pakai/tersedia/kerusakan, salin bulan sebelumnya  
7. **Pengguna** — CRUD user (superadmin)  
8. **Audit log** — jejak perubahan  
9. **Tema** — preset + light/dark tanpa reload  

---

## Deploy Cloudflare (ringkas)

1. Buat D1 `simfas-db`, R2 `simfas-photos`, KV namespace — update ID di `worker/wrangler.toml`
2. `cd worker && npx wrangler secret put JWT_SECRET`
3. Set `CORS_ORIGIN` ke URL Pages
4. `npx wrangler d1 migrations apply simfas-db --remote` + seed
5. `npx wrangler deploy`
6. Frontend: `cd web && npm run build` → upload `dist/` ke Cloudflare Pages  
   Build command: `npm run build` · Output: `dist` · Root: `web`

**Free Tier tips:** agregat on-read + KV cache; jangan tulis ulang rekap; kompres foto &lt; 400KB; ekspor per cabang/bulan (bukan nasional sekaligus).

---

## Catatan bisnis terbuka (PRD §13)

- Bobot resmi Rusak Ringan/Sedang/Berat → **Siap Pakai** masih input manual hingga dikonfirmasi stakeholder.
- Seed data Mei 2026 mengikuti contoh `Lap. Cabang` di template rekap (Dermaga A/B, Lapangan, Gudang, Terminal).
