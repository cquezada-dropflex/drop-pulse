-- Productos reales, su información base y la primera parte del pipeline de IA (ficha + cliente ideal).
-- Todo el modelo de datos va en inglés (CLAUDE.md › Datos). Lecturas: el dueño con RLS
-- (user_id = auth.uid()). Escrituras: solo service_role desde el servidor, como en
-- 20260923000000_integrations.sql.

-- ---------------------------------------------------------------- Enums
-- Ciclo de vida del contenido (design-system/README.md › Ciclo de vida). La UI lo muestra con
-- StatusBadge en español (generado, revision, aprobado…); lib/data traduce.
create type public.content_status as enum (
  'generated', 'in_review', 'approved', 'rejected', 'publishing', 'published', 'error'
);
create type public.pipeline_run_status  as enum ('queued', 'running', 'succeeded', 'failed');
create type public.reference_image_source as enum ('shopify', 'upload', 'url');

-- ---------------------------------------------------------------- Mercado
-- Lo que Shopify dice de la tienda (se detecta al conectar). El idioma no se lee de Shopify (pide el
-- alcance read_locales): se deriva del país. El mercado que usa la IA es el que el comerciante
-- confirma en merchant_settings.
alter table public.shopify_connections
  add column country_code char(2) check (country_code ~ '^[A-Z]{2}$'),
  add column timezone     text;

create table public.merchant_settings (
  user_id             uuid primary key references auth.users on delete cascade,
  country_code        char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  currency            char(3) not null check (currency ~ '^[A-Z]{3}$'),
  language            text    not null check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  timezone            text,
  market_confirmed_at timestamptz,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------- Productos
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade,
  shopify_product_id   text not null,                      -- id numérico del gid de Shopify
  shopify_gid          text,
  title                text not null,
  handle               text,
  vendor               text,
  product_type         text,
  category             text,                               -- taxonomía de Shopify (fullName)
  tags                 text[] not null default '{}',
  options              jsonb not null default '[]',         -- [{ name, values[] }]
  description          text,                               -- descripción de Shopify en texto plano
  base_info            text not null default '',           -- lo que el comerciante sabe (ProductInfoInput)
  base_info_updated_at timestamptz,
  price                numeric(14, 2) not null default 0,  -- en la moneda de la tienda
  compare_at_price     numeric(14, 2),
  cost                 numeric(14, 2),
  currency             char(3) not null default 'CLP',
  shopify_status       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, shopify_product_id)
);
create index products_user on public.products (user_id, created_at desc);

-- Imágenes de referencia (ReferenceImage): de Shopify, subidas o traídas por enlace.
-- Excluir no borra nada en Shopify: solo le dice a la IA que no la use.
create table public.product_reference_images (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products on delete cascade,
  user_id          uuid not null references auth.users on delete cascade,
  source           public.reference_image_source not null,
  shopify_media_id text,
  url              text,                                   -- Shopify CDN (source = shopify)
  source_url       text,                                   -- enlace original (source = url)
  storage_path     text,                                   -- bucket product-references (upload / url)
  alt              text,
  width            integer,
  height           integer,
  mime_type        text,
  size_bytes       integer,
  position         smallint not null default 0,
  is_cover         boolean not null default false,         -- portada actual en la tienda
  excluded         boolean not null default false,
  created_at       timestamptz not null default now(),
  check (url is not null or storage_path is not null),
  unique (product_id, shopify_media_id)
);
create index product_reference_images_product on public.product_reference_images (product_id, position);

-- ---------------------------------------------------------------- Pipeline de IA
create table public.pipeline_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  product_id    uuid not null references public.products on delete cascade,
  kind          text not null default 'optimize' check (kind in ('optimize')),
  status        public.pipeline_run_status not null default 'queued',
  current_step  text check (current_step in ('product_brief', 'customer_avatar')),
  error_code    text,
  error_message text,                                      -- en español, para mostrar
  input         jsonb not null default '{}',               -- mercado e imágenes usadas
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index pipeline_runs_product on public.pipeline_runs (product_id, created_at desc);
-- Una sola optimización activa por producto.
create unique index pipeline_runs_one_active on public.pipeline_runs (product_id) where status in ('queued', 'running');

-- Ficha de producto (entrada estándar de los agentes creativos), una por corrida.
create table public.product_briefs (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products on delete cascade,
  user_id        uuid not null references auth.users on delete cascade,
  run_id         uuid references public.pipeline_runs on delete set null,
  payload        jsonb not null,
  prompt_version smallint not null,
  model          text not null,
  created_at     timestamptz not null default now()
);
create index product_briefs_product on public.product_briefs (product_id, created_at desc);

-- Cliente ideal: la IA propone (generated) y el comerciante decide (approved / rejected).
create table public.customer_avatars (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products on delete cascade,
  user_id        uuid not null references auth.users on delete cascade,
  run_id         uuid references public.pipeline_runs on delete set null,
  brief_id       uuid references public.product_briefs on delete set null,
  payload        jsonb not null,
  status         public.content_status not null default 'generated',
  prompt_version smallint not null,
  model          text not null,
  edited_at      timestamptz,
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index customer_avatars_product on public.customer_avatars (product_id, created_at desc);

-- Cada llamada al modelo, con su costo (tope de gasto y auditoría).
create table public.ai_generations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  product_id         uuid references public.products on delete set null,
  run_id             uuid references public.pipeline_runs on delete set null,
  step               text not null,
  model              text not null,
  status             text not null check (status in ('succeeded', 'failed')),
  error_code         text,
  input_tokens       integer,
  output_tokens      integer,
  cache_read_tokens  integer,
  cache_write_tokens integer,
  cost_usd           numeric(10, 6),
  latency_ms         integer,
  created_at         timestamptz not null default now()
);
create index ai_generations_user on public.ai_generations (user_id, created_at desc);

-- ---------------------------------------------------------------- RLS
alter table public.merchant_settings        enable row level security;
alter table public.products                 enable row level security;
alter table public.product_reference_images enable row level security;
alter table public.pipeline_runs            enable row level security;
alter table public.product_briefs           enable row level security;
alter table public.customer_avatars         enable row level security;
alter table public.ai_generations           enable row level security;

create policy "dueño lee" on public.merchant_settings        for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.products                 for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.product_reference_images for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.pipeline_runs            for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.product_briefs           for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.customer_avatars         for select using (user_id = (select auth.uid()));
create policy "dueño lee" on public.ai_generations           for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- Storage
-- Imágenes subidas o traídas por enlace: <user_id>/<product_id>/<uuid>.<ext>. Privado; la app
-- firma URLs cortas para mostrarlas y para que el modelo las lea.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-references', 'product-references', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "dueño lee sus referencias" on storage.objects for select
  using (bucket_id = 'product-references' and (storage.foldername(name))[1] = (select auth.uid())::text);
