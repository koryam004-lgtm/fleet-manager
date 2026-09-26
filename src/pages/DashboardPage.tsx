import { useEffect, useState } from 'react';
import {
  Car,
  Users,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  Wrench,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import type { Vehicle, Driver, Anomaly, Checklist, HistoryEntry } from '@/lib/types';
import {
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
  VEHICLE_STATUS_DOT,
  ANOMALY_SEVERITY_COLORS,
  ANOMALY_SEVERITY_LABELS,
  ANOMALY_STATUS_COLORS,
  ANOMALY_STATUS_LABELS,
  timeAgo,
} from '@/lib/constants';
import { Card, Badge, Spinner } from '@/components/ui';
import type { PageKey } from '@/components/Layout';

export function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    async function load() {
      const [v, d, a, c, h] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('anomalies').select('*, vehicle:vehicles(*)').order('reported_at', { ascending: false }).limit(5),
        supabase.from('checklists').select('*, vehicle:vehicles(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('history').select('*, vehicle:vehicles(*), driver:drivers(*)').order('created_at', { ascending: false }).limit(8),
      ]);
      setVehicles(v.data ?? []);
      setDrivers(d.data ?? []);
      setAnomalies((a.data as Anomaly[]) ?? []);
      setChecklists((c.data as Checklist[]) ?? []);
      setRecentHistory((h.data as HistoryEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const inUseVehicles = vehicles.filter((v) => v.status === 'in_use').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
  const activeDrivers = drivers.filter((d) => d.status === 'active').length;
  const openAnomalies = anomalies.filter((a) => a.status === 'open' || a.status === 'in_progress');
  const passedChecklists = checklists.filter((c) => c.status === 'passed').length;
  const failedChecklists = checklists.filter((c) => c.status === 'failed').length;

  const outOfServiceVehicles = vehicles.filter((v) => v.status === 'out_of_service').length;

  const statusChartData = [
    { name: 'Disponibles', value: availableVehicles, color: '#10b981' },
    { name: 'En service', value: inUseVehicles, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceVehicles, color: '#f59e0b' },
    { name: 'Hors service', value: outOfServiceVehicles, color: '#f43f5e' },
  ].filter((d) => d.value > 0);

  const fuelCounts = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.fuel_type] = (acc[v.fuel_type] ?? 0) + 1;
    return acc;
  }, {});
  const fuelLabels: Record<string, string> = {
    gasoline: 'Essence',
    diesel: 'Diesel',
    hybrid: 'Hybride',
    electric: 'Électrique',
  };
  const fuelChartData = Object.entries(fuelCounts).map(([key, count]) => ({
    name: fuelLabels[key] ?? key,
    total: count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Car size={20} />}
          label="Véhicules"
          value={vehicles.length}
          sublabel={`${availableVehicles} disponibles`}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<Users size={20} />}
          label="Chauffeurs"
          value={drivers.length}
          sublabel={`${activeDrivers} actifs`}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          label="Anomalies ouvertes"
          value={openAnomalies.length}
          sublabel={openAnomalies.length === 0 ? 'Aucune alerte' : 'À traiter'}
          accent="bg-rose-50 text-rose-600"
        />
        <KpiCard
          icon={<ClipboardCheck size={20} />}
          label="Checklists récentes"
          value={checklists.length}
          sublabel={`${passedChecklists} validées`}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Statistics charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Répartition par statut</h2>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Véhicules par type de carburant</h2>
          {fuelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fuelChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          )}
        </Card>
      </div>

      {/* Fleet status breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">État de la flotte</h2>
            <button
              onClick={() => onNavigate('vehicles')}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusTile label="Disponibles" count={availableVehicles} total={vehicles.length} color="emerald" />
            <StatusTile label="En service" count={inUseVehicles} total={vehicles.length} color="blue" />
            <StatusTile label="Maintenance" count={maintenanceVehicles} total={vehicles.length} color="amber" />
            <StatusTile
              label="Hors service"
              count={vehicles.filter((v) => v.status === 'out_of_service').length}
              total={vehicles.length}
              color="rose"
            />
          </div>

          {/* Recent vehicles list */}
          <div className="mt-5 space-y-2">
            {vehicles.slice(0, 5).map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Car size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-slate-400">{v.registration}</p>
                  </div>
                </div>
                <Badge className={VEHICLE_STATUS_COLORS[v.status]} dot={VEHICLE_STATUS_DOT[v.status]}>
                  {VEHICLE_STATUS_LABELS[v.status]}
                </Badge>
              </div>
            ))}
            {vehicles.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucun véhicule enregistré</p>
            )}
          </div>
        </Card>

        {/* Recent anomalies */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Anomalies récentes</h2>
            <button
              onClick={() => onNavigate('anomalies')}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {anomalies.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{a.title}</p>
                  <Badge className={ANOMALY_SEVERITY_COLORS[a.severity]}>
                    {ANOMALY_SEVERITY_LABELS[a.severity]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {a.vehicle?.registration ?? '—'} · {timeAgo(a.reported_at)}
                </p>
                <div className="mt-2">
                  <Badge className={ANOMALY_STATUS_COLORS[a.status]}>
                    {ANOMALY_STATUS_LABELS[a.status]}
                  </Badge>
                </div>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucune anomalie</p>
            )}
          </div>
        </Card>
      </div>

      {/* Checklists + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Checklists récentes</h2>
            <button
              onClick={() => onNavigate('checklists')}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {checklists.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  {c.status === 'passed' ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : c.status === 'failed' ? (
                    <XCircle size={18} className="text-rose-500" />
                  ) : (
                    <ClipboardCheck size={18} className="text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {c.vehicle?.registration ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {c.status === 'passed' ? 'Validé' : c.status === 'failed' ? 'Échec' : 'En cours'}
                </span>
              </div>
            ))}
            {checklists.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucune checklist</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Activité récente</h2>
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {recentHistory.map((h, i) => (
              <div key={h.id} className="flex items-start gap-3 py-2">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <HistoryIcon type={h.event_type} />
                  </div>
                  {i < recentHistory.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-slate-100" style={{ minHeight: '16px' }} />
                  )}
                </div>
                <div className="pb-1">
                  <p className="text-sm text-slate-700">{h.description}</p>
                  <p className="text-xs text-slate-400">{timeAgo(h.created_at)}</p>
                </div>
              </div>
            ))}
            {recentHistory.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucune activité</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
        <TrendingUp size={16} className="text-slate-300" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
    </Card>
  );
}

function StatusTile({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-700">{count}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HistoryIcon({ type }: { type: string }) {
  const size = 14;
  switch (type) {
    case 'vehicle_created':
    case 'vehicle_updated':
      return <Car size={size} />;
    case 'driver_created':
    case 'driver_updated':
      return <Users size={size} />;
    case 'anomaly_reported':
    case 'anomaly_resolved':
      return <AlertTriangle size={size} />;
    case 'checklist_completed':
      return <ClipboardCheck size={size} />;
    case 'vehicle_assigned':
    case 'status_change':
      return <Wrench size={size} />;
    default:
      return <TrendingUp size={size} />;
  }
}