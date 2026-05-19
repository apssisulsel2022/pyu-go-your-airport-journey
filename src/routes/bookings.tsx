import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, ChevronRight, Plane } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { formatRupiah } from "@/lib/mock-data";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Tiket Saya — PYU-GO" }] }),
  component: BookingsPage,
});

const mockBookings = [
  { id: "PYU8X42K", from: "Hermes Palace", to: "KNO", date: "20 Mei 2026", time: "14:30", status: "Aktif", price: 150000 },
  { id: "PYU3LM9P", from: "Cambridge", to: "KNO", date: "05 Mei 2026", time: "08:00", status: "Selesai", price: 120000 },
  { id: "PYU7QW2N", from: "TD Pardede", to: "KNO", date: "28 Apr 2026", time: "17:00", status: "Selesai", price: 145000 },
];

function BookingsPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <PageHeader title="Tiket Saya" back={false} />

      <div className="space-y-3 p-4">
        {mockBookings.map((b) => (
          <Link
            key={b.id}
            to={b.status === "Aktif" ? "/shuttle/ticket" : "/"}
            className="block rounded-2xl bg-card p-4 shadow-soft transition hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Ticket className="h-3.5 w-3.5" /> {b.id}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                b.status === "Aktif" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              }`}>
                {b.status}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              <div className="text-sm font-bold">{b.from} → {b.to}</div>
            </div>
            <div className="text-xs text-muted-foreground">{b.date} • {b.time}</div>

            <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-2">
              <span className="text-sm font-extrabold text-primary">{formatRupiah(b.price)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
