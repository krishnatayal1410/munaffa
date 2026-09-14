-- Public website demo/contact requests.
-- No anon/authenticated table policies are added: writes go through the server API with the service role.

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 200),
  phone text,
  business_name text not null check (char_length(business_name) between 2 and 150),
  business_type text not null check (business_type in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other')),
  city text not null check (char_length(city) between 2 and 120),
  message text,
  source text not null default 'demo' check (source in ('demo','contact')),
  status text not null default 'new' check (status in ('new','contacted','qualified','pilot','closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_demo_requests_created_at on public.demo_requests(created_at desc);
create index if not exists idx_demo_requests_status on public.demo_requests(status);

alter table public.demo_requests enable row level security;

-- Intentionally no client-facing policies. The service-role API route performs validated inserts.
