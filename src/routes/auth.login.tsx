import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Masuk — PYU-GO" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="px-6 pt-10 text-primary-foreground">
        <img src={logo} alt="PYU-GO" className="h-10 w-auto brightness-0 invert" width={140} height={36} />
        <h1 className="mt-8 text-3xl font-extrabold leading-tight">Selamat datang kembali</h1>
        <p className="mt-1 text-sm opacity-90">Masuk untuk melanjutkan perjalanan kamu.</p>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-8 min-h-[60vh] rounded-t-3xl bg-card p-6 shadow-float"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/auth/otp" }); }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input type="email" required placeholder="Email atau nomor HP" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} required placeholder="Kata sandi" className="w-full bg-transparent text-sm outline-none" />
            <button type="button" onClick={() => setShow(!show)}>
              {show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 text-muted-foreground">
              <input type="checkbox" className="accent-primary" /> Ingat saya
            </label>
            <button type="button" className="font-semibold text-primary">Lupa sandi?</button>
          </div>

          <button className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-card">
            Masuk
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> atau lanjutkan dengan <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SocialBtn label="Google" />
          <SocialBtn label="Apple" />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/auth/register" className="font-bold text-primary">Daftar</Link>
        </div>
      </motion.div>
    </div>
  );
}

function SocialBtn({ label }: { label: string }) {
  return (
    <button type="button" className="rounded-2xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted">
      {label}
    </button>
  );
}
