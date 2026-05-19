# Image-Based Seat Editor

Ganti seat editor grid (`SeatLayoutGrid`) dengan editor visual berbasis gambar denah kendaraan yang di-upload admin. Admin menaruh marker kursi (dan elemen lain: pintu, supir, lorong) langsung di atas foto/sketsa kendaraan.

## Alur Admin

1. Di halaman **Vehicles**, saat add/edit kendaraan, admin upload gambar denah (top-down) kendaraan.
2. Gambar tampil sebagai canvas. Admin klik di atas gambar untuk menambah marker kursi pada posisi (x, y) relatif (0–1 terhadap lebar/tinggi gambar — anti rusak saat resize).
3. Setiap marker bisa di-drag untuk reposisi, di-klik untuk edit (label/nomor, tipe: seat / driver / door), atau dihapus.
4. Tombol toolbar: pilih tipe marker aktif (Seat, Driver, Door), Auto-number seats, Clear all, Undo.
5. Simpan → tersimpan di store admin bersama URL gambar.

## Tampilan Booking (read-only)

Komponen baru `SeatImageMap` me-render gambar + marker. Marker kursi diberi state: available / selected / booked, dengan warna sesuai design tokens. Dipakai di flow pemilihan kursi penumpang (menggantikan grid lama untuk kendaraan yang punya gambar).

## Perubahan Data

`VehicleTemplate` ditambah field:
- `imageUrl?: string` — data URL gambar yang di-upload (disimpan via persist zustand).
- `seatMap?: SeatMarker[]` — array marker.

```text
SeatMarker = {
  id: string
  x: number   // 0..1
  y: number   // 0..1
  kind: "seat" | "driver" | "door"
  label?: string  // hanya untuk kind=seat
}
```

Field lama (`layout`, `rows`, `cols`) tetap ada sebagai fallback untuk kendaraan tanpa gambar.

## File yang Dibuat / Diubah

- Baru: `src/components/admin/SeatImageEditor.tsx` — canvas editor (upload, click-to-place, drag, edit, delete).
- Baru: `src/components/admin/SeatImageMap.tsx` — viewer read-only untuk halaman booking.
- Ubah: `src/store/admin.ts` — tambah `imageUrl`, `seatMap`, tipe `SeatMarker`, helper hitung jumlah kursi dari marker.
- Ubah: `src/routes/admin.vehicles.tsx` — form vehicle pakai `SeatImageEditor` (tab antara "Image map" dan "Grid lama" agar tidak break data lama).
- Opsional: di flow penumpang yang menampilkan denah kursi, render `SeatImageMap` kalau `imageUrl` ada, kalau tidak fallback ke `SeatLayoutGrid`.

## Catatan Teknis

- Upload pakai `<input type="file" accept="image/*">` → `FileReader.readAsDataURL` → simpan sebagai data URL. Cukup untuk MVP tanpa backend; ukuran dibatasi (mis. max 1 MB, compress via canvas kalau lebih besar) supaya `localStorage` zustand persist tidak meledak.
- Koordinat marker disimpan sebagai rasio (0–1) terhadap natural size gambar agar tetap akurat saat container di-resize / responsif.
- Drag pakai pointer events native (tanpa dependency tambahan).
- Marker render absolute di dalam wrapper `position: relative` yang mengikuti aspect-ratio gambar.
