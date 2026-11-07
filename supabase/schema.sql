-- Tabel profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('penjaga', 'pemilik')) default 'penjaga',
  created_at timestamptz default now()
);

-- Tabel kamar
create table if not exists kamar (
  id serial primary key,
  nomor_kamar text unique not null,
  status text check (status in ('kosong', 'terisi')) default 'kosong'
);

insert into kamar (nomor_kamar)
select lpad(i::text, 2, '0') from generate_series(1, 40) as i
on conflict (nomor_kamar) do nothing;

-- Tabel tamu
create table if not exists tamu (
  id bigserial primary key,
  nama text not null,
  no_hp text not null,
  kamar_id int references kamar(id) on delete set null,
  periode text check (periode in ('harian','mingguan','bulanan')) not null,
  tanggal_masuk date not null,
  tanggal_keluar date,
  harga numeric,
  catatan text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Trigger update status kamar
create or replace function update_kamar_status()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.kamar_id is not null and NEW.tanggal_keluar is null) then
    update kamar set status = 'terisi' where id = NEW.kamar_id;
  elsif (TG_OP = 'UPDATE') then
    if (NEW.kamar_id is not null and NEW.tanggal_keluar is null) then
      update kamar set status = 'terisi' where id = NEW.kamar_id;
    end if;
    if (NEW.tanggal_keluar is not null and NEW.kamar_id is not null) then
      update kamar set status = 'kosong' where id = NEW.kamar_id;
    end if;
  elsif (TG_OP = 'DELETE' and OLD.kamar_id is not null) then
    update kamar set status = 'kosong' where id = OLD.kamar_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_tamu_status on tamu;
create trigger trg_tamu_status
after insert or update or delete on tamu
for each row execute function update_kamar_status();

-- RLS
alter table profiles enable row level security;
alter table kamar enable row level security;
alter table tamu enable row level security;

drop policy if exists "read kamar" on kamar;
create policy "read kamar" on kamar for select using (auth.role() = 'authenticated');

drop policy if exists "read tamu" on tamu;
create policy "read tamu" on tamu for select using (auth.role() = 'authenticated');

drop policy if exists "write tamu" on tamu;
create policy "write tamu" on tamu for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'penjaga')
);

drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles for select using (auth.role() = 'authenticated');

drop policy if exists "update self" on profiles;
create policy "update self" on profiles for update using (auth.uid() = id);

-- Trigger auto profile
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    coalesce(NEW.raw_user_meta_data->>'role', 'penjaga')
  );
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
