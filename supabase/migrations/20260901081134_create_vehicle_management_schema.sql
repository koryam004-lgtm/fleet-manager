/*
# Vehicle Management Application Schema

## Overview
Creates a complete vehicle management system with vehicles, drivers, checklists,
checklist items, anomalies, and activity history. This is a single-tenant app with
no authentication — all data is shared/public.

## New Tables

1. **drivers** — Vehicle drivers
   - id (uuid, PK)
   - first_name (text, not null)
   - last_name (text, not null)
   - license_number (text, unique)
   - phone (text)
   - email (text)
   - status (text: 'active' | 'inactive' | 'on_leave', default 'active')
   - hire_date (date)
   - created_at (timestamptz)

2. **vehicles** — Fleet vehicles
   - id (uuid, PK)
   - registration (text, unique, not null) — license plate
   - brand (text, not null)
   - model (text, not null)
   - year (int)
   - type (text: 'car' | 'van' | 'truck' | 'motorcycle' | 'bus', default 'car')
   - status (text: 'available' | 'in_use' | 'maintenance' | 'out_of_service', default 'available')
   - mileage (int, default 0)
   - fuel_type (text: 'diesel' | 'gasoline' | 'electric' | 'hybrid', default 'diesel')
   - driver_id (uuid, FK to drivers, nullable) — currently assigned driver
   - created_at (timestamptz)

3. **checklist_templates** — Reusable checklist templates
   - id (uuid, PK)
   - name (text, not null)
   - description (text)
   - created_at (timestamptz)

4. **checklist_items** — Items within a checklist template
   - id (uuid, PK)
   - template_id (uuid, FK to checklist_templates, cascade delete)
   - label (text, not null)
   - category (text: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documentation', default 'mechanical')
   - required (boolean, default true)

5. **checklists** — Completed checklist instances (a filled-out checklist for a vehicle)
   - id (uuid, PK)
   - vehicle_id (uuid, FK to vehicles, cascade delete)
   - driver_id (uuid, FK to drivers, nullable)
   - template_id (uuid, FK to checklist_templates, nullable)
   - status (text: 'passed' | 'failed' | 'in_progress', default 'in_progress')
   - notes (text)
   - completed_at (timestamptz, nullable)
   - created_at (timestamptz)

6. **checklist_responses** — Individual item responses within a checklist instance
   - id (uuid, PK)
   - checklist_id (uuid, FK to checklists, cascade delete)
   - item_id (uuid, FK to checklist_items, cascade delete)
   - status (text: 'ok' | 'issue' | 'not_checked', default 'not_checked')
   - comment (text)

7. **anomalies** — Reported issues/anomalies
   - id (uuid, PK)
   - vehicle_id (uuid, FK to vehicles, cascade delete)
   - driver_id (uuid, FK to drivers, nullable)
   - checklist_id (uuid, FK to checklists, nullable)
   - title (text, not null)
   - description (text)
   - severity (text: 'low' | 'medium' | 'high' | 'critical', default 'medium')
   - status (text: 'open' | 'in_progress' | 'resolved' | 'closed', default 'open')
   - reported_at (timestamptz, default now)
   - resolved_at (timestamptz, nullable)

8. **history** — Activity log / event timeline
   - id (uuid, PK)
   - vehicle_id (uuid, FK to vehicles, nullable, cascade delete)
   - driver_id (uuid, FK to drivers, nullable, cascade delete)
   - event_type (text: 'vehicle_created' | 'vehicle_updated' | 'driver_created' | 'driver_updated' | 'checklist_completed' | 'anomaly_reported' | 'anomaly_resolved' | 'vehicle_assigned' | 'status_change')
   - description (text, not null)
   - created_at (timestamptz, default now)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (single-tenant, no auth, shared data).
- USING (true) is acceptable here because the app has no sign-in and all data is intentionally shared.
*/

-- ===== DRIVERS =====
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  license_number text UNIQUE,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  hire_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_drivers" ON drivers;
CREATE POLICY "anon_select_drivers" ON drivers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_drivers" ON drivers;
CREATE POLICY "anon_insert_drivers" ON drivers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_drivers" ON drivers;
CREATE POLICY "anon_update_drivers" ON drivers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_drivers" ON drivers;
CREATE POLICY "anon_delete_drivers" ON drivers FOR DELETE TO anon, authenticated USING (true);

