import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Star, Bus, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MapView } from "@/components/MapView";
import { useBooking } from "@/store/booking";
import { KNO_AIRPORT } from "@/lib/mock-data";

export const Route = createFileRoute("/shuttle/tracking")({
  head: () => ({ meta: [{ title: "Lacak Shuttle — PYU-GO" }] }),
  component: TrackingPage,
});

function TrackingPage() {
  const { pickup, schedule } = useBooking();
  const [progress, setProgress] = useState(0.15);
  const [eta, setEta] = useState(11);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + 0.02, 0.95));
      setEta((e) => Math.max(e - 1, 1));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  if (!pickup || !schedule) return <Navigate to="/" />;

  // interpolate position between pickup and airport
  const lat = pickup.lat + (KNO_AIRPORT.lat - pickup.lat) * progress;
  const lng = pickup.lng + (KNO_AIRPORT.lng - pickup.lng) * progress;

  return (
    <div className="min-h-screen bg-secondary/30 pb-32">
      <PageHeader title="Pelacakan Shuttle" subtitle={schedule.plate} />

      <div className="p-4">
        <MapView
          center={[(pickup.lat + KNO_AIRPORT.lat) / 2, (pickup.lng + KNO_AIRPORT.lng) / 2]}
          zoom={11}
          points={[
            { lat: pickup.lat, lng: pickup.lng, label: pickup.name },
            { lat: KNO_AIRPORT.lat, lng: KNO_AIRPORT.lng, label: KNO_AIRPORT.code },
          ]}
          route={[
            [pickup.lat, pickup.lng],
            [lat, lng],
            [KNO_AIRPORT.lat, KNO_AIRPORT.lng],
          ]}
          showPlane
          planePos={[lat, lng]}
          className="h-72 w-full"
        />

        {/* Countdown */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 rounded-2xl bg-card p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase text-primary">Shuttle dalam perjalanan</div>
              <div className="mt-1 text-2xl font-extrabold">{eta} menit</div>
              <div className="text-xs text-muted-foreground">Perkiraan tiba di titik jemput</div>
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"
            >
              <Bus className="h-7 w-7" />
            </motion.div>
          </div>

          {/* Progress timeline */}
          <div className="mt-4 space-y-3">
            <Step label="Driver dijadwalkan" done />
            <Step label="Menuju titik jemput" done active />
            <Step label={`Tiba di ${pickup.name}`} />
            <Step label={`Tiba di ${KNO_AIRPORT.code}`} />
          </div>
        </motion.div>

        {/* Driver card */}
        <div className="mt-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary font-bold">
              AS
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Andi Saputra</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" /> 4.9 • {schedule.vehicleName}
              </div>
              <div className="text-xs font-semibold text-primary">{schedule.plate}</div>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
              <Phone className="h-4 w-4" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-warning" /> Tunggu di titik jemput
          </div>
          <div className="mt-1 text-muted-foreground">
            Driver akan menunggu maksimal 5 menit. Pastikan kamu sudah berada di lokasi.
          </div>
        </div>

        <Link
          to="/shuttle/ticket"
          className="mt-4 block rounded-full border border-border bg-card py-3 text-center text-sm font-semibold"
        >
          Lihat E-Ticket
        </Link>
      </div>
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-3 w-3 rounded-full border-2 ${
          done ? "bg-primary border-primary" : "bg-card border-border"
        } ${active ? "ring-4 ring-primary/20" : ""}`}
      />
      <span className={`text-sm ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
