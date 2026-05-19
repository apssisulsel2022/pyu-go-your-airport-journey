import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PYU-GO" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("pyu_role") : null;
    if (role !== "admin") {
      // dev-friendly: auto-grant if no role set so the demo is reachable
      if (!role) localStorage.setItem("pyu_role", "admin");
      else {
        nav({ to: "/auth/login" });
        return;
      }
    }
    setReady(true);
  }, [nav]);

  if (!ready) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1 text-sm font-semibold">Admin Console</div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              Demo mode
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("pyu_role");
                nav({ to: "/" });
              }}
            >
              <LogOut className="mr-1 h-4 w-4" /> Exit
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
