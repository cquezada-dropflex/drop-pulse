-- Conexiones reales de Shopify y Meta para el onboarding (docs/spec-migracion-conexiones.md §4).
-- Lecturas: el dueño con RLS (user_id = auth.uid()). Escrituras: solo service_role desde el servidor.

create extension if not exists supabase_vault;

create type public.connection_status as enum ('connecting', 'action', 'connected', 'error', 'revoked');
create type public.import_status     as enum ('pending', 'importing', 'complete', 'failed');

-- ---------------------------------------------------------------- onboarding
create table public.onboarding (
  user_id          uuid primary key references auth.users on delete cascade,
  selected         text[]      not null default '{}',     -- ids de catalog_items, en orden
  numbers          jsonb,                                  -- { deliveredOf10, shipping, maxCpa, suggested }
  generation       jsonb,                                  -- { startedAt, items: [{ id, name, image }] } (IA simulada)
  finished_at      timestamptz,
  checklist_hidden boolean     not null default false,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------- Shopify
create table public.shopify_connections (
  user_id            uuid primary key references auth.users on delete cascade,
  shop_domain        text not null unique check (shop_domain ~ '^[a-z0-9][a-z0-9-]*\.myshopify\.com$'),
  shop_gid           text,
  shop_name          text,
  currency           char(3) check (currency ~ '^[A-Z]{3}$'),
  scopes             text[] not null default '{}',         -- las que devolvió Shopify, no las pedidas
  status             public.connection_status not null default 'connecting',
  error_code         text,
  token_expires_at   timestamptz,
  import_status      public.import_status not null default 'pending',
  import_cursor      text,
  imported_count     integer not null default 0,
  total_count        integer,
  import_lease_until timestamptz,
  orders_synced_at   timestamptz,
  connected_at       timestamptz,
  uninstalled_at     timestamptz,
  updated_at         timestamptz not null default now()
);

-- Espejo del catálogo para elegir productos (O4). No es la tabla `products` del ciclo de vida.
create table public.catalog_items (
  user_id         uuid not null references auth.users on delete cascade,
  id              text not null,                           -- id numérico del gid de Shopify
  title           text not null,
  handle          text,
  image_url       text,
  price           numeric(14, 2) not null default 0,       -- en la moneda de la tienda
  compare_at      numeric(14, 2),
  cost            numeric(14, 2),
  media_count     smallint not null default 0,
  has_description boolean not null default false,
  sales_30d       integer not null default 0,
  status          text not null,
  synced_at       timestamptz not null default now(),
  primary key (user_id, id)
);
create index catalog_items_rank on public.catalog_items (user_id, sales_30d desc);

-- ---------------------------------------------------------------- Meta
create table public.meta_connections (
  user_id                uuid primary key references auth.users on delete cascade,
  fb_user_id             text,
  status                 public.connection_status not null default 'connecting',
  error_code             text,
  scopes                 text[] not null default '{}',
  token_expires_at       timestamptz,
  data_access_expires_at timestamptz,
  ad_account_id          text,
  ad_account_name        text,
  ad_account_currency    char(3),
  page_id                text,
  page_name              text,
  pixel_id               text,
  pixel_name             text,
  connected_at           timestamptz,
  updated_at             timestamptz not null default now()
);
create index meta_connections_fb_user on public.meta_connections (fb_user_id);

-- ---------------------------------------------------------------- Webhooks y borrado de datos
create table public.webhook_events (
  id          text primary key,                            -- X-Shopify-Webhook-Id
  provider    text not null,
  topic       text not null,
  shop_domain text,
  received_at timestamptz not null default now()
);

create table public.data_deletion_requests (
  confirmation_code text primary key,
  provider          text not null,
  external_user_id  text not null,
  status            text not null default 'received' check (status in ('received', 'completed')),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

-- ---------------------------------------------------------------- RLS
alter table public.onboarding             enable row level security;
alter table public.shopify_connections    enable row level security;
alter table public.catalog_items          enable row level security;
alter table public.meta_connections       enable row level security;
alter table public.webhook_events         enable row level security;
alter table public.data_deletion_requests enable row level security;

create policy "dueño lee" on public.onboarding          for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.shopify_connections for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.catalog_items       for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.meta_connections    for select using (user_id = (select auth.uid()));
-- webhook_events y data_deletion_requests: sin políticas (solo service_role).

-- ---------------------------------------------------------------- Vault
-- Un secreto por proveedor y comerciante: '<kind>_token_<user_id>'. Solo service_role puede ejecutarlas.
create or replace function public.set_integration_token(p_kind text, p_user_id uuid, p_token text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_id   uuid;
begin
  if p_kind not in ('shopify', 'shopify_refresh', 'meta') then raise exception 'kind inválido: %', p_kind; end if;
  v_name := p_kind || '_token_' || p_user_id::text;
  select id into v_id from vault.secrets where name = v_name;
  if v_id is null then
    perform vault.create_secret(p_token, v_name, 'DropFlex: token de ' || p_kind);
  else
    perform vault.update_secret(v_id, p_token);
  end if;
end $$;

create or replace function public.get_integration_token(p_kind text, p_user_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = p_kind || '_token_' || p_user_id::text;
  return v;
end $$;

create or replace function public.delete_integration_token(p_kind text, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where name = p_kind || '_token_' || p_user_id::text;
end $$;

revoke all on function public.set_integration_token(text, uuid, text)  from public, anon, authenticated;
revoke all on function public.get_integration_token(text, uuid)        from public, anon, authenticated;
revoke all on function public.delete_integration_token(text, uuid)     from public, anon, authenticated;
grant execute on function public.set_integration_token(text, uuid, text) to service_role;
grant execute on function public.get_integration_token(text, uuid)       to service_role;
grant execute on function public.delete_integration_token(text, uuid)    to service_role;

-- Al borrar el usuario, sus secretos se van con él.
create or replace function public.delete_user_tokens() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where name in (
    'shopify_token_' || old.id::text, 'shopify_refresh_token_' || old.id::text, 'meta_token_' || old.id::text
  );
  return old;
end $$;

create trigger on_auth_user_deleted_tokens after delete on auth.users
  for each row execute function public.delete_user_tokens();
