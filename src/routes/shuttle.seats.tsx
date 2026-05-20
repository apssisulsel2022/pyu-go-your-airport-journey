import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BookingStepper } from "@/components/BookingStepper";
import { useBooking } from "@/store/booking";
import { formatRupiah } from "@/lib/mock-data";
import { toast } from "sonner";
import { getScheduleSeats } from "@/lib/shuttle.functions";
import { useSeatAvailability } from "@/hooks/use-seat-availability";

export const Route = createFileRoute("/shuttle/seats")({
  head: () => ({ meta: [{ title: "Pilih Kursi — PYU-GO" }] }),
  component: SeatsPage,
});

const MAX_SELECT = 4;

function SeatsPage() {
  const { schedule, selectedSeats, selectedSeatIds, toggleSeat, pickup } = useBooking();
  const nav = useNavigate();

  const fetchSeats = useServerFn(getScheduleSeats);
  const { data, isLoading } = useQuery({
    queryKey: ["schedule-seats", schedule?.id],
    queryFn: () => fetchSeats({ data: { scheduleId: schedule!.id } }),
    enabled: !!schedule,
  });
  useSeatAvailability(schedule?.id ?? null);

  if (!pickup) return <Navigate to="/shuttle/pickup" />;
  if (!schedule) return <Navigate to="/shuttle/schedule" />;

  const seats = data?.seats ?? [];
  const total = selectedSeats.length * schedule.price;

  const handleToggle = (seatId: string, seatNo: string, status: string) => {
    if (status !== "available" && !selectedSeats.includes(seatNo)) {
      toast.info("Kursi tidak tersedia");
      return;
    }
    if (!selectedSeats.includes(seatNo) && selectedSeats.length >= MAX_SELECT) {
      toast.info(`Maksimal ${MAX_SELECT} kursi per pemesanan.`);
      return;
    }
    toggleSeat(seatNo, seatId);
  };

  const cols = useMemo(() => (schedule.seatsTotal >= 10 ? 4 : 2), [schedule.seatsTotal]);

  return (
    <div className="min-h-screen bg-secondary/40 pb-32">
      <PageHeader title="Pilih Kursi" subtitle={`${schedule.vehicleName} • ${schedule.departureTime}`} />
      <BookingStepper />

      <div className="mx-auto max-w-md p-5">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat kursi...
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-soft">
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-muted px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Driver
              </div>
            </div>
            <div className="mx-auto grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {seats.map((s: any) => {
                const isSelected = selectedSeatIds.includes(s.id);
                const isTaken = s.status !== "available" && !isSelected;
                return (
                  <button key={s.id} onClick={() => handleToggle(s.id, s.seat_no, s.status)}
                    disabled={isTaken}
                    className={`relative aspect-square rounded-2xl border-2 text-xs font-bold transition ${
                      isSelected ? "border-primary bg-primary text-primary-foreground shadow-card" :
                      isTaken ? "border-muted bg-muted text-muted-foreground cursor-not-allowed" :
                      "border-primary/40 bg-background text-foreground hover:border-primary"
                    }`}>
                    {s.seat_no}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              <Legend className="border-primary/40 bg-background text-foreground" label="Tersedia" />
              <Legend className="border-primary bg-primary text-primary-foreground" label="Dipilih" />
              <Legend className="border-muted bg-muted text-muted-foreground" label="Terisi" />
            </div>
          </div>
        )}
      </div>

      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur shadow-float">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{selectedSeats.length} kursi dipilih</span>
          <span className="text-base font-extrabold text-primary">{formatRupiah(total)}</span>
        </div>
        <button onClick={() => nav({ to: "/shuttle/passenger" })} disabled={selectedSeats.length === 0}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-card disabled:opacity-50">
          Lanjut Data Penumpang
        </button>
      </motion.div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-4 w-4 rounded-md border-2 ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
