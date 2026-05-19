import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { BookingStepper } from "@/components/BookingStepper";
import { SeatPicker } from "@/components/SeatPicker";
import { SeatImageMap } from "@/components/admin/SeatImageMap";
import { useBooking } from "@/store/booking";
import { useAdmin } from "@/store/admin";
import { formatRupiah } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/shuttle/seats")({
  head: () => ({ meta: [{ title: "Pilih Kursi — PYU-GO" }] }),
  component: SeatsPage,
});

const MAX_SELECT = 4;

function SeatsPage() {
  const { schedule, selectedSeats, toggleSeat, pickup } = useBooking();
  const vehicles = useAdmin((s) => s.vehicles);
  const nav = useNavigate();
  if (!schedule || !pickup) return <Navigate to="/shuttle/pickup" />;

  const total = selectedSeats.length * schedule.price;

  // Match the admin-defined vehicle to this schedule: prefer exact plate,
  // then type+tier, then type alone.
  const adminVehicle =
    vehicles.find((v) => v.plate === schedule.plate) ??
    vehicles.find((v) => v.type === schedule.vehicleType && v.tier === schedule.className) ??
    vehicles.find((v) => v.type === schedule.vehicleType);

  const useImageMap = !!(adminVehicle?.seatMap && adminVehicle.seatMap.length > 0);

  const handleToggle = (seat: string) => {
    if (!selectedSeats.includes(seat) && selectedSeats.length >= MAX_SELECT) {
      toast.info(`Maksimal ${MAX_SELECT} kursi per pemesanan.`);
      return;
    }
    toggleSeat(seat);
  };

  return (
    <div className="min-h-screen bg-secondary/40 pb-32">
      <PageHeader
        title="Pilih Kursi"
        subtitle={`${schedule.vehicleName} • ${schedule.departureTime}`}
      />
      <BookingStepper />

      <div className="mx-auto max-w-md p-5">
        {useImageMap ? (
          <div className="mx-auto w-full max-w-md">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span className="rounded-full bg-muted px-3 py-1 font-medium">Denah kendaraan</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <SeatImageMap
              imageUrl={adminVehicle!.imageUrl}
              markers={adminVehicle!.seatMap!}
              selected={selectedSeats}
              booked={schedule.seatsBooked}
              onToggle={handleToggle}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              <Legend className="border-primary/60 bg-background text-foreground" label="Tersedia" />
              <Legend className="border-primary bg-primary text-primary-foreground" label="Dipilih" />
              <Legend className="border-muted bg-muted text-muted-foreground" label="Terisi" />
            </div>
          </div>
        ) : (
          <SeatPicker
            vehicle={schedule.vehicleType}
            booked={schedule.seatsBooked}
            selected={selectedSeats}
            onToggle={handleToggle}
            maxSelect={MAX_SELECT}
          />
        )}

        <div className="mt-6 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Kursi terpilih</div>
          <div className="mt-2 min-h-[28px]">
            {selectedSeats.length === 0 ? (
              <span className="text-sm text-muted-foreground">Belum ada kursi dipilih (maks {MAX_SELECT})</span>
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

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`inline-block h-3.5 w-3.5 rounded-full border-2 ${className}`} />
      {label}
    </span>
  );
}
