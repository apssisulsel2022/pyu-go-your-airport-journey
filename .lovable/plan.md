# MVP — Integrasi Penuh ke Lovable Cloud

Database & auth sudah siap. Sekarang kita potong scope ke alur inti yang benar-benar jalan end-to-end, ganti semua mock/localStorage dengan data DB, dan kunci halaman dengan auth nyata.

## Scope MVP (yang masuk)

1. **Auth nyata** — email/password + Google. Hapus admin login lama. Semua halaman privat di-gate.
2. **Booking shuttle end-to-end** — pilih pickup → jadwal → kursi (realtime) → penumpang → bayar (mock) → e-tiket.
3. **Daftar pesanan saya** — `bookings.tsx` baca dari DB.
4. **Tracking shuttle** — polyline OSRM (sudah ada) + posisi driver realtime jika tersedia.
5. **Admin minimal** — login admin (role-gated), kelola Pickup Points, Vehicles, Schedules, lihat Bookings.
6. **Seed data** — 1 rute Medan→KNO, 4–6 pickup points, 2 vehicle, jadwal hari ini & besok, 1 akun admin.

## Yang DIBUANG/ditunda dari MVP

- Modul **Ride hailing** (`ride.tsx`, `ride.tracking.tsx`) — sembunyikan dari menu, route tetap tapi tampilkan "Coming soon". Tabel `ride_orders` & `driver_locations` tetap ada, belum dipakai UI.
- Halaman OTP (`auth.otp.tsx`) — tidak dipakai (auto-confirm aktif). Redirect ke login.
- Admin Operations (`admin.operations.tsx`) — sembunyikan, halaman placeholder.
- Promo code, kelas multi-tier kompleks, refund — keluar dari MVP.

## Arsitektur Eksekusi

### Server Functions (`src/lib/*.functions.ts`)

- `shuttle.functions.ts`: `listPickupPoints`, `listSchedules({pickupPointId, date})`, `getScheduleSeats(scheduleId)`.
- `bookings.functions.ts`: `createBooking({scheduleId, seatIds, passengers})`, `listMyBookings`, `getBooking(id)`, `cancelBooking(id)`.
- `payments.functions.ts`: `mockPayBooking(bookingId)` — sleep 800ms, 90% sukses → insert `payments`+`transactions`, update `bookings.status='paid'`, `seats.status='booked'`.
- `admin.functions.ts` (pakai `requireSupabaseAuth` + cek `has_role(admin)`): CRUD pickup_points, vehicles, schedules; list bookings.

Semua pakai `requireSupabaseAuth`. Pastikan `attachSupabaseAuth` terpasang di `src/start.ts`.

### Realtime hook

- `useSeatAvailability(scheduleId)` — subscribe channel `seats` filter schedule_id, refetch saat berubah.

### Routing & gate

- Tambah `src/routes/_authenticated.tsx` (`beforeLoad` → cek session, redirect `/auth/login`). Pindahkan semua halaman privat (shuttle.*, bookings, account) ke prefix `_authenticated`.
- Tambah `src/routes/_authenticated/_admin.tsx` — server fn `requireAdmin` cek role; admin.* dipindahkan ke sini.
- `__root.tsx`: pasang listener `onAuthStateChange` (invalidate router + react-query) — satu kali.

### UI migration (ganti mock-data.ts & zustand booking)

| Halaman | Sumber data baru |
|---|---|
| `shuttle.pickup.tsx` & `$pointId` | `listPickupPoints` |
| `shuttle.service.tsx` | tetap (pilihan layanan) |
| `shuttle.schedule.tsx` | `listSchedules` |
| `shuttle.seats.tsx` | `getScheduleSeats` + `useSeatAvailability` |
| `shuttle.passenger.tsx` | form lokal, draft di zustand |
| `shuttle.payment.tsx` | `createBooking` → `mockPayBooking` |
| `shuttle.ticket.tsx` | `getBooking(id)` |
| `shuttle.tracking.tsx` | OSRM polyline (sudah) + DB schedule |
| `bookings.tsx` | `listMyBookings` |
| `account.tsx` | `profiles` (baca/update) |
| `admin.pickup-points/vehicles/schedules/bookings` | admin server fn |

Zustand `useBooking` dipertahankan sebagai **draft wizard** saja (pre-submit). Setelah `createBooking` sukses, sumber kebenaran = DB.

### Seed

Migration kecil yang insert: 1 route, 4 pickup_points (Medan), 2 vehicles (Hiace 12 seat, Elf 15 seat), 4 schedules (hari ini & besok). Akun admin di-promote manual via tool insert setelah user signup (atau seed satu user via dashboard).

## File yang Disentuh

**Baru**
- `src/routes/_authenticated.tsx`, `src/routes/_authenticated/_admin.tsx`
- `src/lib/shuttle.functions.ts`, `bookings.functions.ts`, `payments.functions.ts`, `admin.functions.ts`
- `src/hooks/use-seat-availability.ts`, `src/hooks/use-auth.ts`

**Edit**
- `src/routes/__root.tsx` (auth listener)
- Semua `shuttle.*`, `bookings.tsx`, `account.tsx`, `admin.*`
- `src/routes/auth.login.tsx`, `auth.register.tsx` (Supabase + Google broker)
- `src/store/booking.ts` (ramping, draft saja)
- `src/start.ts` (verify `attachSupabaseAuth`)

**Hapus / nonaktifkan**
- Mock admin login lama (di `admin.tsx`)
- `src/lib/mock-data.ts` (dihapus setelah migrasi selesai)
- `src/store/admin.ts` (digantikan server fn)
- `ride.*` disembunyikan dari nav (file tetap)

## Catatan

- Google OAuth: panggil `configure_social_auth(["google"])` saat memasang tombol.
- Routing TanStack: hindari trailing slash; route privat butuh `_authenticated` agar SSR tidak 401.
- File `src/integrations/supabase/*` tidak disentuh.
