# Halaman Pratinjau Rute Titik Jemput → KNO

Saat pengguna memilih titik jemput, alih-alih langsung lanjut ke pemilihan layanan, arahkan ke halaman pratinjau rute berisi peta jalur titik jemput → Bandara Kualanamu (KNO) beserta informasi detail perjalanan. Pengguna mengkonfirmasi titik dari halaman ini sebelum lanjut ke step "Layanan".

## Alur Baru

```text
Pickup (pilih kartu)
   │  navigate dengan param :pointId
   ▼
Pickup Route Preview  ── Konfirmasi ──▶  Service ─▶ Schedule ─▶ ...
   │
   └── Ganti titik (kembali ke /shuttle/pickup)
```

Sheet bawah kecil di halaman pickup tetap ada untuk preview cepat, tetapi tombol utamanya menjadi **"Lihat rute & detail"** yang membuka halaman pratinjau. Tombol "Pilih titik ini" dipindah ke halaman pratinjau agar keputusan diambil setelah melihat rute lengkap.

## Halaman Baru: `/shuttle/pickup/$pointId`

File: `src/routes/shuttle.pickup.$pointId.tsx`

Isi:
- Header "Rute ke KNO" + subjudul nama titik jemput.
- `BookingStepper` (tetap di step Pickup).
- **Peta besar** (≈ 280px) menggunakan `MapView` dengan:
  - `points`: titik jemput + KNO
  - `route`: garis lurus titik jemput → KNO
  - `vehicleEmoji`: 🚐 pada titik jemput
  - auto-fit center antara dua titik, zoom 10–11
- **Kartu Detail Perjalanan** berisi:
  - Origin: nama titik jemput, alamat lengkap, rayon, kota
  - Destination: KNO Bandara Internasional Kualanamu
  - Grid metrik: Jarak (`distanceKm`), ETA jemput (`etaMin`), Estimasi ke KNO (`distanceKm * 2.5 + 30` menit), Estimasi tiba (jam aktual = sekarang + estimasi)
  - Catatan operasional: koordinat GPS, jam operasional jemput (mock: 04:00–22:00), nomor PIC area (mock per rayon)
- **Kartu Petunjuk Lokasi Jemput**: deskripsi singkat landmark + tombol "Buka di Google Maps" (link `https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=KNO_lat,KNO_lng`).
- **CTA sticky bawah**:
  - Sekunder: "Ganti titik" → kembali ke `/shuttle/pickup`
  - Primer: "Pilih titik ini & lanjut" → `setPickup(point)` lalu `navigate("/shuttle/service")`

## Perubahan File

- **Baru** `src/routes/shuttle.pickup.$pointId.tsx` — halaman pratinjau rute.
- **Edit** `src/routes/shuttle.pickup.tsx`:
  - Bottom sheet tetap menampilkan PickupMiniMap + ringkasan singkat.
  - Tombol utama di sheet menjadi "Lihat rute & detail" → `navigate({ to: "/shuttle/pickup/$pointId", params: { pointId: selected.id } })`.
  - Hapus `setPickup` di sheet (pindah ke halaman pratinjau).
- **Tidak diubah**: `MapView`, `MapViewClient`, `PickupMiniMap`, store booking, route lain.

## Catatan Teknis

- Param route diambil dengan `Route.useParams()`; jika `pointId` tidak ditemukan di `pickupPoints`, render `notFoundComponent` sederhana dengan link kembali ke `/shuttle/pickup`.
- Sertakan `errorComponent` minimal sesuai konvensi TanStack Start.
- Tidak ada perubahan store / backend; semua data berasal dari `pickupPoints` & `KNO_AIRPORT` di `src/lib/mock-data.ts`.
- Link Google Maps menggunakan URL publik (tidak memerlukan API key).
