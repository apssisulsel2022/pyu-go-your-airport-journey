# Penyempurnaan Halaman Lacak Shuttle

Tujuan: membuat halaman `/shuttle/tracking` terasa realtime — posisi shuttle bergerak halus di map, ETA terus menghitung mundur, status timeline berubah otomatis, dan info perjalanan (kecepatan, jarak tersisa, jam tiba) selalu update.

## Perubahan UX

### Phase perjalanan otomatis
Empat fase yang dijalankan berurutan berdasarkan progress (0–1):
1. **Driver dijadwalkan** (progress 0)
2. **Menuju titik jemput** (0–0.35) — shuttle bergerak dari posisi awal driver ke pickup
3. **Tiba di titik jemput / boarding** (0.35–0.4) — jeda singkat
4. **Dalam perjalanan ke KNO** (0.4–1) — shuttle bergerak dari pickup ke bandara
5. **Tiba di KNO** (progress = 1)

Step timeline tercentang otomatis sesuai fase aktif.

### Peta realtime
- Polyline penuh dari titik awal driver → pickup → KNO sebagai rute referensi (abu).
- Polyline kedua menebal di bagian yang sudah dilalui (biru primary).
- Marker shuttle (icon bus) bergerak halus tiap 1 detik dengan interpolasi linear antara titik.
- Auto-pan map mengikuti shuttle (opsional, tetap fit-to-route saat mount).

### Live info card
- **ETA**: hitung dari sisa jarak / kecepatan rata-rata, refresh tiap detik (format menit + detik).
- **Jarak tersisa** (km) — haversine, update tiap tick.
- **Kecepatan saat ini** (km/h) — variasikan 30–55 km/h, refresh tiap 3 detik.
- **Estimasi waktu tiba (jam)** — `now + ETA`.
- Badge "LIVE" dengan dot berkedip.

### Notifikasi fase
Toast (sonner) saat fase berganti, misal "Shuttle tiba di titik jemput" dan "Boarding selesai, menuju KNO".

## Detail Teknis

### Komponen baru
- `src/components/LivePulse.tsx` — dot hijau berkedip + label "LIVE".

### State & timer di `shuttle.tracking.tsx`
- `progress` 0–1, naik dengan `requestAnimationFrame` (delta time-based) bukan setInterval, supaya smooth.
- Total durasi simulasi: ~120 detik (pickup→KNO) + 60 detik (driver→pickup).
- Hitung `currentPos` dari segmen aktif (driver→pickup atau pickup→KNO) berdasarkan `subProgress`.
- `etaSec` dihitung dari sisa jarak total dibagi kecepatan rata-rata simulasi.
- `speedKmh` di-randomize halus (sin wave + jitter) tiap detik untuk efek hidup.
- `useEffect` cleanup `cancelAnimationFrame`.

### Util
- `haversine(a,b)` jarak km.
- `lerp(a,b,t)` interpolasi.
- Driver start position: offset acak ~1.5km dari pickup (simulasi posisi awal driver).

### MapView
- Tambah prop `vehicleIcon` opsional di `MapViewClient` — ganti icon `✈️` jadi `🚐` saat mode shuttle. Aktualnya, reuse `showPlane` rename ke `showVehicle` + emoji opsional. Untuk minimal change: tambah prop `vehicleEmoji` opsional, default "✈️".
- Tambah dukungan dua polyline (rute penuh abu + rute terlewati biru) lewat prop `traveledRoute` opsional.

### File yang disentuh
- `src/routes/shuttle.tracking.tsx` (rewrite logic + UI)
- `src/components/MapView.tsx` + `src/components/MapViewClient.tsx` (tambah props `vehicleEmoji`, `traveledRoute`)
- `src/components/LivePulse.tsx` (baru)

## Out of scope
- Integrasi WebSocket/GPS real (semua tetap simulasi client-side).
- Routing API jalan (rute tetap garis lurus antar 3 titik).
- Push notification system.
