import { useEffect, useState } from 'react';
import { Plus, Users, Search, Pencil, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Driver, DriverStatus } from '@/lib/types';
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
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

export function DriversPage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
    setDrivers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.first_name.toLowerCase().includes(q) ||
      d.last_name.toLowerCase().includes(q) ||
      (d.license_number ?? '').toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce chauffeur ?')) return;
    await supabase.from('drivers').delete().eq('id', id);
    load();
  }

  async function handleSave(data: Partial<Driver>) {
    if (editing) {
      await supabase.from('drivers').update(data).eq('id', editing.id);
      await supabase.from('history').insert({
        driver_id: editing.id,
        event_type: 'driver_updated',
        description: `Chauffeur ${data.first_name} ${data.last_name} modifié`,
      });
    } else {
      const { data: newDriver } = await supabase.from('drivers').insert(data).select().single();
      if (newDriver) {
        await supabase.from('history').insert({
          driver_id: newDriver.id,
          event_type: 'driver_created',
          description: `Chauffeur ${data.first_name} ${data.last_name} ajouté`,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un chauffeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
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

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="Aucun chauffeur"
            description="Ajoutez votre premier chauffeur pour gérer les affectations."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={18} /> Ajouter un chauffeur
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                    {d.first_name[0]}
                    {d.last_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {d.first_name} {d.last_name}
                    </p>
                    <p className="text-sm text-slate-400">
                      Permis: {d.license_number ?? '—'}
                    </p>
                  </div>
                </div>
                <Badge className={DRIVER_STATUS_COLORS[d.status]}>
                  {DRIVER_STATUS_LABELS[d.status]}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {d.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    {d.phone}
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    {d.email}
                  </div>
                )}
                {d.hire_date && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    Embauché le {formatDate(d.hire_date)}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(d);
                    setShowForm(true);
                  }}
                >
                  <Pencil size={14} /> Modifier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                  <Trash2 size={14} /> Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <DriverForm
          driver={editing}
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

function DriverForm({
  driver,
  onClose,
  onSave,
}: {
  driver: Driver | null;
  onClose: () => void;
  onSave: (data: Partial<Driver>) => void;
}) {
  const [firstName, setFirstName] = useState(driver?.first_name ?? '');
  const [lastName, setLastName] = useState(driver?.last_name ?? '');
  const [licenseNumber, setLicenseNumber] = useState(driver?.license_number ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [email, setEmail] = useState(driver?.email ?? '');
  const [status, setStatus] = useState<DriverStatus>(driver?.status ?? 'active');
  const [hireDate, setHireDate] = useState(driver?.hire_date ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      first_name: firstName,
      last_name: lastName,
      license_number: licenseNumber || null,
      phone: phone || null,
      email: email || null,
      status,
      hire_date: hireDate || null,
    });
  }

  return (
    <Modal open onClose={onClose} title={driver ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" value={firstName} onChange={setFirstName} required />
          <Input label="Nom" value={lastName} onChange={setLastName} required />
          <Input label="N° permis" value={licenseNumber} onChange={setLicenseNumber} placeholder="123456789" />
          <Select
            label="Statut"
            value={status}
            onChange={(v) => setStatus(v as DriverStatus)}
            options={Object.entries(DRIVER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Input label="Téléphone" value={phone} onChange={setPhone} placeholder="06 12 34 56 78" />
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="nom@email.com" />
          <div className="col-span-2">
            <Input label="Date d'embauche" type="date" value={hireDate} onChange={setHireDate} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">{driver ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </form>
    </Modal>
  );
}
