import type { SeatMarker } from "@/store/admin";
import { cn } from "@/lib/utils";
import { Car, DoorOpen } from "lucide-react";

interface Props {
  imageUrl: string;
  markers: SeatMarker[];
  selected?: string[];
  booked?: string[];
  onToggle?: (label: string) => void;
}

export function SeatImageMap({ imageUrl, markers, selected = [], booked = [], onToggle }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-border bg-card">
      <img src={imageUrl} alt="Denah kursi" className="block h-auto w-full" draggable={false} />
      {markers.map((m) => {
        if (m.kind === "driver") {
          return (
            <div
              key={m.id}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background shadow-md"
              style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
            >
              <Car className="h-3.5 w-3.5" />
            </div>
          );
        }
        if (m.kind === "door") {
          return (
            <div
              key={m.id}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-md"
              style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
            >
              <DoorOpen className="h-3.5 w-3.5" />
            </div>
          );
        }
        const label = m.label ?? "?";
        const isBooked = booked.includes(label);
        const isSelected = selected.includes(label);
        return (
          <button
            key={m.id}
            type="button"
            disabled={isBooked || !onToggle}
            aria-pressed={isSelected}
            aria-label={`Kursi ${label}${isBooked ? " (terisi)" : ""}`}
            onClick={() => onToggle?.(label)}
            className={cn(
              "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition",
              isBooked && "cursor-not-allowed bg-muted text-muted-foreground border-muted",
              !isBooked && isSelected && "bg-primary text-primary-foreground border-primary scale-110",
              !isBooked && !isSelected && "bg-background text-foreground border-primary/60 hover:bg-primary/10",
            )}
            style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
