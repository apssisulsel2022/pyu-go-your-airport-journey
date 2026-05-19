# Review & Refinement — Modul Shuttle

Ringkasan hasil review menyeluruh terhadap flow shuttle (pickup → service → schedule → seats → passenger → payment → ticket → tracking) dan refinement yang diusulkan. Fokus: konsistensi UX, keandalan state, dan kejelasan informasi. **Tidak menambah fitur baru** — hanya merapikan yang sudah ada.

## Temuan utama

1. **Guard navigasi tidak konsisten.**
   - `passenger`, `payment` redirect ke `/shuttle/pickup` kalau state kosong — bagus.
   - `seats` redirect ke `/shuttle/pickup` walau yang hilang adalah `schedule` (harusnya ke `/shuttle/schedule`).
   - `schedule` redirect ke `/shuttle/service` kalau `tier` kosong — bagus.
   - `pickup/$pointId` validasi via `notFound` ganda (di route config & komponen) — bisa disederhanakan.
   - **Tracking**: redirect ke `/` kalau tidak ada booking — harusnya ke `/bookings` atau `/shuttle/pickup` agar user paham.

2. **Reset booking belum dipanggil di mana pun.**
   Setelah `ticket`, user yang booking lagi akan membawa state lama (kursi terpilih, promo, dsb). Tombol "Pesan lagi" / reset eksplisit perlu ditambahkan di halaman ticket.

3. **BookingStepper indeks aktif salah di sub-route.**
   `pathname.startsWith(s.path)` dengan urutan STEPS = ["/shuttle/pickup", ...]. Untuk URL `/shuttle/pickup/$pointId`, indeks aktif tetap 0 — OK. Tapi `findIndex` hanya menemukan match pertama; karena semua path beda prefix ini aman. Tetap perlu ditambahkan `ticket` & `tracking` sebagai langkah informasi (opsional di luar stepper).

4. **Map preview pickup zoom terlalu jauh** (`zoom={10}`). Untuk dua titik berjarak ±20–40 km biasanya `zoom={11}` lebih pas. Lebih baik gunakan auto-fit (komponen `MapView` punya `points` — pastikan client melakukan `fitBounds`).

5. **Payment**:
   - Promo tidak ditampilkan kembali di summary "Detail Perjalanan" — user kehilangan visibilitas total breakdown saat scroll.
   - Tombol "Pakai" promo tidak punya state loading/disabled saat input kosong.
   - Saldo "PYU Pay" hardcoded `Rp 250.000` tapi tidak diverifikasi terhadap `total` — kalau total > saldo, tetap bisa lanjut. Tambahkan validasi visual sederhana.

6. **Passenger**: tidak ada normalisasi nomor HP (mis. `08xxx` → `+628xxx`). Tetap simpan apa adanya, tapi tampilkan hint format.

7. **Ticket**:
   - `Navigate to="/"` kalau state hilang — user yang sengaja membuka tab tiket akan kehilangan tiket. Idealnya `bookingCode` & ringkasan disimpan di `localStorage` (zustand persist). Untuk refinement minor: arahkan ke `/bookings` bukan `/`.
   - Tidak ada tombol "Pesan lagi" yang reset state.
   - "Total dibayar" tidak memperhitungkan promo & service fee dari halaman payment (selalu `seats * price`). Perlu disimpan ke store agar konsisten.

8. **Tracking**:
   - State chip "LIVE" duplikat dengan `LivePulse` di card ETA — cukup satu.
   - Driver card masih hardcoded `Andi Saputra / AS / 4.9`. Idealnya berasal dari `schedule` / store admin (atau setidaknya konsisten dengan plat).
   - Tombol Phone & MessageCircle tanpa handler — minimal `tel:` link & toast placeholder.
   - "Driver akan menunggu maksimal 5 menit" vs catatan di pickup preview "10 menit" — samakan jadi 10 menit.

9. **Konsistensi kecil**:
   - "Tier" disebut "Service" di UI publik, "tier" di kode — OK.
   - Tombol primer di seluruh flow sudah konsisten (`rounded-full bg-primary`).
   - Beberapa kartu pakai `shadow-soft`, beberapa `shadow-card` — biarkan, sudah by-design.

## Perubahan yang diusulkan

