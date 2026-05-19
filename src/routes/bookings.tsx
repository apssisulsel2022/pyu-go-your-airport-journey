import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, ChevronRight, Plane, Clock, CheckCircle2, Bus, MapPin, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { formatRupiah, KNO_AIRPORT } from "@/lib/mock-data";
import { useBooking } from "@/store/booking";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Tiket Saya — PYU-GO" }] }),
  component: BookingsPage,
});

type Status = "Menunggu" | "Berangkat" | "Selesai";

interface BookingItem {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: Status;
  price: number;
  seats: string[];
  vehicle: string;
}

const seedBookings: BookingItem[] = [
  { id: "PYU8X42K", from: "Hermes Palace", to: "KNO", date: "20 Mei 2026", time: "14:30", status: "Menunggu", price: 150000, seats: ["A2"], vehicle: "Hiace Premio (BK 1234 AA)" },
  { id: "PYU5VB1Z", from: "Cambridge", to: "KNO", date: "19 Mei 2026", time: "10:00", status: "Berangkat", price: 130000, seats: ["B1", "B2"], vehicle: "Elf Long (BK 7788 CD)" },
  { id: "PYU3LM9P", from: "Cambridge", to: "KNO", date: "05 Mei 2026", time: "08:00", status: "Selesai", price: 120000, seats: ["C3"], vehicle: "Hiace (BK 4422 BB)" },
  { id: "PYU7QW2N", from: "TD Pardede", to: "KNO", date: "28 Apr 2026", time: "17:00", status: "Selesai", price: 145000, seats: ["A1"], vehicle: "Hiace (BK 9090 EE)" },
];

const TABS: { key: "Semua" | Status; label: string }[] = [
  { key: "Semua", label: "Semua" },
  { key: "Menunggu", label: "Menunggu" },
  { key: "Berangkat", label: "Berangkat" },
  { key: "Selesai", label: "Selesai" },
];

function statusStyle(s: Status) {
  switch (s) {
    case "Menunggu":
      return { wrap: "bg-warning/15 text-warning", icon: <Clock className="h-3 w-3" /> };
    case "Berangkat":
      return { wrap: "bg-primary/15 text-primary", icon: <Bus className="h-3 w-3" /> };
    case "Selesai":
      return { wrap: "bg-success/15 text-success", icon: <CheckCircle2 className="h-3 w-3" /> };
  }
}

function BookingsPage() {
  const [tab, setTab] = useState<"Semua" | Status>("Semua");
  const [openId, setOpenId] = useState<string | null>(null);
  const { pickup, schedule, selectedSeats, bookingCode, date } = useBooking();

  const bookings = useMemo<BookingItem[]>(() => {
    if (bookingCode && pickup && schedule) {
      const live: BookingItem = {
        id: bookingCode,
        from: pickup.name,
        to: KNO_AIRPORT.code,
        date: date || "Hari ini",
        time: schedule.departureTime,
        status: "Menunggu",
        price: selectedSeats.length * schedule.price,
        seats: selectedSeats.length ? selectedSeats : ["—"],
        vehicle: `${schedule.vehicleName} (${schedule.plate})`,
      };
      return [live, ...seedBookings.filter((b) => b.id !== bookingCode)];
    }
    return seedBookings;
  }, [bookingCode, pickup, schedule, selectedSeats, date]);

  const filtered = tab === "Semua" ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      <PageHeader title="Tiket Saya" back={false} />

      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-secondary/30 px-4 py-3 backdrop-blur">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 px-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
            Belum ada tiket dengan status ini.
          </div>
        )}

        {filtered.map((b) => {
          const st = statusStyle(b.status);
          const open = openId === b.id;
          return (
            <div key={b.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
              <button
                onClick={() => setOpenId(open ? null : b.id)}
                className="block w-full p-4 text-left transition hover:bg-secondary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Ticket className="h-3.5 w-3.5" /> {b.id}
                  </span>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.wrap}`}>
                    {st.icon} {b.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <div className="text-sm font-bold">{b.from} → {b.to}</div>
                </div>
                <div className="text-xs text-muted-foreground">{b.date} • {b.time}</div>

                <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-2">
                  <span className="text-sm font-extrabold text-primary">{formatRupiah(b.price)}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
                </div>
              </button>

              {open && (
                <div className="border-t border-border bg-secondary/30 p-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-2xl border-2 border-border bg-white p-3">
                      <QRCodeSVG value={b.id} size={140} />
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {b.status === "Selesai" ? "Tiket sudah digunakan" : "Tunjukkan QR ke driver"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <Info icon={<Calendar className="h-3.5 w-3.5" />} label="Tanggal" value={b.date} />
                    <Info icon={<Clock className="h-3.5 w-3.5" />} label="Jam" value={b.time} />
                    <Info icon={<Bus className="h-3.5 w-3.5" />} label="Kendaraan" value={b.vehicle} />
                    <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Kursi" value={b.seats.join(", ")} />
                  </div>

                  {b.status !== "Selesai" && (
                    <Link
                      to="/shuttle/tracking"
                      className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-card"
                    >
                      Lacak Shuttle
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">{icon} {label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
