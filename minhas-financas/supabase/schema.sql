-- Minhas Finanças — banco de dados (Supabase)
-- Cole este arquivo inteiro em: Supabase > SQL Editor > New query > Run

create table if not exists public.financas (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  rev        bigint      not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.financas enable row level security;

-- Cada pessoa enxerga e altera SOMENTE a própria linha.
create policy "ler os próprios dados"       on public.financas for select using (auth.uid() = user_id);
create policy "criar os próprios dados"     on public.financas for insert with check (auth.uid() = user_id);
create policy "atualizar os próprios dados" on public.financas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apagar os próprios dados"    on public.financas for delete using (auth.uid() = user_id);

create or replace function public.financas_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists financas_touch on public.financas;
create trigger financas_touch before update on public.financas
for each row execute function public.financas_touch();
