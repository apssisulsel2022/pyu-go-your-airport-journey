import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Clock, Navigation } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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

        <div className="space-y-2 pt-1">
          {filtered.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setPickup(p);
                nav({ to: "/shuttle/schedule" });
              }}
              className="flex w-full items-start gap-3 rounded-2xl bg-card p-4 text-left shadow-soft"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                    {p.rayon}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.distanceKm} km</span>
                </div>
                <div className="mt-1 text-sm font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.address}</div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-success">
                    <Clock className="h-3 w-3" /> ETA {p.etaMin} mnt
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Navigation className="h-3 w-3" /> ke KNO
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
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
