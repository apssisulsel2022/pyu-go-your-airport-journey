
-- ROUTE
insert into public.routes (id, origin, destination, destination_lat, destination_lng, distance_km, active)
values ('11111111-1111-1111-1111-111111111111', 'Medan', 'Kualanamu Intl. Airport (KNO)', 3.6422, 98.8853, 39.0, true)
on conflict (id) do nothing;

-- PICKUP POINTS
insert into public.pickup_points (id, route_id, name, address, city, rayon, lat, lng, distance_km, eta_min, active) values
('21111111-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Hermes Palace Hotel','Jl. Pemuda No.1, Medan','Medan','Rayon A',3.5852,98.6789,2.4,8,true),
('21111111-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Cambridge City Square','Jl. S. Parman, Medan','Medan','Rayon B',3.5723,98.6671,3.1,11,true),
('21111111-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Hotel TD Pardede','Jl. Ir. H. Juanda, Medan','Medan','Rayon C',3.5685,98.6841,4.5,14,true),
('21111111-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Sun Plaza','Jl. Zainul Arifin, Medan','Medan','Rayon A',3.5811,98.6745,2.9,10,true),
('21111111-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Centre Point Mall','Jl. Jawa No.8, Medan','Medan','Rayon B',3.5901,98.6952,3.6,12,true),
('21111111-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Adimulia Hotel','Jl. Diponegoro, Medan','Medan','Rayon C',3.5772,98.6699,4.1,13,true),
('21111111-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Grand Aston City Hall','Jl. Balai Kota, Medan','Medan','Rayon A',3.5876,98.6803,2.7,9,true),
('21111111-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','JW Marriott Medan','Jl. Putri Hijau, Medan','Medan','Rayon B',3.5921,98.6781,3.3,11,true)
on conflict (id) do nothing;

-- VEHICLES
insert into public.vehicles (id, plate, name, type, capacity, active) values
('31111111-0000-0000-0000-000000000001','BK 1234 GO','Toyota Hiace Executive','hiace',12,true),
('31111111-0000-0000-0000-000000000002','BK 4567 GO','Toyota Avanza','minicar',6,true)
on conflict (id) do nothing;

-- SCHEDULES — generated for today and tomorrow, 4 schedules each (2 vehicles x 2 times)
do $$
declare
  d date;
  t time;
  pp uuid;
  v uuid;
  pickups uuid[] := array[
    '21111111-0000-0000-0000-000000000001'::uuid,
    '21111111-0000-0000-0000-000000000002'::uuid,
    '21111111-0000-0000-0000-000000000004'::uuid,
    '21111111-0000-0000-0000-000000000007'::uuid
  ];
  times time[] := array['06:00'::time, '09:00', '13:00', '17:00'];
  i int;
begin
  for offset_d in 0..1 loop
    d := (now() at time zone 'Asia/Jakarta')::date + offset_d;
    for i in 1..4 loop
      pp := pickups[i];
      t := times[i];
      v := case when i % 2 = 1 then '31111111-0000-0000-0000-000000000001'::uuid else '31111111-0000-0000-0000-000000000002'::uuid end;
      insert into public.schedules (route_id, vehicle_id, pickup_point_id, departure_at, arrival_at, price, tier, seats_total, active)
      select '11111111-1111-1111-1111-111111111111', v, pp,
        ((d::text || ' ' || t::text)::timestamptz),
        ((d::text || ' ' || t::text)::timestamptz + interval '90 minutes'),
        case when v = '31111111-0000-0000-0000-000000000001'::uuid then 150000 else 110000 end,
        'Reguler'::vehicle_tier,
        case when v = '31111111-0000-0000-0000-000000000001'::uuid then 12 else 6 end,
        true
      where not exists (
        select 1 from public.schedules s
        where s.pickup_point_id = pp and s.vehicle_id = v
          and s.departure_at = ((d::text || ' ' || t::text)::timestamptz)
      );
    end loop;
  end loop;
end $$;
