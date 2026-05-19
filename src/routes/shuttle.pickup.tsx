import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Clock, Navigation, Ruler } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PickupMiniMap } from "@/components/PickupMiniMap";
import { pickupPoints, KNO_AIRPORT } from "@/lib/mock-data";
import { useBooking } from "@/store/booking";

export const Route = createFileRoute("/shuttle/pickup")({
  head: () => ({ meta: [{ title: "Pilih Titik Jemput — PYU-GO" }] }),
  component: PickupPage,
});

function PickupPage() {
  const [q, setQ] = useState("");
  const [rayon, setRayon] = useState<string>("Semua");
  const nav = useNavigate();
  const setPickup = useBooking((s) => s.setPickup);

  const rayons = ["Semua", "Rayon A", "Rayon B", "Rayon C"];
  const filtered = pickupPoints.filter(
    (p) =>
      (rayon === "Semua" || p.rayon === rayon) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.address.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-secondary/40">
      <PageHeader title="Pilih Titik Jemput" subtitle={`Tujuan: ${KNO_AIRPORT.name}`} />

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari titik jemput..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {rayons.map((r) => (
            <button
              key={r}
              onClick={() => setRayon(r)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                rayon === r ? "bg-primary text-primary-foreground shadow-card" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-1">
          {filtered.map((p, i) => {
            const estimasi = Math.round(p.distanceKm * 2.5 + 30); // ~ menit ke KNO
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="overflow-hidden rounded-2xl bg-card shadow-soft"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr,160px]">
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                        {p.rayon}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.city}</span>
                    </div>
                    <div className="mt-1 flex items-start gap-2">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.address}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <Stat icon={<Ruler className="h-3 w-3" />} label="Jarak" value={`${p.distanceKm} km`} />
                      <Stat icon={<Clock className="h-3 w-3" />} label="ETA jemput" value={`${p.etaMin} mnt`} />
                      <Stat icon={<Navigation className="h-3 w-3" />} label="ke KNO" value={`~${estimasi} mnt`} />
                    </div>

                    <button
                      onClick={() => {
                        setPickup(p);
                        nav({ to: "/shuttle/service" });
                      }}
                      className="mt-3 w-full rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground shadow-card"
                    >
                      Pilih titik ini
                    </button>
                  </div>
                  <div className="sm:p-3">
                    <PickupMiniMap lat={p.lat} lng={p.lng} className="h-32 w-full sm:h-full" />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">
              Tidak ada titik jemput sesuai pencarian
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2">
      <div className="flex items-center gap-1 text-muted-foreground">{icon} {label}</div>
      <div className="mt-0.5 text-xs font-bold">{value}</div>
    </div>
  );
}
