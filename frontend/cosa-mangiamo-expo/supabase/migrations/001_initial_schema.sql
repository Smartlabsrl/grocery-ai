create extension if not exists "uuid-ossp";

create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  opening_hours jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  canonical_name_it text not null,
  canonical_name_zh text,
  category text not null,
  image_url text,
  aliases text[] not null default '{}'
);

create table public.store_products (
  store_id uuid references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  availability text not null check (availability in ('available', 'seasonal', 'unknown')) default 'unknown',
  source text not null check (source in ('merchant', 'community', 'editorial')),
  confirmed_at timestamptz,
  primary key (store_id, product_id)
);

create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title_it text not null,
  title_zh text,
  intro_it text,
  duration_minutes integer,
  difficulty text check (difficulty in ('facile', 'media', 'avanzata')),
  cover_url text,
  video_url text,
  author_id uuid references auth.users(id),
  status text not null check (status in ('draft', 'published', 'review')) default 'draft',
  created_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  recipe_id uuid references public.recipes(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity text,
  required boolean not null default true,
  primary key (recipe_id, product_id)
);

create table public.user_videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id),
  video_url text not null,
  caption_it text,
  status text not null check (status in ('uploaded', 'review', 'published', 'rejected')) default 'uploaded',
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.store_products enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.user_videos enable row level security;

create policy "public can view published discovery data" on public.stores for select using (true);
create policy "public can view product catalog" on public.products for select using (true);
create policy "public can view store availability" on public.store_products for select using (true);
create policy "public can view published recipes" on public.recipes for select using (status = 'published');
create policy "public can view published recipe ingredients" on public.recipe_ingredients for select using (true);
create policy "creator can manage own videos" on public.user_videos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
