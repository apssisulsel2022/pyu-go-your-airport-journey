import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Star, Bus, MapPin, Gauge, Route as RouteIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { MapView } from "@/components/MapView";
import { LivePulse } from "@/components/LivePulse";
import { useBooking } from "@/store/booking";
import { KNO_AIRPORT } from "@/lib/mock-data";

export const Route = createFileRoute("/shuttle/tracking")({
  head: () => ({ meta: [{ title: "Lacak Shuttle — PYU-GO" }] }),
  component: TrackingPage,
});

type LatLng = [number, number];

const haversineKm = (a: LatLng, b: LatLng) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPos = (a: LatLng, b: LatLng, t: number): LatLng => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// Phase boundaries (in normalized progress 0..1)
const P_PICKUP = 0.4;
const P_BOARD_END = 0.45;
const PHASES = ["scheduled", "to_pickup", "boarding", "to_airport", "arrived"] as const;
type Phase = (typeof PHASES)[number];

const phaseOf = (p: number): Phase => {
  if (p <= 0) return "scheduled";
  if (p < P_PICKUP) return "to_pickup";
  if (p < P_BOARD_END) return "boarding";
  if (p < 1) return "to_airport";
  return "arrived";
};

const PHASE_TOAST: Record<Phase, string | null> = {
  scheduled: null,
  to_pickup: "Driver dalam perjalanan menuju kamu",
  boarding: "Shuttle tiba di titik jemput. Silakan naik.",
  to_airport: "Boarding selesai, menuju KNO",
  arrived: "Shuttle telah tiba di KNO",
};

const DURATION_SEC = 180; // total simulasi

function TrackingPage() {
  const { pickup, schedule } = useBooking();
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(42);
  const [now, setNow] = useState(Date.now());
  const lastPhase = useRef<Phase>("scheduled");

  // Driver start: ~0.02deg offset from pickup (simulate ~2km away).
  const driverStart = useMemo<LatLng | null>(() => {
    if (!pickup) return null;
    return [pickup.lat - 0.018, pickup.lng - 0.014];
  }, [pickup]);

  // rAF loop for smooth progress
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setProgress((p) => Math.min(1, p + dt / DURATION_SEC));
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Speed jitter every 2.5s
  useEffect(() => {
    const id = setInterval(() => {
      const base = 40 + Math.sin(Date.now() / 6000) * 8;
      setSpeed(Math.round(base + (Math.random() - 0.5) * 8));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // Phase transition toasts
  useEffect(() => {
    const ph = phaseOf(progress);
    if (ph !== lastPhase.current) {
      lastPhase.current = ph;
      const msg = PHASE_TOAST[ph];
      if (msg) toast.success(msg);
    }
  }, [progress]);

  if (!pickup || !schedule || !driverStart) return <Navigate to="/" />;

  const pickupPos: LatLng = [pickup.lat, pickup.lng];
  const airportPos: LatLng = [KNO_AIRPORT.lat, KNO_AIRPORT.lng];

  const phase = phaseOf(progress);

  // Current vehicle position depending on phase
  let currentPos: LatLng;
  if (phase === "scheduled" || phase === "to_pickup") {
    const sub = phase === "scheduled" ? 0 : progress / P_PICKUP;
    currentPos = lerpPos(driverStart, pickupPos, sub);
  } else if (phase === "boarding") {
    currentPos = pickupPos;
  } else if (phase === "to_airport") {
    const sub = (progress - P_BOARD_END) / (1 - P_BOARD_END);
    currentPos = lerpPos(pickupPos, airportPos, sub);
  } else {
    currentPos = airportPos;
  }

  // Distances
  const remainingKm =
    phase === "to_pickup" || phase === "scheduled"
      ? haversineKm(currentPos, pickupPos) + haversineKm(pickupPos, airportPos)
      : phase === "boarding"
        ? haversineKm(pickupPos, airportPos)
        : phase === "to_airport"
          ? haversineKm(currentPos, airportPos)
          : 0;

  const etaSec = Math.max(0, Math.round(DURATION_SEC * (1 - progress)));
  const etaMin = Math.floor(etaSec / 60);
  const etaRemSec = etaSec % 60;
  const arrivalTime = new Date(now + etaSec * 1000);

  const traveledRoute: LatLng[] =
    phase === "scheduled"
      ? [driverStart]
      : phase === "to_pickup"
        ? [driverStart, currentPos]
        : phase === "boarding"
          ? [driverStart, pickupPos]
          : phase === "to_airport"
            ? [driverStart, pickupPos, currentPos]
            : [driverStart, pickupPos, airportPos];

  const fullRoute: LatLng[] = [driverStart, pickupPos, airportPos];

  const phaseHeadline: Record<Phase, string> = {
    scheduled: "Driver dijadwalkan",
    to_pickup: "Driver menuju kamu",
    boarding: "Boarding di titik jemput",
    to_airport: "Dalam perjalanan ke KNO",
    arrived: "Tiba di KNO",
  };

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
          route={fullRoute}
          traveledRoute={traveledRoute}
          showPlane
          planePos={currentPos}
          vehicleEmoji="🚐"
          className="h-72 w-full"
        />

        {/* Live ETA card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 rounded-2xl bg-card p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-primary">{phaseHeadline[phase]}</span>
                <LivePulse />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tabular-nums">{etaMin}</span>
                <span className="text-sm font-semibold text-muted-foreground">m</span>
                <span className="ml-1 text-2xl font-extrabold tabular-nums">{String(etaRemSec).padStart(2, "0")}</span>
                <span className="text-sm font-semibold text-muted-foreground">s</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Tiba {phase === "to_pickup" || phase === "scheduled" ? "di titik jemput" : "di KNO"}
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"
            >
              <Bus className="h-7 w-7" />
            </motion.div>
          </div>

          {/* Live metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric icon={<Gauge className="h-3.5 w-3.5" />} label="Kecepatan" value={`${speed} km/h`} />
            <Metric icon={<RouteIcon className="h-3.5 w-3.5" />} label="Sisa jarak" value={`${remainingKm.toFixed(1)} km`} />
            <Metric
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Estimasi tiba"
              value={arrivalTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ ease: "linear", duration: 0.5 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Mulai</span>
              <span className="tabular-nums">{Math.round(progress * 100)}%</span>
              <span>KNO</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-4 space-y-3">
            <Step label="Driver dijadwalkan" done active={phase === "scheduled"} />
            <Step label="Menuju titik jemput" done={progress >= 0.01} active={phase === "to_pickup"} />
            <Step label={`Tiba di ${pickup.name}`} done={progress >= P_PICKUP} active={phase === "boarding"} />
            <Step label={`Tiba di ${KNO_AIRPORT.code}`} done={progress >= 1} active={phase === "arrived"} />
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

        <div className="mt-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs">
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

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">{icon} {label}</div>
      <div className="mt-0.5 text-sm font-extrabold tabular-nums">{value}</div>
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
