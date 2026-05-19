import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  pickupPoints as seedPickup,
  getSchedulesForPickup,
  type PickupPoint,
  type VehicleType,
} from "@/lib/mock-data";

export type SeatCell =
  | { kind: "seat"; label: string }
  | { kind: "aisle" }
  | { kind: "driver" }
  | { kind: "door" }
  | { kind: "empty" };

export interface SeatMarker {
  id: string;
  x: number; // 0..1 relative to image width
  y: number; // 0..1 relative to image height
  kind: "seat" | "driver" | "door";
  label?: string;
}

export interface VehicleTemplate {
  id: string;
  name: string;
  type: VehicleType;
  plate: string;
  className: "Economy" | "Business" | "VIP";
  rows: number;
  cols: number;
  layout: SeatCell[][];
  imageUrl?: string;
  seatMap?: SeatMarker[];
}

export const countSeatsInMap = (markers: SeatMarker[] | undefined) =>
  (markers ?? []).filter((m) => m.kind === "seat").length;

export const renumberSeatMap = (markers: SeatMarker[]): SeatMarker[] => {
  const seats = markers
    .filter((m) => m.kind === "seat")
    .slice()
    .sort((a, b) => (a.y - b.y) * 1000 + (a.x - b.x));
  const idx = new Map<string, number>();
  seats.forEach((m, i) => idx.set(m.id, i + 1));
  return markers.map((m) => (m.kind === "seat" ? { ...m, label: String(idx.get(m.id)) } : m));
};

