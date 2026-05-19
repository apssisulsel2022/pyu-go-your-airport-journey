# Refinement `/shuttle/pickup` — Map Lebih Terlihat

## Masalah

- Map hanya muncul di dalam bottom sheet kecil (80×112 px) setelah user memilih titik. Pada viewport ini hampir tidak terlihat dan terasa seperti "tidak ada map".
- Tidak ada konteks visual lokasi titik jemput vs KNO di awal halaman, padahal data koordinat (lat/lng) sudah lengkap.
- Mini map memakai `zoom={10}` → titik & KNO terlihat sebagai dua dot kecil, polyline samar.

## Yang akan dirubah (UI only)

1. **Map overview di atas list**
   - Tambah `MapView` setinggi `h-56` di bawah `BookingStepper`, sebelum kolom search.
   - Menampilkan semua titik jemput hasil filter + marker KNO.
   - Center & zoom otomatis: kalau ada `selected` → center ke selected dengan zoom 12 dan tarik polyline ke KNO; kalau tidak → center ke rata-rata semua titik filtered + KNO, zoom 10.
   - Marker selected diberi style berbeda (lebih besar / warna primary penuh) supaya menonjol.

2. **Bottom sheet (preview saat selected)**
   - Perbesar mini map dari `h-20 w-28` → `h-28 w-36`, zoom dinaikkan ke `12`, supaya rute & titik kelihatan.
   - Tambahkan label kecil "Rute ke KNO" di atas map.

3. **MapView / MapViewClient**
   - Tambah optional prop `highlightIndex?: number` agar marker tertentu memakai icon lebih besar (radius 14, ring tebal).
   - Tidak mengubah API yang sudah dipakai komponen lain (semua prop baru bersifat optional).

4. **Interaksi**
   - Klik marker di map overview = sama dengan klik card list (set `selectedId`).
   - Saat `selectedId` berubah, map overview re-center via `key` reset (paling sederhana, tanpa imperative leaflet API).

## File yang disentuh

- `src/routes/shuttle.pickup.tsx` — tambah section map overview, perbesar mini map.
- `src/components/PickupMiniMap.tsx` — terima `zoom` & default lebih besar.
- `src/components/MapViewClient.tsx` — tambah prop `highlightIndex` + icon varian.
- `src/components/MapView.tsx` — forward prop baru.

## Tidak disentuh

- Halaman detail titik jemput `/shuttle/pickup/$pointId` (sudah punya map sendiri).
- Mock data, store, routing, business logic.
- Modul shuttle lain (schedule, seats, payment, tracking).

## Catatan teknis

- Map dimuat via dynamic import di `MapView` (sudah ada). Leaflet CSS sudah di-`@import` di `src/styles.css`, jadi map seharusnya ter-render — penyebab utama "tidak terlihat" adalah ukuran 80×112 px di bottom sheet, bukan masalah library.
- Tidak ada dependency baru.
