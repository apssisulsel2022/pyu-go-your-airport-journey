# Rebuild Admin / Vehicles

Restrukturisasi halaman `admin/vehicles` agar selaras dengan model bisnis: **3 jenis kendaraan** (Minicar, SUV, Hiace) × **3 tier layanan** (Reguler, SemiExecutive, Executive). Setiap kendaraan memiliki layout kursi realistis berbasis **gambar denah** yang di-upload admin, dengan marker kursi yang ditempatkan di atas gambar.

## Tujuan

- Ganti taxonomy lama (`hiace`/`elf`/`minibus` + Economy/Business/VIP) menjadi `minicar`/`suv`/`hiace` + `Reguler`/`SemiExecutive`/`Executive`.
- Jadikan **Image Map** sebagai cara utama mendesain layout kursi (gambar di-upload admin). Mode grid lama dihapus dari UI editor.
- Tampilkan daftar kendaraan dikelompokkan per tier, dengan filter cepat berdasarkan tipe & tier.
- Pertahankan kompatibilitas: data schedule/booking lama tetap jalan (mapping tipe lama → baru saat seed).

## Perubahan Data (src/store/admin.ts & mock-data.ts)

- `VehicleType` di `mock-data.ts` diperluas: `"minicar" | "suv" | "hiace"` (alias lama `elf`/`minibus` dipetakan ke `suv`/`hiace` saat seed dimuat ulang).
- `VehicleTemplate.className` diganti jadi `tier: "Reguler" | "SemiExecutive" | "Executive"`.
- Field `rows`/`cols`/`layout` (grid lama) **dihapus** dari `VehicleTemplate`. `imageUrl` + `seatMap` jadi sumber tunggal kursi.
- Helper `layoutToCounts`/`renumberLayout`/`SeatLayoutGrid` tidak lagi dipakai di vehicles (boleh tetap ada untuk file lain).
- Seed: 9 kendaraan (3 tipe × 3 tier) dengan `imageUrl` placeholder + `seatMap` minimal (admin akan upload gambar nyata).
- Kapasitas default per tipe: Minicar 6, SUV 7, Hiace 12 — admin bisa tambah/kurang lewat editor.

## UI Halaman (src/routes/admin.vehicles.tsx)

Layout baru:

```text
Header: "Vehicles"  [+ Add vehicle]
Filter bar: [Tipe ▾ All|Minicar|SUV|Hiace]  [Tier ▾ All|Reguler|SemiExec|Executive]
─────────────────────────────────────────────
Section: Reguler
  card | card | card
Section: SemiExecutive
  card | card | card
Section: Executive
  card | card | card
```

- Card: thumbnail denah (SeatImageMap kecil), nama, plat, badge tipe + tier, jumlah kursi, tombol Edit/Hapus.
- Section dikelompokkan per tier (atau per tipe — toggle di filter bar).
- Empty state per section bila tidak ada kendaraan.

## Editor (Sheet)

Hanya **satu mode**: Image Map editor.

Field:
- Nama, Plat
- Tipe (Minicar / SUV / Hiace) — preset kapasitas default saat ganti tipe
- Tier (Reguler / SemiExecutive / Executive)
- Upload gambar denah (drag-drop / file picker) — preview langsung
- Stage `SeatImageEditor` (komponen existing) untuk menempatkan marker `seat`/`driver`/`door` di atas gambar
- Footer: total kursi terhitung otomatis, tombol Renumber, Simpan/Batal

Validasi simpan: minimal `imageUrl` ada, minimal 1 marker `seat`. Bila tidak, disable tombol Simpan + tampilkan hint.

## Migrasi Data Tersimpan

Store di-persist dengan key `pyu-admin-v1`. Naikkan ke `pyu-admin-v2` agar user lama dapat seed baru tanpa konflik schema. Atau tambahkan `migrate` di `persist` yang memetakan `className` → `tier` dan `type` lama → baru.

## File yang Disentuh

- `src/lib/mock-data.ts` — perluas `VehicleType`, update seed schedule agar pakai tipe baru.
- `src/store/admin.ts` — ganti schema `VehicleTemplate`, seed 9 kendaraan, migrate persist.
- `src/routes/admin.vehicles.tsx` — rewrite halaman + editor (image-only).
- `src/components/admin/SeatImageEditor.tsx` — minor: dukung kapasitas default & label tier (jika perlu).
- (Tidak diubah) `SeatImageMap.tsx`, `SeatGlyph.tsx` — sudah cukup.

## Di Luar Cakupan

- Penyimpanan gambar ke backend (tetap pakai data URL / object URL lokal).
- Harga per tier (tetap di schedule).
- Editor multi-deck.
