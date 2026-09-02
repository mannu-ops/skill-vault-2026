-- ==========================================================
-- SUPABASE DATABASE SCHEMA FOR CANVA PRO STORE
-- Copy & Paste this SQL script into Supabase SQL Editor
-- ==========================================================

-- 1. Create 'admin' table
CREATE TABLE IF NOT EXISTS admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT 'Primary Owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Admin credentials (username: admin, password: admin123)
INSERT INTO admin (username, password, name)
VALUES ('admin', 'admin123', 'Primary Owner')
ON CONFLICT (username) DO NOTHING;

-- 2. Create 'plans' table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  badge TEXT,
  invite_link TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Canva Plans
INSERT INTO plans (name, duration, price, original_price, badge, invite_link, features, is_popular)
VALUES 
(
  '1 Year Canva Pro', 
  '365 Days Access', 
  199, 
  499, 
  'BEST SELLER', 
  'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE',
  ARRAY['100M+ Premium Stock Photos & Videos', 'Magic Studio AI Tools Unlocked', 'Remove Background in 1 Click', '100GB Cloud Storage', 'Instant Email Delivery'],
  true
),
(
  'Lifetime Canva Pro', 
  'Lifetime Access', 
  399, 
  999, 
  'VIP VALUE', 
  'https://www.canva.com/brand/join?token=LIFETIME_VIP_INVITE',
  ARRAY['Lifetime Unrestricted Pro Permissions', 'Unlimited Premium Asset Downloads', 'All Future Canva AI Studio Updates', 'Brand Kit & Custom Fonts Support', 'Priority 24/7 Support'],
  false
),
(
  '1 Month Canva Pro', 
  '30 Days Access', 
  99, 
  299, 
  'STARTER', 
  'https://www.canva.com/brand/join?token=STARTER_30D_INVITE',
  ARRAY['100M+ Stock Media Unlocked', 'Magic Studio & AI Writer', '1-Click Background Remover', 'Instant Team Invitation'],
  false
);

-- 3. Create 'activations' table (Customer Orders)
CREATE TABLE IF NOT EXISTS activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'UPI QR',
  invite_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) or enable public read/write policy for API access
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE activations DISABLE ROW LEVEL SECURITY;
