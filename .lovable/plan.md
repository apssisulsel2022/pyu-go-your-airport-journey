# Penyempurnaan Flow Booking Shuttle

Tujuan: meningkatkan tahapan pemesanan dari pilih titik jemput → jadwal → kursi → pembayaran → e-ticket agar lebih informatif dan visual. Penambahan mini map dengan pengukuran jarak, pemilihan tier service yang lebih jelas, dan alur lanjutan yang konsisten hingga download e-ticket.

## Ringkasan perubahan per tahap

### 1. Pilih Titik Jemput (`/shuttle/pickup`)

- Tambahkan **mini map** pada setiap kartu titik jemput menggunakan komponen `MapView` yang sudah ada (Leaflet).
- Mini map menampilkan: titik jemput, KNO airport, dan polyline rute seperti gojek antar keduanya.
- Tampilkan info lengkap di kartu: jarak (km), estimasi waktu tempuh ke KNO, ETA penjemputan, rayon, alamat, kota.
- Layout kartu jadi lebih besar (2 kolom info + map kecil di kanan / atas pada mobile).
- Saat hover/aktif, kartu menonjol; tombol "Pilih titik ini" eksplisit.

### 2. Pilih Jenis Service (BARU — `/shuttle/service`)

- Setelah memilih titik jemput, pengguna ke halaman pemilihan tier: **Reguler / SemiExecutive / Executive**.
- Tiap tier ditampilkan sebagai kartu besar dengan: deskripsi singkat, range harga, jumlah kendaraan tersedia, fasilitas (AC, recliner, dsb. — mock).
- Setelah pilih tier, simpan ke store dan lanjut ke halaman jadwal yang sudah difilter.

### 3. Pilih Kendaraan & Jadwal (`/shuttle/schedule`)

- Filter otomatis hanya jadwal dengan `className === tier` terpilih.
- Tampilkan informasi kendaraan lebih lengkap per kartu jadwal:
  - thumbnail kendaraan (dari `imageUrl` admin vehicle),
  - nama, plat, tipe (Minicar/SUV/Hiace),
  - jam berangkat–tiba, durasi,
  - sisa kursi, harga,
  - fasilitas singkat (badge).
- Date strip 7 hari tetap.

### 4. Pilih Kursi (`/shuttle/seats`) — minor polish

- Sudah memakai `SeatImageMap`. Tambahkan ringkasan kendaraan + tier + titik jemput → KNO di header agar konteks jelas.
- Footer total tetap.

### 5. Pembayaran (`/shuttle/payment`) — tetap, hanya tambah ringkasan service & rute.

### 6. E-Ticket (`/shuttle/ticket`) — tambah tombol **Download E-Ticket** (PDF/PNG)

- Gunakan `html-to-image` untuk merender area tiket → PNG dan trigger download.
- Tombol "Download E-Ticket" di bawah QR.
- Tampilkan info lengkap: nama, kode booking, rute, jadwal, kendaraan, kursi, harga, QR.

## Detail Teknis

### Store

- Tambah field `tier: VehicleTier | null` di `useBooking` + setter `setTier`.
- `reset()` reset tier juga.

### Routing baru

- File: `src/routes/shuttle.service.tsx` (route `/shuttle/service`).
- Update arah navigasi:
  - `pickup` → `/shuttle/service`
  - `service` → `/shuttle/schedule`
  - sisanya tidak berubah.

### Mini map di pickup

- Reuse `MapView` (Leaflet). Set `className="h-32 w-full"`, `points` = [pickup, KNO], `route` = [[pickup.lat,lng],[KNO.lat,lng]], `zoom` agar fit keduanya (pakai center = midpoint).
- Jarak ditampilkan dari field `distanceKm` yang ada; tambahkan rumus haversine kalau perlu untuk konsistensi (gunakan `distanceKm` mock saja agar simpel).

### Filter jadwal per tier

- `getSchedulesForPickup` tetap; filter di komponen: `schedules.filter(s => s.className === tier)`.
- Jika kosong, tampilkan empty state.

### Download E-ticket

- `bun add html-to-image`.
- Tombol memanggil `toPng(ticketRef.current)` → buat `<a download="eticket-{code}.png">` dan click.

### Komponen baru

- `src/components/PickupMiniMap.tsx` — wrapper kecil sekitar `MapView` untuk konsistensi.
- `src/routes/shuttle.service.tsx` — halaman pilih tier.

## Out of scope

- Perubahan backend / persistensi.
- Perhitungan jarak realistis via routing API (gunakan distance mock + garis lurus).
- Multi-passenger detail form changes.