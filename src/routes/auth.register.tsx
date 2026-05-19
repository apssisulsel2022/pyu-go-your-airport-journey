import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Daftar — PYU-GO" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="px-6 pt-10 text-primary-foreground">
        <img src={logo} alt="PYU-GO" className="h-10 w-auto brightness-0 invert" width={140} height={36} />
        <h1 className="mt-8 text-3xl font-extrabold">Buat akun baru</h1>
        <p className="mt-1 text-sm opacity-90">Gabung & dapatkan promo perjalanan pertama.</p>
      </div>

      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 rounded-t-3xl bg-card p-6 shadow-float">
        <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/auth/otp" }); }} className="space-y-3">
          <Field icon={<User className="h-4 w-4" />} placeholder="Nama lengkap" />
          <Field icon={<Mail className="h-4 w-4" />} placeholder="Email" type="email" />
          <Field icon={<Phone className="h-4 w-4" />} placeholder="Nomor HP" type="tel" />
          <Field icon={<Lock className="h-4 w-4" />} placeholder="Kata sandi" type="password" />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 accent-primary" />
            Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi PYU-GO.
          </label>
          <button className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-card">
            Daftar
          </button>
        </form>
        <div className="mt-5 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/auth/login" className="font-bold text-primary">Masuk</Link>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <input required {...props} className="w-full bg-transparent text-sm outline-none" />
    </div>
  );
}