-- ===== VEHICLES =====
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year int,
  type text NOT NULL DEFAULT 'car' CHECK (type IN ('car', 'van', 'truck', 'motorcycle', 'bus')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
  mileage int NOT NULL DEFAULT 0,
  fuel_type text NOT NULL DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline', 'electric', 'hybrid')),
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicles" ON vehicles;
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_vehicles" ON vehicles;
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_vehicles" ON vehicles;
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_vehicles" ON vehicles;
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE TO anon, authenticated USING (true);

-- ===== CHECKLIST TEMPLATES =====
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checklist_templates" ON checklist_templates;
CREATE POLICY "anon_select_checklist_templates" ON checklist_templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklist_templates" ON checklist_templates;
CREATE POLICY "anon_insert_checklist_templates" ON checklist_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklist_templates" ON checklist_templates;
CREATE POLICY "anon_update_checklist_templates" ON checklist_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklist_templates" ON checklist_templates;
CREATE POLICY "anon_delete_checklist_templates" ON checklist_templates FOR DELETE TO anon, authenticated USING (true);

-- ===== CHECKLIST ITEMS =====
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'mechanical' CHECK (category IN ('exterior', 'interior', 'mechanical', 'safety', 'documentation')),
  required boolean NOT NULL DEFAULT true
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checklist_items" ON checklist_items;
CREATE POLICY "anon_select_checklist_items" ON checklist_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklist_items" ON checklist_items;
CREATE POLICY "anon_insert_checklist_items" ON checklist_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklist_items" ON checklist_items;
CREATE POLICY "anon_update_checklist_items" ON checklist_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklist_items" ON checklist_items;
CREATE POLICY "anon_delete_checklist_items" ON checklist_items FOR DELETE TO anon, authenticated USING (true);

-- ===== CHECKLISTS (instances) =====
CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('passed', 'failed', 'in_progress')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checklists" ON checklists;
CREATE POLICY "anon_select_checklists" ON checklists FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklists" ON checklists;
CREATE POLICY "anon_insert_checklists" ON checklists FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklists" ON checklists;
CREATE POLICY "anon_update_checklists" ON checklists FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklists" ON checklists;
CREATE POLICY "anon_delete_checklists" ON checklists FOR DELETE TO anon, authenticated USING (true);

-- ===== CHECKLIST RESPONSES =====
CREATE TABLE IF NOT EXISTS checklist_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_checked' CHECK (status IN ('ok', 'issue', 'not_checked')),
  comment text
);
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checklist_responses" ON checklist_responses;
CREATE POLICY "anon_select_checklist_responses" ON checklist_responses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklist_responses" ON checklist_responses;
CREATE POLICY "anon_insert_checklist_responses" ON checklist_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklist_responses" ON checklist_responses;
CREATE POLICY "anon_update_checklist_responses" ON checklist_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklist_responses" ON checklist_responses;
CREATE POLICY "anon_delete_checklist_responses" ON checklist_responses FOR DELETE TO anon, authenticated USING (true);

-- ===== ANOMALIES =====
CREATE TABLE IF NOT EXISTS anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  checklist_id uuid REFERENCES checklists(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  reported_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_anomalies" ON anomalies;
CREATE POLICY "anon_select_anomalies" ON anomalies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_anomalies" ON anomalies;
CREATE POLICY "anon_insert_anomalies" ON anomalies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_anomalies" ON anomalies;
CREATE POLICY "anon_update_anomalies" ON anomalies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_anomalies" ON anomalies;
CREATE POLICY "anon_delete_anomalies" ON anomalies FOR DELETE TO anon, authenticated USING (true);

-- ===== HISTORY =====
CREATE TABLE IF NOT EXISTS history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('vehicle_created', 'vehicle_updated', 'driver_created', 'driver_updated', 'checklist_completed', 'anomaly_reported', 'anomaly_resolved', 'vehicle_assigned', 'status_change')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_history" ON history;
CREATE POLICY "anon_select_history" ON history FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_history" ON history;
CREATE POLICY "anon_insert_history" ON history FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_history" ON history;
CREATE POLICY "anon_update_history" ON history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_history" ON history;
CREATE POLICY "anon_delete_history" ON history FOR DELETE TO anon, authenticated USING (true);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_checklists_vehicle_id ON checklists(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_vehicle_id ON anomalies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status);
CREATE INDEX IF NOT EXISTS idx_history_vehicle_id ON history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
