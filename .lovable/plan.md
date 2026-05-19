# Refinement Flow Shuttle

Fokus penyempurnaan UX dan konsistensi visual di seluruh alur pemesanan shuttle (`/shuttle/*`) tanpa mengubah logika bisnis inti.

## Temuan utama

1. **Tidak ada step indicator** — pengguna tidak tahu posisinya di tahap mana (Pickup → Service → Jadwal → Kursi → Penumpang → Bayar → Tiket).
2. **Data penumpang tidak pernah diisi** — store sudah punya `setPassenger`, tapi tidak ada langkah input nama/telp. Ini muncul kosong di e-ticket.
3. **Pickup list**: mini map dirender untuk SETIAP kartu → berat di list panjang dan menarik fokus dari konten. Sebaiknya map hanya untuk kartu yang dipilih / di-expand.
4. **Service tier**: kartu tidak menampilkan jam keberangkatan paling awal & durasi rata-rata, padahal info ini berguna untuk memutuskan.
5. **Schedule page**: pemilihan tanggal hanya dekoratif (jadwal tidak benar-benar difilter per tanggal). Tambahkan label hari & set tanggal langsung ke store ketika berubah; tampilkan empty state per tanggal jika ada.
6. **Layout inconsistency**: beberapa halaman menggunakan sticky footer `max-w-md` (kursi, bayar) sementara konten utama full-width → footer terlihat menggantung di tengah pada layar lebar. Standarkan container `max-w-md mx-auto` untuk seluruh flow mobile-style.
7. **Payment**: tidak menampilkan jumlah penumpang, tanggal, atau ringkasan jemput. Promo tidak ada feedback "berlaku/invalid".
8. **Ticket**: tombol **Bagikan** non-fungsional; tombol Download bisa gagal karena ikon emoji & gradient di latar belakang. Stub atas tiket pakai `bg-hero-gradient` yang bertabrakan saat ter-export ke PNG.
9. **Tracking**: ETA dihitung dari sisa simulasi (`DURATION_SEC * (1 - progress)`), bukan dari `remainingKm / speed`. Akibatnya ETA tidak berubah saat kecepatan berubah. Kecil tapi terasa "tidak hidup".

## Rencana perubahan

### A. Komponen baru

- `src/components/BookingStepper.tsx` — stepper kompak 6 langkah (Jemput, Service, Jadwal, Kursi, Penumpang, Bayar). Otomatis menyorot langkah aktif berdasarkan `useLocation`.
- `src/components/ShuttleShell.tsx` (opsional ringan) — wrapper `max-w-md mx-auto` agar layout konsisten. Atau cukup tambah class di tiap route.

### B. Route changes

- `shuttle.pickup.tsx`
  - Hapus mini-map per kartu, ganti dengan badge jarak & ETA yang lebih besar.
  - Tampilkan mini-map satu kali di bawah list untuk kartu yang ter-highlight (state lokal `selectedId`), lalu CTA "Lanjut".
  - Tambah `BookingStepper` di atas.

- `shuttle.service.tsx`
  - Tambah info "Berangkat mulai pukul {min}", "Durasi ±1j 30m" di tiap kartu.
  - Tambah `BookingStepper`.

- `shuttle.schedule.tsx`
  - Filter jadwal juga oleh tanggal (gunakan field `daysAvailable` jika ada di mock, fallback semua hari). Empty state per tanggal.
  - Set `setDate` saat user mengganti tanggal (sekarang hanya di-set saat klik jadwal).
  - Tambah `BookingStepper`.

- `shuttle.seats.tsx`
  - Bungkus konten utama dengan `max-w-md mx-auto`.
  - Tambah `BookingStepper`.
  - CTA "Lanjut ke Penumpang" (sebelumnya langsung ke Pembayaran).

- `shuttle.passenger.tsx` **(baru)**
  - Form nama & nomor HP per kursi (atau minimal 1 kontak utama untuk semua kursi).
  - Validasi simpel: nama ≥ 3 huruf, telp 10–14 digit.
  - Simpan via `setPassenger`, lanjut ke `/shuttle/payment`.

- `shuttle.payment.tsx`
  - Ringkasan: tanggal, jam, jumlah penumpang, nama kontak.
  - Promo: tampilkan badge "Berhasil"/"Kode tidak valid" setelah submit.
  - Standarkan `max-w-md mx-auto`.
  - Tambah `BookingStepper`.

- `shuttle.ticket.tsx`
  - Tombol Bagikan: gunakan `navigator.share` jika tersedia, fallback copy link/kode.
  - Saat download: bekukan gradient di stub atas dengan warna solid `--primary` agar PNG bersih. Sembunyikan elemen perforation gradient saat capture (gunakan ref + class `capture-clean`).
  - Tampilkan nama penumpang utama.

- `shuttle.tracking.tsx`
  - Hitung `etaSec = remainingKm / max(15, speed) * 3600` (clamp), tampilkan tetap berdampingan dengan progress simulasi.
  - Sisanya tetap; halaman sudah solid.

### C. Routing

Tambah file route baru `src/routes/shuttle.passenger.tsx` (TanStack file-based routing akan auto-generate). Update transisi di `shuttle.seats.tsx` dan `shuttle.payment.tsx` agar urutannya:

```text
pickup → service → schedule → seats → passenger → payment → ticket → tracking
```

### D. Out of scope

- Integrasi backend / Lovable Cloud.
- Real-time GPS atau routing API beneran.
- Perubahan admin panel.

## Catatan teknis singkat

- Stepper murni client-side via `useLocation().pathname`.
- Form penumpang pakai `useState` lokal, tidak butuh react-hook-form.
- Untuk capture tiket bersih: render varian "print-safe" saat `downloading=true` (swap class gradient → solid sebelum `toPng`).
