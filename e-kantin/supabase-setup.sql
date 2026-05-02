-- SUPABASE VERİTABANI KURULUMU İÇİN SQL KOMUTLARI
-- Lütfen bu komutları Supabase Dashboard -> SQL Editor ekranına yapıştırıp RUN (Çalıştır) butonuna basın.

-- 1. Öğrenciler (Students) Tablosu
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT
);

-- 2. Personel (Staff) Tablosu
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  role TEXT
);

-- 3. Ürünler (Products) Tablosu
CREATE TABLE products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  "basePrice" NUMERIC NOT NULL,
  "purchasePrice" NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  threshold INTEGER DEFAULT 10,
  calories TEXT,
  "saleCount" INTEGER DEFAULT 0,
  "expirationDate" DATE,
  "discountedPrice" NUMERIC,
  "isSKTDiscounted" BOOLEAN DEFAULT false,
  "priceTrend" TEXT DEFAULT 'stable'
);

-- 4. Kartlar (Cards) Tablosu
CREATE TABLE cards (
  "cardId" TEXT PRIMARY KEY,
  "studentId" TEXT, -- Student veya Staff ID'si buraya gelecek
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- 5. İşlemler (Transactions) Tablosu
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  "cardId" TEXT,
  amount NUMERIC NOT NULL,
  items JSONB,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bildirimler (Notifications) Tablosu
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  category TEXT,
  message TEXT,
  type TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "isRead" BOOLEAN DEFAULT false
);

-- 7. Duyurular (Announcements) Tablosu
CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Talepler (Wishes) Tablosu
CREATE TABLE wishes (
  id TEXT PRIMARY KEY,
  "studentNo" TEXT,
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GERÇEK ZAMANLI (REALTIME) GÜNCELLEMELERİ AKTİF ETME
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table wishes;

-- ANONİM ERİŞİM İÇİN POLİTİKALAR (RLS - ROW LEVEL SECURITY KAPATILDI - GELİŞTİRME AŞAMASI İÇİN)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
