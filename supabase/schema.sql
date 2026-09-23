-- Run this whole file in Supabase: Project > SQL Editor > New query > paste > Run

create table products (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric not null,
  category text not null check (category in ('clothes','shoes','gents-accessories','ladies-accessories')),
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table orders (
  id bigint generated always as identity primary key,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_address text not null,
  payment_method text not null check (payment_method in ('momo','airtel','bank')),
  total numeric not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_id bigint references products(id),
  name text not null,
  price numeric not null,
  qty int not null
);

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone can view active products (public storefront)
create policy "Public can view active products"
  on products for select
  using (active = true);

-- Anyone can place an order (buyer doesn't need an account)
create policy "Public can insert orders"
  on orders for insert
  with check (true);

create policy "Public can insert order items"
  on order_items for insert
  with check (true);

-- Seed a few placeholder products so the site isn't empty
insert into products (name, price, category) values
  ('Oversized Blazer', 89, 'clothes'),
  ('Tailored Trousers', 59, 'clothes'),
  ('Ribbed Knit Top', 39, 'clothes'),
  ('Wide-Leg Jeans', 65, 'clothes'),
  ('Trench Coat', 129, 'clothes'),
  ('Chunky Sneakers', 99, 'shoes'),
  ('Leather Loafers', 110, 'shoes'),
  ('Ankle Boots', 120, 'shoes'),
  ('Leather Belt', 29, 'gents-accessories'),
  ('Classic Watch', 149, 'gents-accessories'),
  ('Wool Scarf', 25, 'gents-accessories'),
  ('Statement Earrings', 22, 'ladies-accessories'),
  ('Structured Handbag', 99, 'ladies-accessories'),
  ('Silk Hair Scarf', 18, 'ladies-accessories');
