import { useEffect, useState } from 'react';
import { Plus, Car, Search, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Vehicle, Driver, VehicleType, VehicleStatus, FuelType } from '@/lib/types';
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
  VEHICLE_STATUS_DOT,
  FUEL_TYPE_LABELS,
  DRIVER_STATUS_LABELS,
  formatDate,
} from '@/lib/constants';
import {
  Card,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Spinner,
  EmptyState,
} from '@/components/ui';

export function VehiclesPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  async function load() {
    setLoading(true);
    const [v, d] = await Promise.all([
      supabase.from('vehicles').select('*, driver:drivers(*)').order('created_at', { ascending: false }),
      supabase.from('drivers').select('*').order('first_name'),
    ]);
    setVehicles((v.data as Vehicle[]) ?? []);
    setDrivers(d.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.registration.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce véhicule ? Les checklists et anomalies associées seront aussi supprimées.')) return;
    await supabase.from('vehicles').delete().eq('id', id);
    load();
  }

  async function handleSave(data: Partial<Vehicle>) {
    if (editing) {
      const { driver_id, ...rest } = data;
      const updateData = {
        ...rest,
        driver_id: data.driver_id || null,
      };
      await supabase.from('vehicles').update(updateData).eq('id', editing.id);
      await supabase.from('history').insert({
        vehicle_id: editing.id,
        event_type: 'vehicle_updated',
        description: `Véhicule ${data.registration} modifié`,
      });
    } else {
      const { data: newVehicle } = await supabase
        .from('vehicles')
        .insert(data)
        .select()
        .single();
      if (newVehicle) {
        await supabase.from('history').insert({
          vehicle_id: newVehicle.id,
          event_type: 'vehicle_created',
          description: `Véhicule ${data.registration} ajouté à la flotte`,
        });
      }
    }
    setShowForm(false);
    setEditing(null);
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
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="in_use">En service</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Hors service</option>
          </select>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Car size={28} />}
            title="Aucun véhicule"
            description="Ajoutez votre premier véhicule pour commencer à gérer votre flotte."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={18} /> Ajouter un véhicule
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Car size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-sm text-slate-400">{v.registration}</p>
                  </div>
                </div>
                <Badge className={VEHICLE_STATUS_COLORS[v.status]} dot={VEHICLE_STATUS_DOT[v.status]}>
                  {VEHICLE_STATUS_LABELS[v.status]}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Info label="Type" value={VEHICLE_TYPE_LABELS[v.type]} />
                <Info label="Carburant" value={FUEL_TYPE_LABELS[v.fuel_type]} />
                <Info label="Année" value={v.year?.toString() ?? '—'} />
                <Info label="Kilométrage" value={`${v.mileage.toLocaleString('fr-FR')} km`} />
              </div>

              {v.driver && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Chauffeur assigné</p>
                  <p className="text-sm font-medium text-slate-700">
                    {v.driver.first_name} {v.driver.last_name}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(v);
                    setShowForm(true);
                  }}
                >
                  <Pencil size={14} /> Modifier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>
                  <Trash2 size={14} /> Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <VehicleForm
          vehicle={editing}
          drivers={drivers}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value}</p>
    </div>
  );
}

function VehicleForm({
  vehicle,
  drivers,
  onClose,
  onSave,
}: {
  vehicle: Vehicle | null;
  drivers: Driver[];
  onClose: () => void;
  onSave: (data: Partial<Vehicle>) => void;
}) {
  const [registration, setRegistration] = useState(vehicle?.registration ?? '');
  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(vehicle?.year?.toString() ?? '');
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? 'car');
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? 'available');
  const [mileage, setMileage] = useState(vehicle?.mileage?.toString() ?? '0');
  const [fuelType, setFuelType] = useState<FuelType>(vehicle?.fuel_type ?? 'diesel');
  const [driverId, setDriverId] = useState(vehicle?.driver_id ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      registration,
      brand,
      model,
      year: year ? parseInt(year) : null,
      type,
      status,
      mileage: parseInt(mileage) || 0,
      fuel_type: fuelType,
      driver_id: driverId || null,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={vehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Immatriculation" value={registration} onChange={setRegistration} required placeholder="AB-123-CD" />
          <Input label="Marque" value={brand} onChange={setBrand} required placeholder="Renault" />
          <Input label="Modèle" value={model} onChange={setModel} required placeholder="Master" />
          <Input label="Année" type="number" value={year} onChange={setYear} placeholder="2023" min={1900} max={2030} />
          <Select
            label="Type"
            value={type}
            onChange={(v) => setType(v as VehicleType)}
            options={Object.entries(VEHICLE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            label="Carburant"
            value={fuelType}
            onChange={(v) => setFuelType(v as FuelType)}
            options={Object.entries(FUEL_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            label="Statut"
            value={status}
            onChange={(v) => setStatus(v as VehicleStatus)}
            options={Object.entries(VEHICLE_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Input label="Kilométrage" type="number" value={mileage} onChange={setMileage} min={0} />
          <div className="col-span-2">
            <Select
              label="Chauffeur assigné"
              value={driverId}
              onChange={setDriverId}
              placeholder="Aucun chauffeur"
              options={drivers
                .filter((d) => d.status === 'active')
                .map((d) => ({
                  value: d.id,
                  label: `${d.first_name} ${d.last_name} — ${DRIVER_STATUS_LABELS[d.status]}`,
                }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            {vehicle ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
