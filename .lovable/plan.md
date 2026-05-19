# Review & Refinement: Image-Based Seat Editor

## What's already built

- `SeatMarker` type + `imageUrl`/`seatMap` on `VehicleTemplate` in `src/store/admin.ts`
- `SeatImageEditor` — upload, click-to-place, drag, edit label, renumber, clear
- `SeatImageMap` — read-only viewer
- Admin vehicles page integrates Image/Grid tabs and shows image-based preview on cards

## Issues found during review

1. **Booking flow ignores the image map.** `src/routes/shuttle.seats.tsx` still uses the legacy hardcoded `SeatPicker`, so the admin's uploaded denah never reaches passengers. The whole feature is invisible to end users.
2. **Renumber sort is broken for rows.** `(a.y - b.y) * 1000 + (a.x - b.x)` — when two seats have very different `y`, a tiny `x` difference can still flip order. Should snap rows by Y-distance threshold, then sort by X.
3. **Stage click vs marker click race.** Clicking a marker bubbles after `stopPropagation` works, but the stage's `onClick` also fires on touch/drag-end in some cases, creating phantom markers next to a dragged one. Need a "did-drag" guard.
4. **No zoom / pan.** On a long Elf denah the markers are tiny and hard to place accurately on mobile.
5. **localStorage quota risk.** Compressed JPEG at 1200px ~150-400KB per vehicle is fine, but with 5+ vehicles the zustand persist payload grows fast. Add a soft check + toast if upload >500KB after compression.
6. **No keyboard delete.** Selecting a marker then pressing Delete/Backspace should remove it.
7. **Driver/door uniqueness.** A vehicle has one driver; currently you can place many. Should auto-replace existing driver when placing a new one.
8. **Grid + Image desync.** When `seatMap` exists, the Grid tab still shows the old layout and `layoutToCounts` is ignored — fine, but the Save handler always writes both. Add a small note in the Grid tab when image map is active so admins know which one wins.
9. **Empty image preview on cards.** When `seatMap` is empty but `imageUrl` is set, card shows the bare image with no markers and "0 kursi". Fall back to Grid preview until at least one seat exists.

## Plan

### A. Wire image map into the booking flow (highest impact)

- In `src/routes/shuttle.seats.tsx`, look up the booked vehicle from `useAdmin().vehicles` by `schedule.vehicleType`/id.
- If `imageUrl && seatMap?.length`, render `SeatImageMap` with `selected`, `booked`, `onToggle`.
- Otherwise fall back to existing `SeatPicker`.
- Keep `maxSelect=4` behavior by guarding inside `onToggle`.

### B. Editor refinements (`SeatImageEditor.tsx`)

- Replace renumber sort with a row-bucketing version: sort seats by `y`, bucket while `Δy < 0.06`, sort each bucket by `x`, assign sequentially.
- Add `didDragRef` set on pointer-move >3px; suppress `onStageClick` for that gesture.
- Pinch/wheel zoom + drag-to-pan stage (simple CSS transform with `scale` 1–3, reset button). Markers stay in relative coords.
- Keyboard handler on stage: Delete/Backspace removes `selectedId`; Esc clears selection.
- Auto-replace existing `driver` / single `door` when placing a new one of the same kind (toast info).
- Toast warning if compressed image >500KB; suggest re-uploading smaller photo.

### C. Sync + preview polish

- `admin.vehicles.tsx` Grid tab: when `imageUrl && seatMap?.length`, show a subtle banner "Denah gambar aktif — grid hanya fallback".
- Vehicle card preview: fall back to `SeatLayoutGrid` whenever `seatMap` is empty, even if `imageUrl` is set.
- Save handler: if `seatMap` is empty array, store `undefined` (already partly done — verify).

### D. Minor

- `renumberSeatMap`: also strip stale labels from non-seat markers (defensive).
- `SeatImageMap` button: add `aria-pressed` for selected seats.

## Technical notes

- Zoom/pan: wrap `<img>` + markers in an inner `<div>` with `transform: scale(z) translate(px,py)`; coordinate math (`getRel`) divides by the inner rect, which already accounts for the transform — so click placement keeps working.
- Row bucket constant `0.06` ≈ 6% of image height, a typical row gap on top-down vehicle photos.
- Keep all changes in presentation/state layers. No schema migration needed (additive).

## Out of scope

- Server persistence (still localStorage via zustand).
- Multiple drivers/doors per vehicle.
- Per-seat pricing or class within one vehicle.