export interface AdminSchedule {
  id: string;
  pickupId: string;
  vehicleId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  active: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "boarded" | "cancelled" | "refunded";

export interface AdminBooking {
  id: string;
  code: string;
  passengerName: string;
  passengerPhone: string;
  pickupId: string;
  scheduleId: string;
  seats: string[];
  amount: number;
  status: BookingStatus;
  createdAt: string;
  note?: string;
}

const defaultLayouts: Record<VehicleType, string[][]> = {
  hiace: [
    ["D", "_", "_", "_"],
    ["1", "2", "A", "3"],
    ["4", "5", "A", "6"],
    ["7", "8", "A", "9"],
    ["10", "11", "12", "_"],
  ],
  elf: [
    ["D", "_", "_", "_"],
    ["1", "2", "A", "3"],
    ["4", "5", "A", "6"],
    ["7", "8", "A", "9"],
    ["10", "11", "A", "12"],
    ["13", "14", "15", "16"],
  ],
  minibus: [
    ["D", "_", "_", "_", "_"],
    ["1", "2", "A", "3", "4"],
    ["5", "6", "A", "7", "8"],
    ["9", "10", "A", "11", "12"],
    ["13", "14", "A", "15", "16"],
    ["17", "18", "19", "20", "_"],
  ],
};

const stringsToLayout = (rows: string[][]): SeatCell[][] =>
  rows.map((row) =>
    row.map<SeatCell>((c) => {
      if (c === "D") return { kind: "driver" };
      if (c === "A") return { kind: "aisle" };
      if (c === "_" || c === "") return { kind: "empty" };
      return { kind: "seat", label: c };
    }),
  );

export const layoutToCounts = (layout: SeatCell[][]) => {
  let seats = 0;
  layout.forEach((r) => r.forEach((c) => c.kind === "seat" && seats++));
  return seats;
};

export const renumberLayout = (layout: SeatCell[][]): SeatCell[][] => {
  let i = 1;
  return layout.map((row) =>
    row.map((cell) => (cell.kind === "seat" ? { kind: "seat" as const, label: String(i++) } : cell)),
  );
};

const seedVehicles = (): VehicleTemplate[] => [
  {
    id: "v-hiace-1",
    name: "Toyota Hiace Premio",
    type: "hiace",
    plate: "BK 1234 GO",
    className: "Business",
    rows: 5,
    cols: 4,
    layout: stringsToLayout(defaultLayouts.hiace),
  },
  {
    id: "v-elf-1",
    name: "Isuzu Elf Long",
    type: "elf",
    plate: "BK 4567 GO",
    className: "Economy",
    rows: 6,
    cols: 4,
    layout: stringsToLayout(defaultLayouts.elf),
  },
  {
    id: "v-minibus-1",
    name: "Mitsubishi Minibus",
    type: "minibus",
    plate: "BK 2345 GO",
    className: "VIP",
    rows: 6,
    cols: 5,
    layout: stringsToLayout(defaultLayouts.minibus),
  },
];

const seedSchedules = (vehicles: VehicleTemplate[]): AdminSchedule[] => {
  const out: AdminSchedule[] = [];
  const vById = (t: VehicleType) => vehicles.find((v) => v.type === t)!.id;
  seedPickup.forEach((p) => {
    getSchedulesForPickup(p.id).forEach((s) => {
      out.push({
        id: s.id,
        pickupId: p.id,
        vehicleId: vById(s.vehicleType),
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        price: s.price,
        active: true,
      });
    });
  });
  return out;
};

const FIRST_NAMES = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fadli", "Galih", "Hana", "Indra", "Joko", "Kirana", "Lina", "Mira", "Nanda", "Oka"];
const LAST_NAMES = ["Saputra", "Wijaya", "Pratama", "Lestari", "Hidayat", "Nasution", "Tarigan", "Siregar", "Sembiring", "Hutapea"];
const STATUSES: BookingStatus[] = ["pending", "confirmed", "boarded", "cancelled", "confirmed", "confirmed"];

const seedBookings = (schedules: AdminSchedule[]): AdminBooking[] => {
  const out: AdminBooking[] = [];
  for (let i = 0; i < 28; i++) {
    const s = schedules[Math.floor(Math.random() * schedules.length)];
    const seatCount = 1 + Math.floor(Math.random() * 3);
    const seats = Array.from({ length: seatCount }, (_, k) => String(1 + Math.floor(Math.random() * 12) + k));
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const daysAgo = Math.floor(Math.random() * 5);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    out.push({
      id: `bk-${i}`,
      code: "PYU" + (1000 + i),
      passengerName: `${fn} ${ln}`,
      passengerPhone: "+62 812-" + (1000 + i * 7) + "-" + (2000 + i * 3),
      pickupId: s.pickupId,
      scheduleId: s.id,
      seats,
      amount: s.price * seatCount,
      status: STATUSES[i % STATUSES.length],
      createdAt: date.toISOString(),
    });
  }
  return out;
};

interface AdminState {
  pickupPoints: PickupPoint[];
  vehicles: VehicleTemplate[];
  schedules: AdminSchedule[];
  bookings: AdminBooking[];
  // pickup
  upsertPickup: (p: PickupPoint) => void;
  deletePickup: (id: string) => void;
  // vehicle
  upsertVehicle: (v: VehicleTemplate) => void;
  deleteVehicle: (id: string) => void;
  // schedule
  upsertSchedule: (s: AdminSchedule) => void;
  deleteSchedule: (id: string) => void;
  // booking
  setBookingStatus: (id: string, status: BookingStatus, note?: string) => void;
  resetAll: () => void;
}

const buildSeed = () => {
  const vehicles = seedVehicles();
  const schedules = seedSchedules(vehicles);
  const bookings = seedBookings(schedules);
  return { vehicles, schedules, bookings, pickupPoints: seedPickup };
};

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      ...buildSeed(),
      upsertPickup: (p) =>
        set((st) => {
          const ex = st.pickupPoints.findIndex((x) => x.id === p.id);
          const next = [...st.pickupPoints];
          if (ex >= 0) next[ex] = p;
          else next.push(p);
          return { pickupPoints: next };
        }),
      deletePickup: (id) => set((st) => ({ pickupPoints: st.pickupPoints.filter((p) => p.id !== id) })),
      upsertVehicle: (v) =>
        set((st) => {
          const ex = st.vehicles.findIndex((x) => x.id === v.id);
          const next = [...st.vehicles];
          if (ex >= 0) next[ex] = v;
          else next.push(v);
          return { vehicles: next };
        }),
      deleteVehicle: (id) => set((st) => ({ vehicles: st.vehicles.filter((v) => v.id !== id) })),
      upsertSchedule: (s) =>
        set((st) => {
          const ex = st.schedules.findIndex((x) => x.id === s.id);
          const next = [...st.schedules];
          if (ex >= 0) next[ex] = s;
          else next.push(s);
          return { schedules: next };
        }),
      deleteSchedule: (id) => set((st) => ({ schedules: st.schedules.filter((s) => s.id !== id) })),
      setBookingStatus: (id, status, note) =>
        set((st) => ({
          bookings: st.bookings.map((b) => (b.id === id ? { ...b, status, note: note ?? b.note } : b)),
        })),
      resetAll: () => set(buildSeed()),
    }),
    {
      name: "pyu-admin-v1",
    },
  ),
);

export const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
