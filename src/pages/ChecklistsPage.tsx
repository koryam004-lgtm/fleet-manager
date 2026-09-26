import { useEffect, useState } from 'react';
import {
  Plus,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  Vehicle,
  Driver,
  ChecklistTemplate,
  ChecklistItem,
  Checklist,
  ChecklistResponse,
  ResponseStatus,
  ItemCategory,
} from '@/lib/types';
import {
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_COLORS,
  ITEM_CATEGORY_LABELS,
  RESPONSE_STATUS_LABELS,
  formatDateTime,
} from '@/lib/constants';
import {
  Card,
  Badge,
  Button,
  Modal,
  Select,
  Textarea,
  Spinner,
  EmptyState,
} from '@/components/ui';

export function ChecklistsPage() {
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [c, v, d, t] = await Promise.all([
      supabase
        .from('checklists')
        .select('*, vehicle:vehicles(*), driver:drivers(*), template:checklist_templates(*)')
        .order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').order('registration'),
      supabase.from('drivers').select('*').order('first_name'),
      supabase.from('checklist_templates').select('*'),
    ]);
    setChecklists((c.data as Checklist[]) ?? []);
    setVehicles(v.data ?? []);
    setDrivers(d.data ?? []);
    setTemplates(t.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (selectedId) {
    return (
      <ChecklistDetail
        checklistId={selectedId}
        onBack={() => {
          setSelectedId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{checklists.length} checklist(s)</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nouvelle checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck size={28} />}
            title="Aucune checklist"
            description="Créez une checklist d'inspection pour un véhicule."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={18} /> Créer une checklist
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {checklists.map((c) => (
            <Card
              key={c.id}
              className="flex cursor-pointer items-center justify-between p-4 transition hover:shadow-md"
            >
              <div className="flex items-center gap-4" onClick={() => setSelectedId(c.id)}>
                {c.status === 'passed' ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : c.status === 'failed' ? (
                  <XCircle size={22} className="text-rose-500" />
                ) : (
                  <Clock size={22} className="text-blue-500" />
                )}
                <div>
                  <p className="font-medium text-slate-800">
                    {c.vehicle?.brand} {c.vehicle?.model} — {c.vehicle?.registration}
                  </p>
                  <p className="text-sm text-slate-400">
                    {c.template?.name ?? 'Sans modèle'} · {formatDateTime(c.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={CHECKLIST_STATUS_COLORS[c.status]}>
                  {CHECKLIST_STATUS_LABELS[c.status]}
                </Badge>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <NewChecklistForm
          vehicles={vehicles}
          drivers={drivers}
          templates={templates}
          onClose={() => setShowForm(false)}
          onCreated={(id) => {
            setShowForm(false);
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}

function NewChecklistForm({
  vehicles,
  drivers,
  templates,
  onClose,
  onCreated,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  templates: ChecklistTemplate[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!templateId) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    supabase
      .from('checklist_items')
      .select('*')
      .eq('template_id', templateId)
      .order('category')
      .then(({ data }) => {
        setItems(data ?? []);
        setLoadingItems(false);
      });
  }, [templateId]);

  function setResponse(itemId: string, status: ResponseStatus) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, _response: status } : it))
    );
  }

  function setComment(itemId: string, comment: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, _comment: comment } : it))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !templateId) return;
    setSaving(true);

    const { data: checklist } = await supabase
      .from('checklists')
      .insert({
        vehicle_id: vehicleId,
        driver_id: driverId || null,
        template_id: templateId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (!checklist) {
      setSaving(false);
      return;
    }

    const responses = items.map((it) => ({
      checklist_id: checklist.id,
      item_id: it.id,
      status: (it as ChecklistItem & { _response?: ResponseStatus })._response ?? 'not_checked',
      comment: (it as ChecklistItem & { _comment?: string })._comment ?? null,
    }));

    if (responses.length > 0) {
      await supabase.from('checklist_responses').insert(responses);
    }

    onCreated(checklist.id);
  }

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <Modal open onClose={onClose} title="Nouvelle checklist" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            options={drivers
              .filter((d) => d.status === 'active')
              .map((d) => ({
                value: d.id,
                label: `${d.first_name} ${d.last_name}`,
              }))}
          />
          <div className="col-span-2">
            <Select
              label="Modèle de checklist"
              value={templateId}
              onChange={setTemplateId}
              required
              placeholder="Sélectionner..."
              options={templates.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </div>
        </div>

        {loadingItems && (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6 text-slate-400" />
          </div>
        )}

        {!loadingItems && items.length > 0 && (
          <div className="max-h-80 space-y-4 overflow-y-auto rounded-xl border border-slate-100 p-4">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {ITEM_CATEGORY_LABELS[cat as ItemCategory]}
                </p>
                <div className="space-y-2">
                  {catItems.map((it) => {
                    const resp = (it as ChecklistItem & { _response?: ResponseStatus })._response ?? 'not_checked';
                    return (
                      <div key={it.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">{it.label}</p>
                            {it.required && (
                              <span className="text-xs text-rose-400">*requis</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {(['ok', 'issue', 'not_checked'] as ResponseStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setResponse(it.id, s)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                  resp === s
                                    ? s === 'ok'
                                      ? 'bg-emerald-500 text-white'
                                      : s === 'issue'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-400 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {RESPONSE_STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                        {resp === 'issue' && (
                          <input
                            type="text"
                            placeholder="Commentaire..."
                            onChange={(e) => setComment(it.id, e.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving || !vehicleId || !templateId}>
            {saving ? 'Création...' : 'Créer la checklist'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChecklistDetail({
  checklistId,
  onBack,
}: {
  checklistId: string;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    const [c, r] = await Promise.all([
      supabase
        .from('checklists')
        .select('*, vehicle:vehicles(*), driver:drivers(*), template:checklist_templates(*)')
        .eq('id', checklistId)
        .maybeSingle(),
      supabase
        .from('checklist_responses')
        .select('*, item:checklist_items(*)')
        .eq('checklist_id', checklistId),
    ]);
    setChecklist((c.data as Checklist) ?? null);
    setResponses((r.data as ChecklistResponse[]) ?? []);
    setNotes(c.data?.notes ?? '');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [checklistId]);

  async function updateResponse(respId: string, status: ResponseStatus) {
    await supabase.from('checklist_responses').update({ status }).eq('id', respId);
    load();
  }

  async function completeChecklist(status: 'passed' | 'failed') {
    await supabase
      .from('checklists')
      .update({
        status,
        notes,
        completed_at: new Date().toISOString(),
      })
      .eq('id', checklistId);

    await supabase.from('history').insert({
      vehicle_id: checklist?.vehicle_id,
      event_type: 'checklist_completed',
      description: `Checklist ${status === 'passed' ? 'validée' : 'en échec'} pour ${checklist?.vehicle?.registration ?? ''}`,
    });

    // Auto-create anomalies for items with issues
    if (status === 'failed') {
      const issues = responses.filter((r) => r.status === 'issue');
      for (const issue of issues) {
        await supabase.from('anomalies').insert({
          vehicle_id: checklist!.vehicle_id,
          driver_id: checklist!.driver_id,
          checklist_id: checklist!.id,
          title: issue.item?.label ?? 'Anomalie détectée',
          description: issue.comment ?? 'Détecté lors de la checklist',
          severity: 'medium',
          status: 'open',
        });
        await supabase.from('history').insert({
          vehicle_id: checklist?.vehicle_id,
          event_type: 'anomaly_reported',
          description: `Anomalie signalée: ${issue.item?.label ?? ''} sur ${checklist?.vehicle?.registration ?? ''}`,
        });
      }
    }

    onBack();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (!checklist) return null;

  const grouped = responses.reduce<Record<string, ChecklistResponse[]>>((acc, r) => {
    if (r.item) {
      (acc[r.item.category] ??= []).push(r);
    }
    return acc;
  }, {});

  const okCount = responses.filter((r) => r.status === 'ok').length;
  const issueCount = responses.filter((r) => r.status === 'issue').length;
  const uncheckedCount = responses.filter((r) => r.status === 'not_checked').length;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        ← Retour
      </button>

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {checklist.vehicle?.brand} {checklist.vehicle?.model}
            </h2>
            <p className="text-sm text-slate-400">
              {checklist.vehicle?.registration} · {formatDateTime(checklist.created_at)}
            </p>
            {checklist.driver && (
              <p className="mt-1 text-sm text-slate-500">
                Chauffeur: {checklist.driver.first_name} {checklist.driver.last_name}
              </p>
            )}
          </div>
          <Badge className={CHECKLIST_STATUS_COLORS[checklist.status]}>
            {CHECKLIST_STATUS_LABELS[checklist.status]}
          </Badge>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{okCount}</p>
            <p className="text-xs text-emerald-600">Conformes</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-center">
            <p className="text-xl font-bold text-rose-600">{issueCount}</p>
            <p className="text-xs text-rose-600">Anomalies</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-bold text-slate-500">{uncheckedCount}</p>
            <p className="text-xs text-slate-500">Non vérifiés</p>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Points de contrôle</h3>
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catResponses]) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {ITEM_CATEGORY_LABELS[cat as ItemCategory]}
              </p>
              <div className="space-y-2">
                {catResponses.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{r.item?.label}</p>
                      {r.comment && (
                        <p className="mt-0.5 text-xs text-slate-400">{r.comment}</p>
                      )}
                    </div>
                    {checklist.status === 'in_progress' ? (
                      <div className="flex gap-1">
                        {(['ok', 'issue', 'not_checked'] as ResponseStatus[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateResponse(r.id, s)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              r.status === s
                                ? s === 'ok'
                                  ? 'bg-emerald-500 text-white'
                                  : s === 'issue'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-slate-400 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {RESPONSE_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Badge
                        className={
                          r.status === 'ok'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : r.status === 'issue'
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                        }
                      >
                        {RESPONSE_STATUS_LABELS[r.status]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-5">
        <Textarea
          label="Notes"
          value={notes}
          onChange={setNotes}
          placeholder="Notes complémentaires..."
          rows={3}
        />
      </Card>

      {/* Actions */}
      {checklist.status === 'in_progress' && (
        <div className="flex justify-end gap-3">
          <Button variant="danger" onClick={() => completeChecklist('failed')}>
            <XCircle size={18} /> Valider en échec
          </Button>
          <Button onClick={() => completeChecklist('passed')}>
            <CheckCircle2 size={18} /> Valider la checklist
          </Button>
        </div>
      )}
    </div>
  );
}
