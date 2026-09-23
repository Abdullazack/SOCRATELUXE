# Socrateluxe

Next.js storefront connected to Supabase. Products, orders and order_items are real database tables.

## 1. Set up Supabase
1. Open your new SOCRATELUXE Supabase project.
2. Go to **SQL Editor > New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.
   This creates the `products`, `orders`, and `order_items` tables, sets up security rules, and seeds 8 placeholder products.
3. Go to **Project Settings > API** and copy:
   - **Project URL**
   - **anon public key**

## 2. Push this code to GitHub
Open a terminal in this folder and run:

```
git init
git add .
git commit -m "Initial Socrateluxe storefront"
git branch -M main
git remote add origin https://github.com/Abdullazack/SOCRATELUXE.git
git push -u origin main
```

## 3. Deploy on Vercel
1. Go back to your Vercel "New Project" screen (the one you already had open) and import the repo again — it will work now that it has code.
2. Under **Environment Variables**, make sure these are set (you already had them filled in):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Deploy**.

## 4. Test it
- Visit your new Vercel URL — you should see 8 placeholder products.
- Add items to cart, go through Checkout (details → review → payment → confirm).
- Check Supabase **Table Editor > orders** — your test order should appear there.

## Local development (optional)
```
npm install
cp .env.local.example .env.local   # then fill in your real Supabase values
npm run dev
```
