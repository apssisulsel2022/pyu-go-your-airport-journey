# Polyline mengikuti jalan + jarak hasil routing

Saat ini peta menggambar polyline lurus (straight line) antara titik jemput dan KNO, dan `distanceKm` di-hardcode di mock data. Kita akan ganti dengan hasil Google Routes API agar polyline mengikuti jalan dan jarak/ETA akurat.

## Yang akan dilakukan

1. **Aktifkan konektor Google Maps Platform** (Lovable connector — tanpa setup manual). Dipakai server-side via gateway, jadi API key tetap aman.

2. **Server function `getDrivingRoute`** (`src/lib/routing.functions.ts`):
   - Input: `{ origin: {lat,lng}, destination: {lat,lng} }`
   - Memanggil `routes/directions/v2:computeRoutes` lewat gateway dengan `travelMode: DRIVE`, field mask `routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline`.
   - Output: `{ distanceMeters, durationSec, encodedPolyline }`.

3. **Helper decode polyline** (`src/lib/polyline.ts`): decoder standar Google encoded polyline → `[lat,lng][]`. Tanpa dependency baru.

4. **Hook `useDrivingRoute(origin, destination)`** (`src/hooks/use-driving-route.ts`):
   - Pakai `@tanstack/react-query` (sudah ada di project) + `useServerFn`.
   - Cache key: koordinat dibulatkan 5 desimal supaya stabil.
   - Return `{ path, distanceKm, durationMin, isLoading }`.

5. **Konsumsi di UI shuttle**:
   - `shuttle.pickup.tsx` (map overview): saat ada titik terpilih, fetch rute → kirim `route={path}` ke `MapView`. Tampilkan `distanceKm` & ETA hasil routing di bottom sheet (fallback ke mock saat loading).
   - `shuttle.pickup.$pointId.tsx`: ganti polyline lurus dengan path hasil routing, tampilkan jarak & estimasi tempuh dari API. Pertahankan layout/metric yang ada.
   - `shuttle.tracking.tsx`: rute armada → KNO juga ikut jalan (sama hook).
   - `PickupMiniMap.tsx` & list cards: opsional, mini-map tetap pakai garis lurus (hemat kuota); kartu list pakai mock distance sebagai estimasi cepat.

6. **Loading & fallback**: saat fetch belum selesai atau gagal, fallback ke garis lurus + `distanceKm` dari mock supaya UI tidak kosong.

## Catatan teknis

- Semua call ke Routes API lewat **server function** (gateway butuh `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY` yang hanya ada di server).
- React Query menghindari refetch saat user pindah-pindah titik.
- `MapView`/`MapViewClient` sudah menerima `route: [number,number][]` — cukup oper path hasil decode, tidak perlu ubah komponen map.
- Tidak menyentuh modul lain (admin, ride, dsb).

## File yang disentuh

- BARU: `src/lib/routing.functions.ts`, `src/lib/polyline.ts`, `src/hooks/use-driving-route.ts`
- EDIT: `src/routes/shuttle.pickup.tsx`, `src/routes/shuttle.pickup.$pointId.tsx`, `src/routes/shuttle.tracking.tsx`
