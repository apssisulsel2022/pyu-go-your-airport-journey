# Routing polyline via OSRM publik

Pakai server publik OSRM (`https://router.project-osrm.org`) untuk menghitung rute jalan, jarak, dan durasi. Tidak butuh API key.

## Yang akan dibangun

1. **Helper `fetchOsrmRoute`** (`src/lib/osrm.ts`)
   - Endpoint: `GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`
   - Return: `{ path: [lat,lng][], distanceKm, durationMin }` atau `null` saat error.
   - Dipanggil dari browser (CORS OSRM mengizinkan). Tidak perlu server function.

2. **Hook `useOsrmRoute(origin, destination)`** (`src/hooks/use-osrm-route.ts`)
   - Pakai `@tanstack/react-query` yang sudah ada.
   - `queryKey` berdasarkan koordinat dibulatkan 5 desimal supaya cache stabil.
   - `staleTime: Infinity` (rute jalan tidak berubah cepat).
   - Return `{ data, isLoading }`.

3. **Integrasi UI shuttle**
   - `shuttle.pickup.tsx`: saat ada titik terpilih → fetch rute → kirim `route={data.path}` ke `MapView`. Bottom sheet menampilkan `data.distanceKm` & ETA dari OSRM (fallback ke mock saat loading/null).
   - `shuttle.pickup.$pointId.tsx`: ganti polyline lurus dengan path OSRM. Update metric "Jarak titik" & "Estimasi ke KNO" pakai hasil routing.
   - `shuttle.tracking.tsx`: rute armada → tujuan ikut jalan dari OSRM.
   - List kartu di pickup tetap pakai `distanceKm` mock (hemat request, OK untuk daftar).

4. **Loading/fallback**: kalau OSRM belum balas atau gagal, gunakan garis lurus + jarak mock yang sudah ada, sehingga UI tidak pernah kosong.

## Catatan

- OSRM publik adalah demo server: rate-limit & latency tidak dijamin. Cocok untuk demo/dev, sebutkan ke user.
- Tidak ada dependency baru.
- Komponen `MapView`/`MapViewClient` sudah menerima `route: [number,number][]`, tidak perlu diubah.
- Tidak menyentuh modul admin/ride/auth.

## File

- BARU: `src/lib/osrm.ts`, `src/hooks/use-osrm-route.ts`
- EDIT: `src/routes/shuttle.pickup.tsx`, `src/routes/shuttle.pickup.$pointId.tsx`, `src/routes/shuttle.tracking.tsx`