### A. Guard & navigasi
- `shuttle.seats.tsx`: ubah guard menjadi cascade — kalau `!pickup` → `/shuttle/pickup`, kalau `!schedule` → `/shuttle/schedule`.
- `shuttle.tracking.tsx`: ganti `Navigate to="/"` → `Navigate to="/bookings"`.
- `shuttle.ticket.tsx`: ganti `Navigate to="/"` → `Navigate to="/bookings"`.
- `shuttle.pickup.$pointId.tsx`: hapus blok fallback ganda di komponen — andalkan `notFoundComponent` route. Panggil `throw notFound()` saat `!point`.

### B. State pembayaran
- Tambah field `paymentTotal: number | null` & `promoCode: string | null` di `useBooking`.
- `payment.tsx` setelah `pay()` berhasil → simpan `paymentTotal` & `promoCode` sebelum navigate.
- `ticket.tsx`: gunakan `paymentTotal ?? selectedSeats.length * schedule.price` di label "Total dibayar". Tambahkan baris kecil "Promo: {promoCode}" bila ada.

### C. Reset & "Pesan lagi"
- `ticket.tsx`: tambah tombol sekunder "Pesan perjalanan lain" yang memanggil `reset()` & `nav({ to: "/shuttle/pickup" })`.

### D. Pickup preview map
- `shuttle.pickup.$pointId.tsx`: `zoom={11}`. Tidak menyentuh `MapViewClient` — perubahan minor saja.

### E. Payment refinement
- Disable tombol "Pakai" saat `promo.trim() === ""`.
- Saat metode = `ewallet` dan `total > 250000`, tampilkan badge merah kecil "Saldo tidak cukup" di kartu metode (visual saja, tetap bisa lanjut untuk demo — tambah toast).
- Pricing card: tampilkan ringkasan kode promo aktif dengan tombol "Hapus".

### F. Tracking refinement
- Hapus chip "LIVE" duplikat: pertahankan chip status armada di atas peta, hilangkan `<LivePulse />` di card ETA (atau sebaliknya — pilih: pertahankan keduanya bila konteksnya beda; usul: hapus LivePulse, biarkan chip status di atas yang lebih informatif).
- Driver name & inisial dihitung deterministik dari `schedule.plate` (mock: ambil dari array nama berdasarkan hash plate) supaya tidak terasa hardcoded.
- Tombol phone → `<a href="tel:+628110001234">`; tombol chat → `toast.info("Chat driver belum tersedia di demo")`.
- Ubah teks "maksimal 5 menit" → "maksimal 10 menit" agar konsisten dengan pickup preview.

### G. Passenger refinement
- Tambah helper kecil di bawah field HP: "Format: 08xx atau +628xx".
- Setelah submit, simpan nomor ternormalisasi: kalau diawali `0`, ganti dengan `+62`.

## File yang akan diubah

- `src/store/booking.ts` — tambah `paymentTotal`, `promoCode`, setter.
- `src/routes/shuttle.seats.tsx` — guard cascade.
- `src/routes/shuttle.passenger.tsx` — hint & normalisasi nomor.
- `src/routes/shuttle.payment.tsx` — disable promo button, validasi saldo, simpan promo & total.
- `src/routes/shuttle.ticket.tsx` — total final, baris promo, tombol "Pesan lagi", redirect fallback.
- `src/routes/shuttle.tracking.tsx` — hilangkan duplikasi LIVE, driver dinamis, handler tombol, samakan waktu tunggu, redirect fallback.
- `src/routes/shuttle.pickup.$pointId.tsx` — zoom 11, pakai `notFound()`.

## Hal yang **tidak** diubah

- `MapView` / `MapViewClient` / `PickupMiniMap` / `BookingStepper` — tidak ada bug, tidak perlu disentuh.
- Skema mock-data, store admin, halaman service / schedule (sudah rapi).
- Tidak menambah dependency, tidak menyentuh backend.

## Catatan teknis

- Semua perubahan murni frontend & state lokal (zustand). Tidak ada migration, tidak ada server function baru.
- Setelah perubahan, smoke flow: pilih titik → preview rute → service → schedule → seats (4 maks) → passenger → payment (pakai promo PYUWEEKEND) → ticket (lihat total + promo, tombol pesan lagi) → tracking (status chip + ETA, tombol telpon).
