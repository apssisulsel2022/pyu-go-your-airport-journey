# PYU - GO — Build Plan

A mobile-first travel app combining **airport shuttle booking** (to KNO Airport) and **ride hailing**, styled like Traveloka with premium polish.

## Scope for this plan

This is a large product. I'll deliver it in **3 phases** so each phase is shippable, reviewable, and visually complete. You approve this plan once; I'll pause between phases for feedback.

---

## Phase 1 — User App (Shuttle + Ride Hailing) + Design System

The visible product end-users will experience. Built with mock data so the entire flow is clickable without a backend.

**Design system**
- Traveloka-inspired tokens in `src/styles.css` (blue primary, soft shadows, xl/2xl radii, gradient hero)
- Framer Motion page/element transitions, skeleton loaders
- Sticky mobile bottom nav + floating CTAs

**Auth UI** (visual only in Phase 1)
- Login, Register, Social login buttons, OTP verification screen

**Home**
- Hero search, Shuttle/Ride toggle cards, promo carousel, popular routes, nearby pickup points, upcoming schedules

**Shuttle booking flow**
1. Pickup point picker (cards w/ address, distance, ETA, mini map)
2. Destination (KNO Airport, fixed)
3. Date picker
4. Schedule list (time, seats left, vehicle, class, price)
5. **Seat picker** — SVG layouts for Hiace / Elf / Mini Bus, color-coded states, animated selection
6. Payment (mock): summary, promo code, e-wallet / VA / card UIs
7. **E-ticket**: QR, booking code, seat, route, passenger info
8. **Live tracking**: OpenStreetMap (Leaflet) with animated shuttle marker, ETA, driver/vehicle info, countdown

**Ride hailing flow**
- Pickup + destination input, fare estimate, nearby drivers map, driver matching animation, ride status tracking

---

## Phase 2 — Backend (Lovable Cloud) + Real Auth + Realtime

Wire the UI to a real backend.

**Enable Lovable Cloud** for Postgres + Auth + Realtime + RLS.

**Schema**
```text
users (auth.users + profiles)
user_roles (admin | driver | customer)  -- separate table, enum, has_role()
drivers, vehicles (type: hiace|elf|minibus, seat_layout jsonb)
routes, pickup_points (lat/lng)
schedules (route_id, vehicle_id, departure_at, price, class)
bookings (user_id, schedule_id, status, total)
seats, seat_bookings (schedule_id, seat_no, status)  -- realtime
payments, transactions
ride_orders (pickup, dropoff, driver_id, status, fare)
driver_locations (driver_id, lat, lng, updated_at)  -- realtime
```

**Auth**: Supabase email/password + Google (via Lovable broker). Profile row auto-created via trigger.

**RLS**: customers see own bookings; drivers see assigned trips; admins via `has_role()` security-definer function.

**Realtime hooks**: seat availability, driver location, shuttle position, booking/ride status.

**Mock payment**: server fn that simulates success/failure and writes `payments` + `transactions`.

---

## Phase 3 — Driver App + Admin Panel

**Driver app** (`/driver/*`, role-gated)
- Today's trips, passenger manifest with QR scan check-in, start/finish trip, location broadcast toggle, ride-hailing incoming requests

**Admin panel** (`/admin/*`, role-gated)
- KPI cards, revenue chart (Recharts), active bookings table
- CRUD: fleet, drivers, routes, pickup points, schedules
- Seat occupancy analytics, ride heatmap

---

## Technical notes

- Stack matches request: React + TS + Tailwind + shadcn + Framer Motion + Zustand + RHF/Zod
- Maps: **Leaflet + OpenStreetMap** (no API key)
- Routing: TanStack Router file-based; layouts `_authenticated`, `_authenticated/driver`, `_authenticated/admin`
- Server work via `createServerFn` (not Edge Functions)
- Seat picker: reusable component driven by `vehicle.seat_layout` JSON so new vehicle types are data-only

## What I need from you before starting Phase 1

1. **Brand color** — keep Traveloka-style blue (`#0770E3`-ish), or pick your own?
2. **Logo** — do you have one, or should I generate a "PYU - GO" wordmark?
3. **Initial pickup points** — use your three examples (Hermes Palace / Cambridge / Hotel TD Pardede) as seed data, plus ~5 more I'll invent?
4. **Phase 1 sign-off model** — proceed straight through Phase 1 → 2 → 3, or pause for review after each phase? (Recommended: pause.)

After your answers I'll start Phase 1.
