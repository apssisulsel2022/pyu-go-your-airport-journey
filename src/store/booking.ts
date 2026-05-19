import { create } from "zustand";
import type { PickupPoint, Schedule, VehicleTier } from "@/lib/mock-data";

interface BookingState {
  pickup: PickupPoint | null;
  tier: VehicleTier | null;
  date: string | null; // ISO yyyy-MM-dd
  schedule: Schedule | null;
  selectedSeats: string[];
  passengerName: string;
  passengerPhone: string;
  bookingCode: string | null;
  paymentTotal: number | null;
  promoCode: string | null;
  setPickup: (p: PickupPoint) => void;
  setTier: (t: VehicleTier) => void;
  setDate: (d: string) => void;
  setSchedule: (s: Schedule) => void;
  toggleSeat: (s: string) => void;
  setPassenger: (name: string, phone: string) => void;
  setBookingCode: (c: string) => void;
  setPayment: (total: number, promo: string | null) => void;
  reset: () => void;
}

export const useBooking = create<BookingState>((set) => ({
  pickup: null,
  tier: null,
  date: null,
  schedule: null,
  selectedSeats: [],
  passengerName: "",
  passengerPhone: "",
  bookingCode: null,
  paymentTotal: null,
  promoCode: null,
  setPickup: (p) => set({ pickup: p }),
  setTier: (t) => set({ tier: t }),
  setDate: (d) => set({ date: d }),
  setSchedule: (s) => set({ schedule: s, selectedSeats: [] }),
  toggleSeat: (s) =>
    set((st) => ({
      selectedSeats: st.selectedSeats.includes(s)
        ? st.selectedSeats.filter((x) => x !== s)
        : [...st.selectedSeats, s],
    })),
  setPassenger: (name, phone) => set({ passengerName: name, passengerPhone: phone }),
  setBookingCode: (c) => set({ bookingCode: c }),
  setPayment: (total, promo) => set({ paymentTotal: total, promoCode: promo }),
  reset: () =>
    set({
      pickup: null,
      tier: null,
      date: null,
      schedule: null,
      selectedSeats: [],
      bookingCode: null,
      paymentTotal: null,
      promoCode: null,
    }),
}));
