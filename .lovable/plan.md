# Phase 2 — Integrasi Backend Lovable Cloud (Auth, DB, Realtime, RLS)

Aktifkan Lovable Cloud, bangun skema lengkap, ganti seluruh state lokal/mock & login admin lama dengan auth + database asli, lalu hidupkan realtime untuk kursi, lokasi driver, dan status pesanan.

## Langkah Eksekusi

### 1. Enable Lovable Cloud
- Aktifkan Cloud (Postgres + Auth + Storage + Realtime).
- Setelah aktif, semua koneksi pakai client bawaan `@/integrations/supabase/*` (browser, auth-middleware, admin).

### 2. Skema Database (migration)
Buat tabel berikut + enum + trigger:

```text
app_role (enum: admin | driver | customer)
vehicle_type (enum: hiace | elf | minibus)
booking_status (enum: pending | paid | boarded | completed | cancelled)
ride_status (enum: requested | accepted | ongoing | completed | cancelled)
payment_status (enum: pending | success | failed | refunded)
seat_status (enum: available | held | booked)

profiles            (id pk -> auth.users, full_name, phone, avatar_url, created_at)
user_roles          (id, user_id, role app_role, unique(user_id, role))
drivers             (id pk -> auth.users, license_no, rating, status, vehicle_id)
vehicles            (id, plate, name, type vehicle_type, capacity, seat_layout jsonb)
routes              (id, origin, destination, distance_km)
pickup_points       (id, route_id, name, address, lat, lng, area)
schedules           (id, route_id, vehicle_id, pickup_point_id, departure_at, price, class, seats_total)
seats               (id, schedule_id, seat_no, status seat_status)  -- realtime
bookings            (id, code, user_id, schedule_id, status booking_status, total, created_at)
seat_bookings       (id, booking_id, seat_id, passenger_name)
payments            (id, booking_id, method, amount, status payment_status, paid_at)
transactions        (id, payment_id, ref, payload jsonb, created_at)
ride_orders         (id, user_id, driver_id, pickup jsonb, dropoff jsonb, fare, status ride_status, created_at)  -- realtime
driver_locations    (driver_id pk, lat, lng, heading, updated_at)  -- realtime
```

Trigger: `handle_new_user()` auto-insert ke `profiles` + role `customer` saat signup.

Security definer function: `public.has_role(_uid uuid, _role app_role) returns boolean`.

### 3. RLS Policies (ringkas)
- `profiles`: user baca/ubah miliknya; admin via `has_role`.
- `user_roles`: hanya admin yang mengubah; user baca milik sendiri.
- `bookings`, `seat_bookings`, `payments`, `transactions`: customer hanya yang miliknya; admin semua.
- `ride_orders`: customer (user_id) & driver (driver_id) yang terlibat; admin semua.
- `driver_locations`: driver update miliknya; semua authenticated boleh select (untuk tracking).
- `seats`: select untuk authenticated; update hanya via server fn.
- Tabel master (`routes`, `pickup_points`, `vehicles`, `schedules`): select untuk semua authenticated; tulis admin.

### 4. Auth Asli (hapus admin lama)
- Hapus mock login admin (route/komponen lama yang pakai password hardcode/localStorage).
- `/auth/login` & `/auth/register`: Supabase email/password.
- Google sign-in via Lovable broker (`lovable.auth.signInWithOAuth("google")`) + panggil `configure_social_auth(["google"])`.
- Hook `useAuth` dengan `onAuthStateChange` di `__root.tsx` (invalidate router + react-query).
- Layout `_authenticated.tsx` (gate via `beforeLoad`) untuk halaman privat.
- Layout `_authenticated/_admin.tsx` cek `has_role(auth.uid, 'admin')` via server fn.

### 5. Server Functions (createServerFn)
Letakkan di `src/lib/*.functions.ts` (admin client di `*.server.ts`):
- `listSchedules`, `getScheduleSeats`
- `createBooking` (hold seat, insert booking + seat_bookings)
- `mockPayBooking` (simulasi sukses/gagal → tulis payments + transactions, set booking `paid`, seats `booked`)
- `listMyBookings`, `cancelBooking`
- `requestRide`, `acceptRide` (driver), `updateRideStatus`
- `upsertDriverLocation`
- Admin: `adminListBookings`, `adminCreateSchedule`, `adminCrudVehicle`, `adminCrudPickupPoint`.

Semua server fn pakai `requireSupabaseAuth`; untuk admin tambah cek `has_role`.

### 6. Realtime Hooks
`src/hooks/`:
- `useSeatAvailability(scheduleId)` — subscribe `seats` filter schedule.
- `useDriverLocation(driverId)` — subscribe `driver_locations`.
- `useRideStatus(rideId)` / `useBookingStatus(bookingId)`.

### 7. Migrasi UI (ganti mock & localStorage)
- `shuttle.pickup` → query `pickup_points`/`routes`.
- `shuttle.schedule` → `schedules` (filter tanggal & rute).
- `shuttle.seats` → `useSeatAvailability` + `createBooking`.
- `shuttle.payment` → `mockPayBooking`.
- `shuttle.ticket`, `bookings` → `listMyBookings` (live status).
- `shuttle.tracking` → `useDriverLocation` (OSRM tetap untuk polyline).
- `ride` → `requestRide` + realtime status.
- `account` → `profiles`.
- `admin.*` → query asli, dilindungi role admin.
- Store `useBooking` (zustand) dipakai hanya untuk draft wizard pre-submit; setelah `createBooking` data ikut DB.

### 8. Seed Data
Insert data awal: 1 route (Medan → KNO), beberapa pickup_points (sudah ada di mock), 2 vehicle, beberapa schedule untuk hari ini & besok, 1 akun admin demo (via SQL update `user_roles`).

## Catatan Teknis
- Tidak pakai Supabase Edge Functions; semua logic via `createServerFn`.
- Mock payment: server fn yang sleep 800ms lalu 90% sukses.
- OSRM routing tetap dari client (tidak terkait DB).
- Tidak menambah dependency baru.

## File yang Akan Disentuh (ringkas)
- BARU: migration SQL, `src/lib/{bookings,rides,admin,payments}.functions.ts`, `src/lib/*.server.ts`, hooks realtime, `src/routes/_authenticated.tsx`, `src/routes/_authenticated/_admin.tsx`.
- EDIT: `src/routes/__root.tsx`, semua `shuttle.*`, `ride.*`, `admin.*`, `auth.login.tsx`, `auth.register.tsx`, `account.tsx`, `bookings.tsx`, `src/store/booking.ts`, `src/store/admin.ts`.
- HAPUS: mock login admin lama (password hardcode / bypass localStorage).
