import type {
  VehicleType,
  VehicleStatus,
  FuelType,
  DriverStatus,
  ChecklistStatus,
  ResponseStatus,
  ItemCategory,
  AnomalySeverity,
  AnomalyStatus,
} from './types';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Voiture',
  van: 'Fourgon',
  truck: 'Camion',
  motorcycle: 'Moto',
  bus: 'Bus',
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: 'Disponible',
  in_use: 'En service',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_use: 'bg-blue-100 text-blue-700 border-blue-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  out_of_service: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const VEHICLE_STATUS_DOT: Record<VehicleStatus, string> = {
  available: 'bg-emerald-500',
  in_use: 'bg-blue-500',
  maintenance: 'bg-amber-500',
  out_of_service: 'bg-rose-500',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  diesel: 'Diesel',
  gasoline: 'Essence',
  electric: 'Électrique',
  hybrid: 'Hybride',
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  on_leave: 'En congé',
};

export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  on_leave: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  passed: 'Validé',
  failed: 'Échec',
  in_progress: 'En cours',
};

export const CHECKLIST_STATUS_COLORS: Record<ChecklistStatus, string> = {
  passed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  ok: 'Conforme',
  issue: 'Anomalie',
  not_checked: 'Non vérifié',
};

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  exterior: 'Extérieur',
  interior: 'Intérieur',
  mechanical: 'Mécanique',
  safety: 'Sécurité',
  documentation: 'Documents',
};

export const ANOMALY_SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
};

export const ANOMALY_SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  low: 'bg-sky-100 text-sky-700 border-sky-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  open: 'Ouverte',
  in_progress: 'En traitement',
  resolved: 'Résolue',
  closed: 'Fermée',
};

export const ANOMALY_STATUS_COLORS: Record<AnomalyStatus, string> = {
  open: 'bg-rose-100 text-rose-700 border-rose-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} j`;
  return formatDate(date);
}
