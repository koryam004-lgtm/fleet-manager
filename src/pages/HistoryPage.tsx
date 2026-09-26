import { useEffect, useState } from 'react';
import {
  Car,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  TrendingUp,
  History as HistoryIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HistoryEntry, EventType } from '@/lib/types';
import { formatDateTime } from '@/lib/constants';
import { Card, Spinner, EmptyState, Select } from '@/components/ui';

export function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('history')
      .select('*, vehicle:vehicles(*), driver:drivers(*)')
      .order('created_at', { ascending: false });
    setHistory((data as HistoryEntry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === 'all' ? history : history.filter((h) => h.event_type === filter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{history.length} événement(s)</p>
        <div className="w-56">
          <Select
            value={filter}
            onChange={setFilter}
            placeholder="Tous les types"
            options={[
              { value: 'vehicle_created', label: 'Véhicule créé' },
              { value: 'vehicle_updated', label: 'Véhicule modifié' },
              { value: 'driver_created', label: 'Chauffeur ajouté' },
              { value: 'driver_updated', label: 'Chauffeur modifié' },
              { value: 'checklist_completed', label: 'Checklist complétée' },
              { value: 'anomaly_reported', label: 'Anomalie signalée' },
              { value: 'anomaly_resolved', label: 'Anomalie résolue' },
              { value: 'vehicle_assigned', label: 'Affectation' },
              { value: 'status_change', label: 'Changement de statut' },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HistoryIcon size={28} />}
            title="Aucun événement"
            description="L'historique se remplira automatiquement avec l'activité de la flotte."
          />
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-1">
            {filtered.map((h, i) => (
              <div key={h.id} className="flex items-start gap-4 py-3">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <EventIcon type={h.event_type} />
                  </div>
                  {i < filtered.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-slate-100" style={{ minHeight: '20px' }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm text-slate-700">{h.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatDateTime(h.created_at)}</span>
                    {h.vehicle && (
                      <span className="flex items-center gap-1">
                        <Car size={12} /> {h.vehicle.registration}
                      </span>
                    )}
                    {h.driver && (
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {h.driver.first_name} {h.driver.last_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: EventType }) {
  const size = 16;
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
