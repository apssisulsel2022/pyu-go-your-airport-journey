import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { SeatPicker } from "@/components/SeatPicker";
import { useBooking } from "@/store/booking";
import { formatRupiah } from "@/lib/mock-data";

export const Route = createFileRoute("/shuttle/seats")({
  head: () => ({ meta: [{ title: "Pilih Kursi — PYU-GO" }] }),
  component: SeatsPage,
});

function SeatsPage() {
  const { schedule, selectedSeats, toggleSeat, pickup } = useBooking();
  const nav = useNavigate();
  if (!schedule || !pickup) return <Navigate to="/shuttle/pickup" />;

  const total = selectedSeats.length * schedule.price;

  return (
    <div className="min-h-screen bg-secondary/40 pb-32">
      <PageHeader
        title="Pilih Kursi"
        subtitle={`${schedule.vehicleName} • ${schedule.departureTime}`}
      />

      <div className="p-5">
        <SeatPicker
          vehicle={schedule.vehicleType}
          booked={schedule.seatsBooked}
          selected={selectedSeats}
          onToggle={toggleSeat}
          maxSelect={4}
        />

        <div className="mt-6 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Kursi terpilih</div>
          <div className="mt-2 min-h-[28px]">
            {selectedSeats.length === 0 ? (
              <span className="text-sm text-muted-foreground">Belum ada kursi dipilih (maks 4)</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s) => (
                  <span key={s} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Kursi {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur shadow-float"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Total bayar</div>
            <div className="text-lg font-extrabold text-primary">{formatRupiah(total)}</div>
          </div>
          <button
            disabled={selectedSeats.length === 0}
            onClick={() => nav({ to: "/shuttle/payment" })}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-card transition disabled:opacity-40"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </motion.div>
    </div>
  );
}
