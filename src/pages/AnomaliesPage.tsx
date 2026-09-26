import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  Vehicle,
  Driver,
  Anomaly,
  AnomalySeverity,
  AnomalyStatus,
} from '@/lib/types';
import {
  ANOMALY_SEVERITY_LABELS,
  ANOMALY_SEVERITY_COLORS,
  ANOMALY_STATUS_LABELS,
  ANOMALY_STATUS_COLORS,
  formatDateTime,
} from '@/lib/constants';
import {
  Card,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Spinner,
  EmptyState,
} from '@/components/ui';

export function AnomaliesPage() {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  async function load() {
    setLoading(true);
    const [a, v, d] = await Promise.all([
      supabase
        .from('anomalies')
        .select('*, vehicle:vehicles(*), driver:drivers(*)')
        .order('reported_at', { ascending: false }),
      supabase.from('vehicles').select('*').order('registration'),
      supabase.from('drivers').select('*').order('first_name'),
    ]);
    setAnomalies((a.data as Anomaly[]) ?? []);
    setVehicles(v.data ?? []);
    setDrivers(d.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = anomalies.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  async function updateStatus(anomaly: Anomaly, status: AnomalyStatus) {
    const update: Partial<Anomaly> = { status };
    if (status === 'resolved' || status === 'closed') {
      update.resolved_at = new Date().toISOString();
    }
    await supabase.from('anomalies').update(update).eq('id', anomaly.id);

    if (status === 'resolved') {
      await supabase.from('history').insert({
        vehicle_id: anomaly.vehicle_id,
        event_type: 'anomaly_resolved',
        description: `Anomalie résolue: ${anomaly.title} sur ${anomaly.vehicle?.registration ?? ''}`,
      });
    }

    load();
  }

  async function handleSave(data: {
    vehicle_id: string;
    driver_id: string;
    title: string;
    description: string;
    severity: AnomalySeverity;
  }) {
    const { data: newAnomaly } = await supabase
      .from('anomalies')
      .insert({
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id || null,
        title: data.title,
        description: data.description || null,
        severity: data.severity,
        status: 'open',
      })
      .select()
      .single();

    if (newAnomaly) {
      const vehicle = vehicles.find((v) => v.id === data.vehicle_id);
      await supabase.from('history').insert({
        vehicle_id: data.vehicle_id,
        event_type: 'anomaly_reported',
        description: `Anomalie signalée: ${data.title} sur ${vehicle?.registration ?? ''}`,
      });
    }

    setShowForm(false);
    load();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouverte</option>
            <option value="in_progress">En traitement</option>
            <option value="resolved">Résolue</option>
            <option value="closed">Fermée</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">Toutes les sévérités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Élevée</option>
            <option value="critical">Critique</option>
          </select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} /> Signaler
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={28} />}
            title="Aucune anomalie"
            description="Aucune anomalie ne correspond à vos filtres."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={18} /> Signaler une anomalie
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      a.severity === 'critical'
                        ? 'bg-rose-100 text-rose-600'
                        : a.severity === 'high'
                          ? 'bg-orange-100 text-orange-600'
                          : a.severity === 'medium'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-sky-100 text-sky-600'
                    }`}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{a.title}</p>
                    {a.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {a.vehicle?.registration ?? '—'} · {formatDateTime(a.reported_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className={ANOMALY_SEVERITY_COLORS[a.severity]}>
                    {ANOMALY_SEVERITY_LABELS[a.severity]}
                  </Badge>
                  <Badge className={ANOMALY_STATUS_COLORS[a.status]}>
                    {ANOMALY_STATUS_LABELS[a.status]}
                  </Badge>
                </div>
              </div>

              {/* Status actions */}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">Changer le statut:</span>
                {(['open', 'in_progress', 'resolved', 'closed'] as AnomalyStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(a, s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      a.status === s
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {ANOMALY_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <AnomalyForm
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AnomalyForm({
  vehicles,
  drivers,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onSave: (data: {
    vehicle_id: string;
    driver_id: string;
    title: string;
    description: string;
    severity: AnomalySeverity;
  }) => void;
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<AnomalySeverity>('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ vehicle_id: vehicleId, driver_id: driverId, title, description, severity });
  }

  return (
    <Modal open onClose={onClose} title="Signaler une anomalie">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Véhicule"
          value={vehicleId}
          onChange={setVehicleId}
          required
          placeholder="Sélectionner..."
          options={vehicles.map((v) => ({
            value: v.id,
            label: `${v.registration} — ${v.brand} ${v.model}`,
          }))}
        />
        <Select
          label="Chauffeur"
          value={driverId}
          onChange={setDriverId}
          placeholder="Aucun"
          options={drivers.map((d) => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name}`,
          }))}
        />
        <Input label="Titre" value={title} onChange={setTitle} required placeholder="Frein défaillant" />
        <Textarea
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Décrivez le problème..."
        />
        <Select
          label="Sévérité"
          value={severity}
          onChange={(v) => setSeverity(v as AnomalySeverity)}
          options={Object.entries(ANOMALY_SEVERITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={!vehicleId || !title}>
            Signaler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
