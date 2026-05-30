import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  TooltipValueType,
} from 'recharts';
import { format } from 'date-fns';
import { Plus, Syringe, Trash2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  usePeptideApi,
  HALF_LIFE_PRESETS,
  type Peptide,
  type PeptideLevel,
  type Injection,
  type LevelSeriesResponse,
} from '@/hooks/Peptides/usePeptides';

function nowLocalInput(): string {
  // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Peptides() {
  const { toast } = useToast();
  const {
    getPeptides,
    getCurrentLevels,
    getLevelSeries,
    getInjections,
    createPeptide,
    logInjection,
    deletePeptide,
    deleteInjection,
  } = usePeptideApi();
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [levels, setLevels] = useState<PeptideLevel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [series, setSeries] = useState<LevelSeriesResponse | null>(null);
  const [injections, setInjections] = useState<Injection[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Add-peptide form
  const [pName, setPName] = useState('');
  const [pHalf, setPHalf] = useState('');
  const [pDose, setPDose] = useState('');
  const [pUnit, setPUnit] = useState('mg');

  // Log-injection form
  const [iDose, setIDose] = useState('');
  const [iSite, setISite] = useState('');
  const [iWhen, setIWhen] = useState(nowLocalInput());

  const selected = useMemo(
    () => peptides.find((p) => p.id === selectedId) || null,
    [peptides, selectedId]
  );

  async function refreshAll() {
    setLoading(true);
    try {
      const [ps, lv] = await Promise.all([getPeptides(), getCurrentLevels()]);
      setPeptides(ps);
      setLevels(lv);
      if (!selectedId && ps[0]) setSelectedId(ps[0].id);
    } catch {
      toast({ title: 'Failed to load peptides', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function refreshSelected(id: string) {
    try {
      const [s, inj] = await Promise.all([
        getLevelSeries(id),
        getInjections(id),
      ]);
      setSeries(s);
      setInjections(inj);
    } catch {
      toast({ title: 'Failed to load chart data', variant: 'destructive' });
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) refreshSelected(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function applyPreset(name: string) {
    const preset = HALF_LIFE_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    setPName(preset.name);
    setPHalf(String(preset.halfLifeHours));
    setPUnit(preset.unit);
  }

  async function handleAddPeptide() {
    if (!pName || !pHalf) {
      toast({
        title: 'Name and half-life are required',
        variant: 'destructive',
      });
      return;
    }
    try {
      const created = await createPeptide({
        name: pName,
        half_life_hours: Number(pHalf),
        default_dose: pDose ? Number(pDose) : null,
        dose_unit: pUnit,
      });
      setAddOpen(false);
      setPName('');
      setPHalf('');
      setPDose('');
      setPUnit('mg');
      await refreshAll();
      setSelectedId(created.id);
      toast({ title: `Added ${created.name}` });
    } catch {
      toast({ title: 'Failed to add peptide', variant: 'destructive' });
    }
  }

  async function handleLogInjection() {
    if (!selectedId || !iDose) {
      toast({ title: 'Dose is required', variant: 'destructive' });
      return;
    }
    try {
      await logInjection(selectedId, {
        dose: Number(iDose),
        injection_site: iSite || undefined,
        injected_at: iWhen ? new Date(iWhen).toISOString() : undefined,
      });
      setLogOpen(false);
      setIDose('');
      setISite('');
      setIWhen(nowLocalInput());
      await Promise.all([refreshAll(), refreshSelected(selectedId)]);
      toast({ title: 'Injection logged' });
    } catch {
      toast({ title: 'Failed to log injection', variant: 'destructive' });
    }
  }

  async function handleDeletePeptide(id: string) {
    try {
      await deletePeptide(id);
      if (selectedId === id) {
        setSelectedId(null);
        setSeries(null);
        setInjections([]);
      }
      await refreshAll();
      toast({ title: 'Peptide deleted' });
    } catch {
      toast({ title: 'Failed to delete peptide', variant: 'destructive' });
    }
  }

  async function handleDeleteInjection(id: string) {
    try {
      await deleteInjection(id);
      if (selectedId) {
        await Promise.all([refreshAll(), refreshSelected(selectedId)]);
      }
      toast({ title: 'Injection deleted' });
    } catch {
      toast({ title: 'Failed to delete injection', variant: 'destructive' });
    }
  }

  const chartData = useMemo(
    () =>
      (series?.series || []).map((p) => ({
        ...p,
        label: format(new Date(p.timestamp), 'MMM d'),
      })),
    [series]
  );
  const nowMs = Date.now();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Syringe className="h-6 w-6" /> Peptides
          </h1>
          <p className="text-sm text-muted-foreground">
            Estimated remaining levels based on each peptide&apos;s half-life.
            For tracking and visualization only — not medical or dosing advice.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Add peptide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add peptide</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Quick preset</Label>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a common peptide (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {HALF_LIFE_PRESETS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} (~{p.halfLifeHours}h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label>Half-life (h)</Label>
                  <Input
                    type="number"
                    value={pHalf}
                    onChange={(e) => setPHalf(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Default dose</Label>
                  <Input
                    type="number"
                    value={pDose}
                    onChange={(e) => setPDose(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Unit</Label>
                  <Input
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPeptide}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current level cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels
          .filter((l) => l.is_active)
          .map((l) => (
            <Card
              key={l.peptide_id}
              className={`cursor-pointer transition ${
                selectedId === l.peptide_id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedId(l.peptide_id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {l.name}
                  <Badge variant="secondary">~{l.half_life_hours}h</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {l.currentLevel} {l.dose_unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {l.percentOfLastDoseRemaining != null
                    ? `${l.percentOfLastDoseRemaining}% of last dose remaining`
                    : 'No injections logged'}
                  {l.hoursSinceLastDose != null
                    ? ` · ${Math.round(l.hoursSinceLastDose)}h ago`
                    : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        {!loading && levels.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No peptides yet. Add one to start tracking.
          </p>
        )}
      </div>

      {/* Selected peptide: chart + history */}
      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> {selected.name} — estimated level
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={logOpen} onOpenChange={setLogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Syringe className="h-4 w-4 mr-1" /> Log injection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log injection — {selected.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Dose ({selected.dose_unit})</Label>
                      <Input
                        type="number"
                        value={iDose}
                        onChange={(e) => setIDose(e.target.value)}
                        placeholder={
                          selected.default_dose
                            ? String(selected.default_dose)
                            : ''
                        }
                      />
                    </div>
                    <div>
                      <Label>Injection site (optional)</Label>
                      <Input
                        value={iSite}
                        onChange={(e) => setISite(e.target.value)}
                        placeholder="e.g. left abdomen"
                      />
                    </div>
                    <div>
                      <Label>When</Label>
                      <Input
                        type="datetime-local"
                        value={iWhen}
                        onChange={(e) => setIWhen(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleLogInjection}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeletePeptide(selected.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" minTickGap={40} fontSize={12} />
                  <YAxis
                    fontSize={12}
                    label={{
                      value: selected.dose_unit,
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(v: TooltipValueType | undefined) => [
                      `${v} ${selected.dose_unit}`,
                      'Level',
                    ]}
                  />
                  <ReferenceLine
                    x={format(new Date(nowMs), 'MMM d')}
                    stroke="#888"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="level"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Injection history</h3>
              <div className="space-y-1">
                {injections.map((inj) => (
                  <div
                    key={inj.id}
                    className="flex items-center justify-between text-sm border-b py-1"
                  >
                    <span>
                      {format(new Date(inj.injected_at), 'MMM d, yyyy HH:mm')} ·{' '}
                      {inj.dose} {inj.dose_unit}
                      {inj.injection_site ? ` · ${inj.injection_site}` : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteInjection(inj.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {injections.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No injections logged yet.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
