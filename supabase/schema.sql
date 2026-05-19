-- ============================================================
-- Pinball Accounting Program — Database Schema
-- Run this in the Supabase SQL Editor (once, top to bottom)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- LOCATIONS
-- Single venue in v1, multi-location support ready for v2
-- ============================================================
create table if not exists locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Seed the default single venue
insert into locations (name) values ('Main Venue')
  on conflict do nothing;

-- ============================================================
-- MACHINES
-- ============================================================
create type machine_status as enum ('Active', 'Out of Service', 'Retired');

create table if not exists machines (
  id             uuid primary key default gen_random_uuid(),
  location_id    uuid not null references locations(id),
  name           text not null,
  purchase_price numeric(10, 2),
  date_acquired  date,
  status         machine_status not null default 'Active',
  is_archived    boolean not null default false,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- MAINTENANCE ITEMS (user-defined per machine)
-- ============================================================
create table if not exists maintenance_items (
  id           uuid primary key default gen_random_uuid(),
  machine_id   uuid not null references machines(id) on delete cascade,
  name         text not null,
  interval_days integer not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- MAINTENANCE LOGS
-- ============================================================
create table if not exists maintenance_logs (
  id                   uuid primary key default gen_random_uuid(),
  machine_id           uuid not null references machines(id),
  maintenance_item_id  uuid not null references maintenance_items(id),
  date_performed       date not null,
  cost                 numeric(10, 2),
  notes                text,
  expense_id           uuid,            -- populated after auto-creating expense
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- EXPENSE CATEGORIES (user-defined, with defaults)
-- ============================================================
create table if not exists expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into expense_categories (name, is_default) values
  ('Utilities',                    true),
  ('Legal Costs',                  true),
  ('Maintenance & Repair',         true),
  ('Consumables',                  true),
  ('Travel & Food',                true),
  ('Office Equipment',             true),
  ('Payments & Capital Expenditures', true)
on conflict (name) do nothing;

-- ============================================================
-- EXPENSES
-- ============================================================
create type expense_source as enum ('manual', 'maintenance_log');

create table if not exists expenses (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references locations(id),
  date                date not null,
  category_id         uuid not null references expense_categories(id),
  amount              numeric(10, 2) not null,
  description         text,
  machine_id          uuid references machines(id),
  file_url            text,
  source              expense_source not null default 'manual',
  maintenance_log_id  uuid references maintenance_logs(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Back-fill the FK from maintenance_logs to expenses
alter table maintenance_logs
  add constraint fk_maintenance_expense
  foreign key (expense_id) references expenses(id)
  deferrable initially deferred;

-- ============================================================
-- REVENUE CATEGORIES (non-machine, user-defined)
-- ============================================================
create table if not exists revenue_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

insert into revenue_categories (name) values
  ('Tournaments'),
  ('Merchandising')
on conflict (name) do nothing;

-- ============================================================
-- MACHINE REVENUE
-- Unique constraint on (machine_id, collection_date) supports
-- future CSV import duplicate detection per spec.
-- ============================================================
create table if not exists machine_revenue (
  id                      uuid primary key default gen_random_uuid(),
  machine_id              uuid not null references machines(id),
  location_id             uuid not null references locations(id),
  collection_date         date not null,
  collection_period_start date not null,
  collection_period_end   date not null,
  coin                    numeric(10, 2) not null default 0,
  bill_drop               numeric(10, 2) not null default 0,
  card                    numeric(10, 2) not null default 0,
  phone_tap               numeric(10, 2) not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (machine_id, collection_date)
);

-- ============================================================
-- NON-MACHINE REVENUE
-- ============================================================
create table if not exists non_machine_revenue (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  date        date not null,
  category_id uuid not null references revenue_categories(id),
  amount      numeric(10, 2) not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- RENT & COMMISSION AGREEMENTS
-- History preserved — no updates, only new rows when terms change
-- ============================================================
create type rent_commission_type as enum ('flat_fee', 'percentage', 'combination');

create table if not exists rent_commission_agreements (
  id                uuid primary key default gen_random_uuid(),
  location_id       uuid not null references locations(id),
  type              rent_commission_type not null,
  flat_fee_amount   numeric(10, 2),
  percentage_rate   numeric(5, 4),   -- e.g. 0.1500 = 15%
  revenue_threshold numeric(10, 2),  -- threshold before % kicks in
  effective_date    date not null,
  end_date          date,            -- null = currently active
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- LOANS (Liabilities)
-- ============================================================
create type compounding_interval as enum ('daily', 'weekly', 'monthly');
create type payment_frequency    as enum ('weekly', 'biweekly', 'monthly');

create table if not exists loans (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  principal_amount     numeric(12, 2) not null,
  interest_rate        numeric(6, 4) not null,   -- annual, e.g. 0.0500 = 5%
  compounding_interval compounding_interval not null,
  loan_term_months     integer not null,
  payment_frequency    payment_frequency not null,
  start_date           date not null,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- FILES (Dropbox / document storage)
-- ============================================================
create table if not exists files (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  storage_path text not null,
  file_type    text,
  size_bytes   bigint,
  machine_id   uuid references machines(id),
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- updated_at TRIGGER (applies to all tables that have it)
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on machines
  for each row execute function set_updated_at();
create trigger set_updated_at before update on maintenance_items
  for each row execute function set_updated_at();
create trigger set_updated_at before update on maintenance_logs
  for each row execute function set_updated_at();
create trigger set_updated_at before update on expenses
  for each row execute function set_updated_at();
create trigger set_updated_at before update on machine_revenue
  for each row execute function set_updated_at();
create trigger set_updated_at before update on non_machine_revenue
  for each row execute function set_updated_at();
create trigger set_updated_at before update on rent_commission_agreements
  for each row execute function set_updated_at();
create trigger set_updated_at before update on loans
  for each row execute function set_updated_at();
create trigger set_updated_at before update on files
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Single-user v1: RLS enabled, permissive policy for anon key
-- ============================================================
alter table locations               enable row level security;
alter table machines                enable row level security;
alter table maintenance_items       enable row level security;
alter table maintenance_logs        enable row level security;
alter table expense_categories      enable row level security;
alter table expenses                enable row level security;
alter table revenue_categories      enable row level security;
alter table machine_revenue         enable row level security;
alter table non_machine_revenue     enable row level security;
alter table rent_commission_agreements enable row level security;
alter table loans                   enable row level security;
alter table files                   enable row level security;

-- Allow all operations for the anon role (single-user local app)
create policy "allow_all" on locations               for all to anon using (true) with check (true);
create policy "allow_all" on machines                for all to anon using (true) with check (true);
create policy "allow_all" on maintenance_items       for all to anon using (true) with check (true);
create policy "allow_all" on maintenance_logs        for all to anon using (true) with check (true);
create policy "allow_all" on expense_categories      for all to anon using (true) with check (true);
create policy "allow_all" on expenses                for all to anon using (true) with check (true);
create policy "allow_all" on revenue_categories      for all to anon using (true) with check (true);
create policy "allow_all" on machine_revenue         for all to anon using (true) with check (true);
create policy "allow_all" on non_machine_revenue     for all to anon using (true) with check (true);
create policy "allow_all" on rent_commission_agreements for all to anon using (true) with check (true);
create policy "allow_all" on loans                   for all to anon using (true) with check (true);
create policy "allow_all" on files                   for all to anon using (true) with check (true);
