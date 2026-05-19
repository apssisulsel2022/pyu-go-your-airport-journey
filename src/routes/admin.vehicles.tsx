import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdmin, renumberLayout, layoutToCounts, type VehicleTemplate, type SeatCell } from "@/store/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, RotateCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SeatLayoutGrid } from "@/components/admin/SeatLayoutGrid";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/vehicles")({
  component: VehiclesPage,
});

const emptyVehicle = (): VehicleTemplate => ({
  id: "v-" + Date.now(),
  name: "New Vehicle",
  type: "hiace",
  plate: "BK 0000 GO",
  className: "Economy",
  rows: 4,
  cols: 4,
  layout: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ({ kind: "empty" } as SeatCell))),
});

function VehiclesPage() {
  const { vehicles, upsertVehicle, deleteVehicle } = useAdmin();
  const [editing, setEditing] = useState<VehicleTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Kelola kendaraan dan layout kursinya.</p>
        </div>
        <Button onClick={() => setEditing(emptyVehicle())}><Plus className="mr-1 h-4 w-4" /> Add vehicle</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <Card key={v.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{v.name}</CardTitle>
                <div className="text-xs text-muted-foreground">{v.plate}</div>
              </div>
              <Badge variant="outline">{v.className}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-2">
                <SeatLayoutGrid layout={v.layout} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{layoutToCounts(v.layout)} kursi • {v.rows}×{v.cols}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(v)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus kendaraan?</AlertDialogTitle>
                        <AlertDialogDescription>Jadwal yang memakai kendaraan ini bisa rusak.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteVehicle(v.id); toast.success("Kendaraan dihapus"); }}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <VehicleEditor
        value={editing}
        onClose={() => setEditing(null)}
        onSave={(v) => { upsertVehicle(v); toast.success("Kendaraan tersimpan"); setEditing(null); }}
      />
    </div>
  );
}

function VehicleEditor({ value, onClose, onSave }: { value: VehicleTemplate | null; onClose: () => void; onSave: (v: VehicleTemplate) => void }) {
  const [v, setV] = useState<VehicleTemplate | null>(value);
  useEffect(() => setV(value), [value]);

  if (!v) return null;

  const resize = (rows: number, cols: number) => {
    const layout: SeatCell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (v.layout[r]?.[c] ?? { kind: "empty" } as SeatCell)),
    );
    setV({ ...v, rows, cols, layout });
  };

  return (
    <Sheet open={!!value} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit kendaraan & layout kursi</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Nama</Label>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Plat</Label>
            <Input value={v.plate} onChange={(e) => setV({ ...v, plate: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Tipe</Label>
            <Select value={v.type} onValueChange={(x) => setV({ ...v, type: x as VehicleTemplate["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hiace">Hiace</SelectItem>
                <SelectItem value="elf">Elf</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Kelas</Label>
            <Select value={v.className} onValueChange={(x) => setV({ ...v, className: x as VehicleTemplate["className"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Economy">Economy</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Rows</Label>
            <Input type="number" min={1} max={10} value={v.rows} onChange={(e) => resize(+e.target.value || 1, v.cols)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Cols</Label>
            <Input type="number" min={1} max={8} value={v.cols} onChange={(e) => resize(v.rows, +e.target.value || 1)} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Layout editor</div>
            <Button size="sm" variant="outline" onClick={() => setV({ ...v, layout: renumberLayout(v.layout) })}>
              <RotateCw className="mr-1 h-3.5 w-3.5" /> Renumber
            </Button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Klik tiap sel untuk siklus: kursi → lorong → sopir → pintu → kosong.</p>
          <SeatLayoutGrid layout={v.layout} editable onChange={(layout) => setV({ ...v, layout })} />
          <div className="mt-2 text-xs text-muted-foreground">Total kursi: {layoutToCounts(v.layout)}</div>
        </div>

        <SheetFooter className="mt-5">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave({ ...v, layout: renumberLayout(v.layout) })}>Simpan</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
