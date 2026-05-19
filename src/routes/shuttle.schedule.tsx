import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowRight, Users, Bus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSchedulesForPickup, formatRupiah, KNO_AIRPORT } from "@/lib/mock-data";
import { useBooking } from "@/store/booking";

export const Route = createFileRoute("/shuttle/schedule")({
  head: () => ({ meta: [{ title: "Pilih Jadwal — PYU-GO" }] }),
  component: SchedulePage,
});

function SchedulePage() {
  const { pickup, setSchedule, setDate } = useBooking();
  const nav = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (!pickup) return <Navigate to="/shuttle/pickup" />;

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);
  const schedules = getSchedulesForPickup(pickup.id);

  return (
    <div className="min-h-screen bg-secondary/40">
      <PageHeader title="Pilih Jadwal" subtitle={`${pickup.name} → ${KNO_AIRPORT.code}`} />

      {/* Date strip */}
      <div className="no-scrollbar sticky top-[57px] z-20 flex gap-2 overflow-x-auto border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        {days.map((d) => {
          const active = isSameDay(d, selectedDate);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelectedDate(d)}
              className={`flex min-w-[58px] flex-col items-center rounded-xl border px-2.5 py-2 text-xs transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <span className="opacity-80">{format(d, "EEE", { locale: idLocale })}</span>
              <span className="text-base font-bold">{format(d, "d")}</span>
              <span className="opacity-80">{format(d, "MMM", { locale: idLocale })}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 p-4">
        {schedules.map((s, i) => {
          const left = s.seatsTotal - s.seatsBooked.length;
          const tight = left <= 3;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setDate(format(selectedDate, "yyyy-MM-dd"));
                setSchedule(s);
                nav({ to: "/shuttle/seats" });
              }}
              className="block w-full rounded-2xl bg-card p-4 text-left shadow-soft transition hover:shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-extrabold">{s.departureTime}</span>
                  <span className="text-[10px] text-muted-foreground">Berangkat</span>
                </div>
                <div className="flex flex-1 flex-col items-center pt-2">
                  <div className="text-[10px] text-muted-foreground">1j 30m</div>
                  <div className="my-1 flex items-center gap-1 text-primary">
                    <div className="h-1 w-2 rounded-full bg-primary" />
                    <div className="h-px flex-1 bg-primary/40" />
                    <ArrowRight className="h-3 w-3" />
                    <div className="h-px flex-1 bg-primary/40" />
                    <div className="h-1 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">Direct</div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-extrabold">{s.arrivalTime}</span>
                  <span className="text-[10px] text-muted-foreground">Tiba KNO</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
                <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Bus className="h-3 w-3" /> {s.vehicleName}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {s.className}
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-semibold ${tight ? "text-destructive" : "text-success"}`}>
                  <Users className="h-3 w-3" /> {left} kursi tersisa
                </span>
                <span className="ml-auto text-base font-extrabold text-primary">
                  {formatRupiah(s.price)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
