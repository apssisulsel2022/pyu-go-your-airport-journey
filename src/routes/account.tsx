import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Wallet, Gift, Bell, HelpCircle, Settings, LogOut, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Akun — PYU-GO" }] }),
  component: AccountPage,
});

function AccountPage() {
  const items = [
    { icon: Wallet, label: "PYU Pay", value: "Rp 250.000" },
    { icon: Gift, label: "Voucher & Promo", value: "3 tersedia" },
    { icon: Bell, label: "Notifikasi" },
    { icon: Shield, label: "Keamanan" },
    { icon: HelpCircle, label: "Pusat Bantuan" },
    { icon: Settings, label: "Pengaturan" },
  ];
  return (
    <div className="min-h-screen bg-secondary/30">
      <PageHeader title="Akun Saya" back={false} />

      <div className="p-4">
        <div className="rounded-2xl bg-hero-gradient p-5 text-primary-foreground shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-xl font-bold backdrop-blur">
              R
            </div>
            <div>
              <div className="text-base font-bold">Rendi Pratama</div>
              <div className="text-xs opacity-90">+62 812-3456-7890</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 rounded-xl bg-white/10 p-3 text-center backdrop-blur">
            <Stat label="Trip" value="12" />
            <Stat label="Poin" value="430" />
            <Stat label="Tier" value="Gold" />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-soft">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={i}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm font-medium">{it.label}</span>
                {it.value && <span className="text-xs font-semibold text-muted-foreground">{it.value}</span>}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <Link
          to="/admin"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary"
        >
          <Shield className="h-4 w-4" /> Buka Admin Console
        </Link>

        <Link
          to="/auth/login"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Keluar
        </Link>

        <div className="mt-6 text-center text-xs text-muted-foreground">PYU-GO v1.0.0</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] opacity-90">{label}</div>
    </div>
  );
}
