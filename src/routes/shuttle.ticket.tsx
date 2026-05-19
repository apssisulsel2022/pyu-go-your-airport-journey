import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Calendar, Clock, MapPin, User, Bus, Share2, Navigation, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useBooking } from "@/store/booking";
import { KNO_AIRPORT, formatRupiah } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/shuttle/ticket")({
  head: () => ({ meta: [{ title: "E-Ticket — PYU-GO" }] }),
  component: TicketPage,
});

function TicketPage() {
  const { pickup, schedule, selectedSeats, bookingCode, date, passengerName, passengerPhone, paymentTotal, promoCode, reset } =
    useBooking();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  if (!pickup || !schedule || !bookingCode) return <Navigate to="/bookings" />;
  const totalPaid = paymentTotal ?? selectedSeats.length * schedule.price;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloading(true);
      // Wait a frame so any "capture mode" class swaps apply before snapshot.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `eticket-${bookingCode}.png`;
      a.click();
      toast.success("E-Ticket berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh tiket");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = `E-Ticket PYU-GO\nKode: ${bookingCode}\n${pickup.name} → ${KNO_AIRPORT.code}\n${date ?? ""} • ${schedule.departureTime}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "PYU-GO E-Ticket", text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Detail tiket disalin");
    } catch {
      toast.error("Gagal membagikan");
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient pb-10">
      <PageHeader title="E-Ticket" />

      <motion.div
        ref={ticketRef}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-4 max-w-md overflow-hidden rounded-3xl bg-card shadow-float"
        style={{ marginLeft: "1rem", marginRight: "1rem" }}
      >
        {/* Top stub */}
        <div className="bg-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span className="font-semibold">PYU-GO SHUTTLE</span>
            <span>{schedule.className}</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] opacity-80">Berangkat</div>
              <div className="text-2xl font-extrabold leading-none">{schedule.departureTime}</div>
              <div className="mt-1 text-xs font-semibold">{pickup.name}</div>
            </div>
            <div className="flex flex-col items-center px-2 text-xs opacity-90">
              <Bus className="h-5 w-5" />
              <span className="mt-1">1j 30m</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] opacity-80">Tiba</div>
              <div className="text-2xl font-extrabold leading-none">{schedule.arrivalTime}</div>
              <div className="mt-1 text-xs font-semibold">{KNO_AIRPORT.code}</div>
            </div>
          </div>
        </div>

        {/* Perforation — capture-safe (no gradient) */}
        <div className="relative bg-card">
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-secondary" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-secondary" />
          <div className="mx-5 border-t-2 border-dashed border-border" />
        </div>

        {/* QR + details */}
        <div className="p-5">
          <div className="flex items-center justify-center">
            <div className="rounded-2xl border-2 border-border bg-white p-3">
              <QRCodeSVG value={bookingCode} size={140} />
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-xs text-muted-foreground">Kode Booking</div>
            <div className="text-lg font-extrabold tracking-widest text-primary">
              {bookingCode}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <Info icon={<Calendar className="h-3.5 w-3.5" />} label="Tanggal" value={date || "—"} />
            <Info icon={<Clock className="h-3.5 w-3.5" />} label="Jam" value={schedule.departureTime} />
            <Info
              icon={<Bus className="h-3.5 w-3.5" />}
              label="Kendaraan"
              value={`${schedule.vehicleName} (${schedule.plate})`}
            />
            <Info
              icon={<User className="h-3.5 w-3.5" />}
              label="Kursi"
              value={selectedSeats.join(", ")}
            />
            <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Jemput" value={pickup.name} />
            <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Tujuan" value={KNO_AIRPORT.code} />
            {passengerName && (
              <Info
                icon={<User className="h-3.5 w-3.5" />}
                label="Penumpang"
                value={passengerName}
              />
            )}
            {passengerPhone && (
              <Info
                icon={<User className="h-3.5 w-3.5" />}
                label="Kontak"
                value={passengerPhone}
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-3 text-xs">
            <span className="text-muted-foreground">Total dibayar</span>
            <span className="text-base font-extrabold text-primary">
              {formatRupiah(selectedSeats.length * schedule.price)}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto mt-4 max-w-md space-y-2 px-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-primary shadow-card disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> {downloading ? "Menyiapkan..." : "Download E-Ticket"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 py-3 text-sm font-semibold text-primary-foreground backdrop-blur"
          >
            <Share2 className="h-4 w-4" /> Bagikan
          </button>
          <Link
            to="/shuttle/tracking"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 py-3 text-sm font-semibold text-primary-foreground backdrop-blur"
          >
            <Navigation className="h-4 w-4" /> Lacak Shuttle
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-primary-foreground/80">
        Tunjukkan QR ini ke driver saat boarding.
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
