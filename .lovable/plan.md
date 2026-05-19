# Seat Editor Refinement — Airline-Style Realistic Seats

Tujuan: ubah marker bulat sederhana menjadi rendering kursi realistis bergaya airline seat map, ditumpangkan di atas gambar denah yang admin upload. Editor admin & tampilan booking penumpang konsisten.

## Perubahan visual marker

Ganti bentuk lingkaran 32px dengan **SeatGlyph** SVG bergaya kursi airline:

```text
  ╭──┬──╮      back-rest atas (rounded)
  │  │  │      armrest kiri & kanan
  ╰──┴──╯      seat cushion bawah
     ▼         (opsional) arah hadap
```

- Bahan: SVG inline 1 komponen (`SeatGlyph`) — sandaran (rect rounded-top), bantalan (rect rounded-bottom), 2 armrest tipis di samping.
- Label nomor di tengah bantalan, font bold tabular.
- Ukuran adaptif: default 36×40px, mengecil halus saat zoom > 1.5×.
- Bayangan halus + border 1.5px untuk kesan "embossed" seperti seatmap maskapai.

### State color (semantic tokens, bukan warna hard-coded)

| State | Isi | Border |
|---|---|---|
| Available | `bg-background` | `border-primary/60` |
| Selected | `bg-primary` + `text-primary-foreground` | `border-primary` + ring |
| Booked / occupied | `bg-muted` + diagonal stripe pattern | `border-muted-foreground/30` |
| Driver | `bg-foreground` + ikon setir | — |
| Door | `bg-amber-400` + ikon pintu, bentuk persegi tinggi (bukan kursi) | — |

Driver & door tetap pakai badge bulat/kotak kecil agar beda dari kursi.

## Rotasi kursi (orientasi)

Tambah field opsional `rotation?: 0|90|180|270` pada `SeatMarker`. Default 0 (menghadap depan kendaraan). Toolbar editor: tombol "Putar 90°" pada marker terpilih → memutar glyph via `transform: rotate()`. Berguna agar kursi baris belakang/menghadap samping (Hiace baris ke-2) tampak realistis.

## Editor refinement

- **SeatGlyph reusable** di `src/components/admin/SeatGlyph.tsx`, dipakai oleh editor & `SeatImageMap`.
- **Backdrop gambar diredupkan** saat tool aktif (`img` dengan `opacity-90`) supaya marker lebih kontras.
- **Snap-to-grid opsional**: toggle "Snap" di toolbar (0.02 step pada x/y) untuk merapikan baris.
- **Auto-align row**: tombol pada marker terpilih → samakan Y dengan marker terdekat di baris yang sama (delta < 0.06).
- **Panel terpilih** dapat: ubah label, rotasi (0/90/180/270), hapus.
- **Legend kecil** di bawah stage menampilkan glyph + arti tiap state.

## Booking view (`SeatImageMap`)

- Pakai `SeatGlyph` yang sama agar admin & penumpang lihat tampilan identik.
- Booked seat: glyph abu + diagonal stripe + cursor not-allowed.
- Selected: glyph primary + scale 1.08 + ring.
- Tetap dukungan `aria-pressed`, `aria-label`, keyboard focus ring.

## File yang akan diubah/ditambah

- **baru** `src/components/admin/SeatGlyph.tsx` — SVG seat, props: `state`, `label`, `rotation`, `size`.
- `src/store/admin.ts` — tambah `rotation?` pada `SeatMarker`; helper `setMarkerRotation` (opsional, inline saja).
- `src/components/admin/SeatImageEditor.tsx` — render `SeatGlyph`, tombol rotasi & snap, legend, dim backdrop.
- `src/components/admin/SeatImageMap.tsx` — render `SeatGlyph`, stripe pattern untuk booked.

## Di luar scope

- Tidak mengubah flow upload / kompresi / persist (sudah baik).
- Tidak menambah multi-level deck atau seat class per kursi.
- Tidak mengganti tools driver/door (tetap badge).

## Catatan teknis singkat

- SVG glyph 100% currentColor-friendly agar token tema langsung berlaku.
- Stripe pattern: `bg-[repeating-linear-gradient(45deg,...)]` via Tailwind arbitrary value, warna pakai `hsl(var(--muted-foreground)/0.25)`.
- Rotasi diterapkan ke wrapper `div` marker, posisi (x,y) tidak berubah saat rotate.
