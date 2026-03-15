-- ================================================
-- HopHop Dashboard - Supabase Database Setup
-- ================================================
-- Run this in Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- 1. Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bouncer TEXT NOT NULL CHECK (bouncer IN ('minecraft', 'dinosaur', 'unicorn')),
  date DATE NOT NULL,
  price NUMERIC DEFAULT 100,
  discount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('gorivo', 'marketing', 'amortizacija', 'garaža')),
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create policies - only authenticated users can access data
CREATE POLICY "Authenticated users can read reservations" ON reservations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert reservations" ON reservations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update reservations" ON reservations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete reservations" ON reservations
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read expenses" ON expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert expenses" ON expenses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses" ON expenses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete expenses" ON expenses
  FOR DELETE TO authenticated USING (true);
