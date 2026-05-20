
-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'driver', 'customer');
create type public.vehicle_type as enum ('hiace', 'suv', 'minicar');
create type public.vehicle_tier as enum ('Reguler', 'SemiExecutive', 'Executive');
create type public.booking_status as enum ('pending', 'paid', 'boarded', 'completed', 'cancelled');
create type public.ride_status as enum ('requested', 'accepted', 'ongoing', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type public.seat_status as enum ('available', 'held', 'booked');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profile self read" on public.profiles for select using (auth.uid() = id);
create policy "profile self update" on public.profiles for update using (auth.uid() = id);
create policy "profile self insert" on public.profiles for insert with check (auth.uid() = id);

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "roles self read" on public.user_roles for select using (auth.uid() = user_id);
create policy "roles admin all" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

-- profile admin policies (now that has_role exists)
create policy "profiles admin read" on public.profiles for select using (public.has_role(auth.uid(),'admin'));
create policy "profiles admin update" on public.profiles for update using (public.has_role(auth.uid(),'admin'));

-- ============ VEHICLES ============
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  name text not null,
  type public.vehicle_type not null,
  capacity integer not null check (capacity > 0),
  seat_layout jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;
create policy "vehicles read auth" on public.vehicles for select using (auth.role() = 'authenticated');
create policy "vehicles admin write" on public.vehicles for all using (public.has_role(auth.uid(),'admin'));

-- ============ DRIVERS ============
create table public.drivers (
  id uuid primary key references auth.users(id) on delete cascade,
  license_no text,
  rating numeric(2,1) not null default 5.0,
  status text not null default 'offline',
  vehicle_id uuid references public.vehicles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.drivers enable row level security;
create policy "drivers self read" on public.drivers for select using (auth.uid() = id);
create policy "drivers auth read" on public.drivers for select using (auth.role() = 'authenticated');
create policy "drivers self update" on public.drivers for update using (auth.uid() = id);
create policy "drivers admin all" on public.drivers for all using (public.has_role(auth.uid(),'admin'));

-- ============ ROUTES ============
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  origin text not null,
  destination text not null,
  destination_lat numeric(10,6),
  destination_lng numeric(10,6),
  distance_km numeric(5,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.routes enable row level security;
create policy "routes read auth" on public.routes for select using (auth.role() = 'authenticated');
create policy "routes admin write" on public.routes for all using (public.has_role(auth.uid(),'admin'));

-- ============ PICKUP POINTS ============
create table public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.routes(id) on delete cascade,
  name text not null,
  address text,
  city text,
  rayon text,
  lat numeric(10,6) not null,
  lng numeric(10,6) not null,
  distance_km numeric(5,2),
  eta_min integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.pickup_points enable row level security;
create policy "pickup read auth" on public.pickup_points for select using (auth.role() = 'authenticated');
create policy "pickup admin write" on public.pickup_points for all using (public.has_role(auth.uid(),'admin'));

-- ============ SCHEDULES ============
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id),
  pickup_point_id uuid not null references public.pickup_points(id),
  departure_at timestamptz not null,
  arrival_at timestamptz,
  price integer not null check (price >= 0),
  tier public.vehicle_tier not null default 'Reguler',
  seats_total integer not null check (seats_total > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.schedules enable row level security;
create policy "schedules read auth" on public.schedules for select using (auth.role() = 'authenticated');
create policy "schedules admin write" on public.schedules for all using (public.has_role(auth.uid(),'admin'));

-- ============ SEATS ============
create table public.seats (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  seat_no text not null,
  status public.seat_status not null default 'available',
  hold_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (schedule_id, seat_no)
);
alter table public.seats enable row level security;
create policy "seats read auth" on public.seats for select using (auth.role() = 'authenticated');
create policy "seats admin write" on public.seats for all using (public.has_role(auth.uid(),'admin'));

-- trigger: auto-generate seats on schedule insert
create or replace function public.generate_seats_for_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seats (schedule_id, seat_no)
  select new.id, generate_series(1, new.seats_total)::text;
  return new;
end;
$$;

create trigger schedules_generate_seats
after insert on public.schedules
for each row execute function public.generate_seats_for_schedule();

-- ============ BOOKINGS ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id),
  passenger_name text,
  passenger_phone text,
  status public.booking_status not null default 'pending',
  total integer not null check (total >= 0),
  promo_code text,
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "bookings self read" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings self insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings self update" on public.bookings for update using (auth.uid() = user_id);
create policy "bookings admin all" on public.bookings for all using (public.has_role(auth.uid(),'admin'));

-- ============ SEAT BOOKINGS ============
create table public.seat_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  seat_id uuid not null references public.seats(id),
  passenger_name text,
  created_at timestamptz not null default now(),
  unique (seat_id)
);
alter table public.seat_bookings enable row level security;
create policy "seatbk self read" on public.seat_bookings for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
);
create policy "seatbk self insert" on public.seat_bookings for insert with check (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
);
create policy "seatbk admin all" on public.seat_bookings for all using (public.has_role(auth.uid(),'admin'));

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  method text not null default 'mock',
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "payments self read" on public.payments for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
);
create policy "payments self insert" on public.payments for insert with check (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
);
create policy "payments admin all" on public.payments for all using (public.has_role(auth.uid(),'admin'));

-- ============ TRANSACTIONS ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  ref text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "tx self read" on public.transactions for select using (
  exists (
    select 1 from public.payments p
    join public.bookings b on b.id = p.booking_id
    where p.id = payment_id and b.user_id = auth.uid()
  )
);
create policy "tx admin all" on public.transactions for all using (public.has_role(auth.uid(),'admin'));

-- ============ RIDE ORDERS ============
create table public.ride_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  driver_id uuid references auth.users(id) on delete set null,
  pickup jsonb not null,
  dropoff jsonb not null,
  fare integer not null check (fare >= 0),
  status public.ride_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ride_orders enable row level security;
create policy "ride self read" on public.ride_orders for select using (
  auth.uid() = user_id or auth.uid() = driver_id
);
create policy "ride self insert" on public.ride_orders for insert with check (auth.uid() = user_id);
create policy "ride parties update" on public.ride_orders for update using (
  auth.uid() = user_id or auth.uid() = driver_id
);
create policy "ride admin all" on public.ride_orders for all using (public.has_role(auth.uid(),'admin'));

-- ============ DRIVER LOCATIONS ============
create table public.driver_locations (
  driver_id uuid primary key references auth.users(id) on delete cascade,
  lat numeric(10,6) not null,
  lng numeric(10,6) not null,
  heading numeric(5,2),
  updated_at timestamptz not null default now()
);
alter table public.driver_locations enable row level security;
create policy "driver loc read auth" on public.driver_locations for select using (auth.role() = 'authenticated');
create policy "driver loc self upsert" on public.driver_locations for insert with check (auth.uid() = driver_id);
create policy "driver loc self update" on public.driver_locations for update using (auth.uid() = driver_id);

-- ============ NEW USER TRIGGER ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  );
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ REALTIME ============
alter publication supabase_realtime add table public.seats;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.seat_bookings;
alter publication supabase_realtime add table public.ride_orders;
alter publication supabase_realtime add table public.driver_locations;

alter table public.seats replica identity full;
alter table public.bookings replica identity full;
alter table public.ride_orders replica identity full;
alter table public.driver_locations replica identity full;
