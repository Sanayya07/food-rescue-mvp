/*
# FoodBridge Core Schema

## Overview
Creates the core data model for FoodBridge, a surplus food redistribution platform.
Supports three user roles: food_provider, ngo, volunteer.

## New Tables

### 1. profiles
Extends Supabase auth.users with role and organization details.
- id (uuid, PK, FK to auth.users)
- role (text: 'provider' | 'ngo' | 'volunteer')
- name (text, display name)
- org_name (text, nullable — org name for NGOs/providers)
- phone (text, nullable)
- location_label (text, nullable — human-readable area name)
- location_lat (numeric, nullable)
- location_lng (numeric, nullable)
- created_at (timestamptz)

### 2. food_listings
Surplus food posted by providers.
- id (uuid, PK)
- provider_id (uuid, FK profiles)
- food_name (text)
- quantity (int, portions)
- food_type (text)
- prepared_at (timestamptz)
- available_until (timestamptz)
- pickup_location_label (text)
- pickup_lat (numeric)
- pickup_lng (numeric)
- additional_info (text, nullable)
- status (text: AVAILABLE | REQUESTED | ACCEPTED | PICKUP_ASSIGNED | PICKED_UP | COMPLETED | CANCELLED)
- created_at (timestamptz)

### 3. requests
NGO requests for a listing.
- id (uuid, PK)
- listing_id (uuid, FK food_listings)
- ngo_id (uuid, FK profiles)
- requested_quantity (int)
- status (text: pending | accepted | rejected)
- created_at (timestamptz)

### 4. pickups
Volunteer pickup/delivery tasks, created when a provider accepts a request.
- id (uuid, PK)
- request_id (uuid, FK requests)
- listing_id (uuid, FK food_listings)
- provider_id (uuid, FK profiles)
- ngo_id (uuid, FK profiles)
- volunteer_id (uuid, FK profiles, nullable)
- food_name (text)
- quantity (int)
- pickup_location_label (text)
- pickup_lat (numeric)
- pickup_lng (numeric)
- drop_location_label (text)
- drop_lat (numeric)
- drop_lng (numeric)
- distance_km (numeric)
- required_by (timestamptz)
- status (text: open | assigned | collected | delivered | cancelled)
- created_at (timestamptz)

## Security
- RLS enabled on all tables.
- profiles: users can read all profiles (needed for cross-role discovery), update only their own.
- food_listings: authenticated users can read all; only owner provider can insert/update.
- requests: authenticated users can read all; only the NGO can insert; NGO can update own; provider of the listing can update status.
- pickups: authenticated users can read all; provider of the listing can insert; volunteer can update assigned pickups.

## Notes
1. owner columns default to auth.uid() so inserts that omit the owner still satisfy RLS.
2. Cross-role visibility is needed: NGOs see provider listings, volunteers see pickups, providers see NGO requests. So SELECT policies are open to authenticated.
3. Update policies are scoped to the relevant owner (listing owner, request owner, assigned volunteer).
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('provider','ngo','volunteer')),
  name text NOT NULL,
  org_name text,
  phone text,
  location_label text,
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- FOOD LISTINGS
CREATE TABLE IF NOT EXISTS food_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  food_type text NOT NULL,
  prepared_at timestamptz NOT NULL,
  available_until timestamptz NOT NULL,
  pickup_location_label text NOT NULL,
  pickup_lat numeric NOT NULL,
  pickup_lng numeric NOT NULL,
  additional_info text,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','REQUESTED','ACCEPTED','PICKUP_ASSIGNED','PICKED_UP','COMPLETED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_all" ON food_listings;
CREATE POLICY "listings_select_all" ON food_listings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "listings_insert_own" ON food_listings;
CREATE POLICY "listings_insert_own" ON food_listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "listings_update_own" ON food_listings;
CREATE POLICY "listings_update_own" ON food_listings FOR UPDATE
  TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "listings_delete_own" ON food_listings;
CREATE POLICY "listings_delete_own" ON food_listings FOR DELETE
  TO authenticated USING (auth.uid() = provider_id);

-- REQUESTS
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  requested_quantity int NOT NULL CHECK (requested_quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_all" ON requests;
CREATE POLICY "requests_select_all" ON requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "requests_insert_own" ON requests;
CREATE POLICY "requests_insert_own" ON requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = ngo_id);

DROP POLICY IF EXISTS "requests_update" ON requests;
CREATE POLICY "requests_update" ON requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = ngo_id OR auth.uid() IN (SELECT provider_id FROM food_listings WHERE id = listing_id))
  WITH CHECK (auth.uid() = ngo_id OR auth.uid() IN (SELECT provider_id FROM food_listings WHERE id = listing_id));

DROP POLICY IF EXISTS "requests_delete_own" ON requests;
CREATE POLICY "requests_delete_own" ON requests FOR DELETE
  TO authenticated USING (auth.uid() = ngo_id);

-- PICKUPS
CREATE TABLE IF NOT EXISTS pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  quantity int NOT NULL,
  pickup_location_label text NOT NULL,
  pickup_lat numeric NOT NULL,
  pickup_lng numeric NOT NULL,
  drop_location_label text NOT NULL,
  drop_lat numeric NOT NULL,
  drop_lng numeric NOT NULL,
  distance_km numeric NOT NULL DEFAULT 0,
  required_by timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','collected','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickups_select_all" ON pickups;
CREATE POLICY "pickups_select_all" ON pickups FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "pickups_insert" ON pickups;
CREATE POLICY "pickups_insert" ON pickups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "pickups_update" ON pickups;
CREATE POLICY "pickups_update" ON pickups FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id OR auth.uid() = volunteer_id)
  WITH CHECK (auth.uid() = provider_id OR auth.uid() = volunteer_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_provider ON food_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON food_listings(status);
CREATE INDEX IF NOT EXISTS idx_requests_listing ON requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_requests_ngo ON requests(ngo_id);
CREATE INDEX IF NOT EXISTS idx_pickups_listing ON pickups(listing_id);
CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON pickups(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);
