import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPickupPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("pickup_points")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const listSchedules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pickupPointId: string; date: string }) =>
    z.object({ pickupPointId: z.string().uuid(), date: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const dayStart = new Date(`${data.date}T00:00:00+07:00`).toISOString();
    const dayEnd = new Date(`${data.date}T23:59:59+07:00`).toISOString();
    const { data: rows, error } = await supabase
      .from("schedules")
      .select("*, vehicles(*)")
      .eq("pickup_point_id", data.pickupPointId)
      .eq("active", true)
      .gte("departure_at", dayStart)
      .lte("departure_at", dayEnd)
      .order("departure_at");
    if (error) throw error;
    return rows ?? [];
  });

export const getScheduleSeats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scheduleId: string }) =>
    z.object({ scheduleId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [schedRes, seatsRes] = await Promise.all([
      supabase
        .from("schedules")
        .select("*, vehicles(*), pickup_points(*)")
        .eq("id", data.scheduleId)
        .single(),
      supabase
        .from("seats")
        .select("*")
        .eq("schedule_id", data.scheduleId)
        .order("seat_no"),
    ]);
    if (schedRes.error) throw schedRes.error;
    if (seatsRes.error) throw seatsRes.error;
    return { schedule: schedRes.data, seats: seatsRes.data ?? [] };
  });
