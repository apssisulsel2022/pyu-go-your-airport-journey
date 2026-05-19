import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Wallet, Building2, Ticket, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useBooking } from "@/store/booking";
import { formatRupiah, KNO_AIRPORT } from "@/lib/mock-data";

export const Route = createFileRoute("/shuttle/payment")({
  head: () => ({ meta: [{ title: "Pembayaran — PYU-GO" }] }),
  component: PaymentPage,
});

const methods = [
  { id: "ewallet", label: "PYU Pay", subtitle: "Saldo Rp 250.000", icon: Wallet },
  { id: "va", label: "Virtual Account", subtitle: "BCA, Mandiri, BNI", icon: Building2 },
  { id: "cc", label: "Kartu Kredit/Debit", subtitle: "Visa, Mastercard", icon: CreditCard },
];

function PaymentPage() {
  const { pickup, schedule, selectedSeats, setBookingCode } = useBooking();
  const nav = useNavigate();
  const [method, setMethod] = useState("ewallet");
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!pickup || !schedule || selectedSeats.length === 0) return <Navigate to="/shuttle/pickup" />;

  const subtotal = selectedSeats.length * schedule.price;
  const discount = promo.toUpperCase() === "PYUWEEKEND" ? Math.floor(subtotal * 0.25) : 0;
  const fee = 2500;
  const total = subtotal - discount + fee;

  const pay = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    const code = "PYU" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setBookingCode(code);
    nav({ to: "/shuttle/ticket" });
  };

  return (
    <div className="min-h-screen bg-secondary/40 pb-36">
      <PageHeader title="Pembayaran" />

      <div className="space-y-3 p-4">
        {/* Summary */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Detail Booking</div>
          <div className="mt-2 text-sm font-bold">{pickup.name} → {KNO_AIRPORT.code}</div>
          <div className="text-xs text-muted-foreground">{schedule.vehicleName} • {schedule.departureTime} • {schedule.className}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedSeats.map((s) => (
              <span key={s} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
                Kursi {s}
              </span>
            ))}
          </div>
        </section>

        {/* Promo */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Kode Promo</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <Ticket className="h-4 w-4 text-primary" />
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="PYUWEEKEND"
              className="w-full bg-transparent text-sm outline-none"
            />
            {discount > 0 && <span className="text-xs font-bold text-success">-{formatRupiah(discount)}</span>}
          </div>
        </section>

        {/* Payment methods */}
        <section className="rounded-2xl bg-card p-2 shadow-soft">
          <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Metode Pembayaran</div>
          <div className="mt-1 space-y-1">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    active ? "bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.subtitle}</div>
                  </div>
                  <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded-2xl bg-card p-4 shadow-soft text-sm">
          <Row label={`Tarif (${selectedSeats.length} kursi)`} value={formatRupiah(subtotal)} />
          {discount > 0 && <Row label="Diskon promo" value={`-${formatRupiah(discount)}`} positive />}
          <Row label="Biaya layanan" value={formatRupiah(fee)} />
          <div className="my-2 border-t border-dashed border-border" />
          <Row label="Total" value={formatRupiah(total)} bold />
        </section>

        <div className="flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
          <ShieldCheck className="h-4 w-4" /> Pembayaran aman & terenkripsi
        </div>
      </div>

      {/* Sticky pay button */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur shadow-float"
      >
        <button
          onClick={pay}
          disabled={loading}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-60"
        >
          {loading ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
        </button>
      </motion.div>
    </div>
  );
}

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={bold ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-extrabold text-primary text-base" : ""} ${positive ? "text-success font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
