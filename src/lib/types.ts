export type VehicleType = 'car' | 'van' | 'truck' | 'motorcycle' | 'bus';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid';
export type DriverStatus = 'active' | 'inactive' | 'on_leave';
export type ChecklistStatus = 'passed' | 'failed' | 'in_progress';
export type ResponseStatus = 'ok' | 'issue' | 'not_checked';
export type ItemCategory = 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documentation';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type EventType =
  | 'vehicle_created'
  | 'vehicle_updated'
  | 'driver_created'
  | 'driver_updated'
  | 'checklist_completed'
  | 'anomaly_reported'
  | 'anomaly_resolved'
  | 'vehicle_assigned'
  | 'status_change';

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  hire_date: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  brand: string;
  model: string;
  year: number | null;
  type: VehicleType;
  status: VehicleStatus;
  mileage: number;
  fuel_type: FuelType;
  driver_id: string | null;
  created_at: string;
  driver?: Driver | null;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  label: string;
  category: ItemCategory;
  required: boolean;
}

export interface Checklist {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  template_id: string | null;
  status: ChecklistStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  vehicle?: Vehicle;
  driver?: Driver | null;
  template?: ChecklistTemplate | null;
}

export interface ChecklistResponse {
  id: string;
  checklist_id: string;
  item_id: string;
  status: ResponseStatus;
  comment: string | null;
  item?: ChecklistItem;
}

export interface Anomaly {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  checklist_id: string | null;
  title: string;
  description: string | null;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  reported_at: string;
  resolved_at: string | null;
  vehicle?: Vehicle;
  driver?: Driver | null;
}

export interface HistoryEntry {
  id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  event_type: EventType;
  description: string;
  created_at: string;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
}
