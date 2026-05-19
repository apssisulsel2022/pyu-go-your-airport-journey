# Admin Panel — Phase 3a (Frontend, Mock Data)

Build a mobile-first but desktop-optimized admin panel for PYU - GO to manage pickup points, schedules, vehicle/seat layouts, and bookings. This phase stays frontend-only on the existing mock data store (no Supabase yet). When Phase 2 (Lovable Cloud) lands, the same screens swap their data source to server functions.

## Scope

In:
- Admin shell with sidebar nav + KPI dashboard
- CRUD UI for Pickup Points, Schedules, Vehicles (with seat layout editor)
- Bookings list with filters + detail drawer + status actions (confirm / cancel / refund)
- Mock auth gate (admin role flag in local store)

Out (later phases):
- Real Supabase tables, RLS, server functions
- Drivers, routes, rides heatmap, revenue Recharts (Phase 3b)
- Real payments / refunds

## Routes

```text
/admin                  -> dashboard (KPIs + recent bookings)
/admin/pickup-points    -> list + create/edit/delete
/admin/schedules        -> list (filter by pickup) + create/edit/delete
/admin/vehicles         -> list of vehicle templates + seat layout editor
/admin/bookings         -> table with filters; row -> detail drawer
```

All under a new `_admin` layout route (`src/routes/_admin.tsx`) that:
- Renders an `AdminSidebar` (collapsible, lucide icons) + top bar with `SidebarTrigger`
- Gates access via a simple `useAdminGuard()` hook reading `localStorage.pyu_role === "admin"` (toggle from `/account` for demo). Redirects to `/auth/login` otherwise.
- Bottom nav is hidden on admin routes.

## Data layer

New `src/store/admin.ts` (Zustand + `persist`) holds editable copies of:
- `pickupPoints`
- `vehicles` (id, name, type, plate, `seatLayout: SeatCell[][]`)
- `schedules` (extended: vehicleId fk)
- `bookings` (seeded with ~25 realistic rows: passenger, pickup, schedule, seats, status, amount, createdAt)

Seed from existing `mock-data.ts` on first load. All mutations go through store actions so the user-facing booking flow stays consistent.

`SeatCell` model:
```ts
type SeatCell =
  | { kind: "seat"; label: string }
  | { kind: "aisle" }
  | { kind: "driver" }
  | { kind: "door" }
  | { kind: "empty" };
```
Grid is rows x cols (e.g. Hiace 5x3). Existing `SeatPicker` is refactored to render from `seatLayout` instead of hard-coded SVG so the editor and user view stay in sync.

## Key screens

### Dashboard (`/admin`)
- 4 KPI cards: Bookings today, Revenue today, Seat occupancy %, Active schedules
- "Recent bookings" table (last 10) with status pill
- "Top pickup points" bar list

### Pickup Points (`/admin/pickup-points`)
- Searchable table: rayon, name, city, distance, ETA, lat/lng
- "Add point" + row edit via shadcn `Dialog` with RHF + Zod
- Delete confirms via `AlertDialog`

### Schedules (`/admin/schedules`)
- Filter by pickup point + vehicle type + date
- Table: time, route, vehicle, class, price, booked/total, status
- Create/edit dialog with pickup + vehicle selectors, time pickers, price, class
- Live "seats booked" read-only (derived from bookings)

### Vehicles + Seat Layout (`/admin/vehicles`)
- Card grid of vehicle templates (Hiace / Elf / Minibus + custom)
- Edit screen: name, type, plate, class, rows/cols inputs, then an interactive grid where each cell cycles `seat -> aisle -> driver -> door -> empty` on click. Seat labels auto-number left-to-right, top-to-bottom; "Renumber" button rebuilds.
- Live preview of `SeatPicker` rendering the layout
- Save updates store; schedules referencing this vehicle re-render with new layout

### Bookings (`/admin/bookings`)
- Filters: status, date range, pickup, search by passenger / booking code
- Table with pagination (10/page)
- Row click opens `Sheet` (right drawer) with full booking detail: passenger, contact, pickup, schedule, seats (rendered via mini SeatPicker preview), payment, timeline
- Actions: Confirm, Mark Boarded, Cancel (+ reason), Refund (mock). Status changes update store + show toast.

## Components

New under `src/components/admin/`:
- `AdminSidebar.tsx`
- `AdminShell.tsx` (header + main wrapper)
- `KpiCard.tsx`
- `DataTable.tsx` (lightweight, shadcn table + pagination)
- `StatusBadge.tsx`
- `PickupPointDialog.tsx`
- `ScheduleDialog.tsx`
- `VehicleEditor.tsx` (with `SeatLayoutGrid.tsx`)
- `BookingDetailSheet.tsx`

Refactor:
- `src/components/SeatPicker.tsx` -> driven by `SeatCell[][]` from the vehicle. Falls back to default Hiace layout if none provided. User shuttle flow updated to pass `vehicle.seatLayout`.

## Design

- Reuse existing tokens from `src/styles.css` (Traveloka blue, soft shadows, xl/2xl radii). Admin shell uses `bg-muted/30` canvas with white cards.
- Plus Jakarta Sans across the board.
- Framer Motion on dialog/sheet open, table row hover, KPI count-up.
- Empty states with illustrated placeholders.

## Technical details

- Stack: existing React + TS + Tailwind + shadcn + Zustand + RHF/Zod + Framer Motion. No new deps required.
- Routing: TanStack file routes. `_admin.tsx` is a pathless layout with `<Outlet />`. Children: `_admin/index.tsx`, `_admin/pickup-points.tsx`, `_admin/schedules.tsx`, `_admin/vehicles.tsx`, `_admin/vehicles.$id.tsx`, `_admin/bookings.tsx`.
- Sidebar uses shadcn `sidebar` primitives with `collapsible="icon"`.
- All mutations are local (Zustand persist) — clearly labeled "Demo mode" in the header until Phase 2 backend wiring.
- Root layout hides `BottomNav` when `location.pathname.startsWith("/admin")`.

## Open question

The plan assumes the seat picker should become layout-driven now so the editor is meaningful. If you'd rather keep `SeatPicker` as-is and just expose `rows/cols/plate` for vehicles (no visual editor), say so and I'll trim the Vehicles screen accordingly.
