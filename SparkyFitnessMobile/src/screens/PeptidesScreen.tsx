import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import Toast from 'react-native-toast-message';
import Button from '../components/ui/Button';
import FormInput from '../components/FormInput';
import Icon from '../components/Icon';
import StatusView from '../components/StatusView';
import PeptideLevelChart from '../components/PeptideLevelChart';
import { useActiveWorkoutBarPadding } from '../components/ActiveWorkoutBar';
import { useServerConnection } from '../hooks';
import {
  usePeptideInjections,
  usePeptideLevels,
  usePeptideMutations,
  usePeptideSeries,
  usePeptides,
} from '../hooks/usePeptides';
import { HALF_LIFE_PRESETS } from '../types/peptides';
import type { RootStackScreenProps } from '../types/navigation';

type PeptidesScreenProps = RootStackScreenProps<'Peptides'>;

const formatInjectionDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PeptidesScreen: React.FC<PeptidesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const activeWorkoutBarPadding = useActiveWorkoutBarPadding('stack');
  const accentColor = useCSSVariable('--color-accent-primary') as string;

  const { isConnected, isLoading: isConnectionLoading } = useServerConnection();

  const { data: peptides = [], isLoading: isPeptidesLoading } = usePeptides({
    enabled: isConnected,
  });
  const { data: levels = [] } = usePeptideLevels({ enabled: isConnected });
  const {
    createPeptideMutation,
    deletePeptideMutation,
    logInjectionMutation,
    deleteInjectionMutation,
  } = usePeptideMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default the selection to the first peptide once data arrives.
  useEffect(() => {
    if (!selectedId && peptides.length > 0) {
      setSelectedId(peptides[0].id);
    }
    if (selectedId && !peptides.some((p) => p.id === selectedId)) {
      setSelectedId(peptides[0]?.id ?? null);
    }
  }, [peptides, selectedId]);

  const selected = useMemo(
    () => peptides.find((p) => p.id === selectedId) ?? null,
    [peptides, selectedId],
  );

  const { data: series, isLoading: isSeriesLoading, isError: isSeriesError } =
    usePeptideSeries(selectedId, { enabled: isConnected });
  const { data: injections = [] } = usePeptideInjections(selectedId, {
    enabled: isConnected,
  });

  // Add-peptide modal state.
  const [addOpen, setAddOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pHalf, setPHalf] = useState('');
  const [pDose, setPDose] = useState('');
  const [pUnit, setPUnit] = useState('mg');

  // Log-injection modal state.
  const [logOpen, setLogOpen] = useState(false);
  const [iDose, setIDose] = useState('');
  const [iSite, setISite] = useState('');

  const resetAddForm = () => {
    setPName('');
    setPHalf('');
    setPDose('');
    setPUnit('mg');
  };

  const applyPreset = (name: string) => {
    const preset = HALF_LIFE_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    setPName(preset.name);
    setPHalf(String(preset.halfLifeHours));
    setPUnit(preset.unit);
  };

  const handleAddPeptide = () => {
    const half = Number(pHalf);
    if (!pName.trim() || !pHalf || Number.isNaN(half) || half <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Name and a valid half-life are required',
      });
      return;
    }
    createPeptideMutation.mutate(
      {
        name: pName.trim(),
        half_life_hours: half,
        default_dose: pDose ? Number(pDose) : null,
        dose_unit: pUnit.trim() || 'mg',
      },
      {
        onSuccess: (created) => {
          setAddOpen(false);
          resetAddForm();
          setSelectedId(created.id);
          Toast.show({ type: 'success', text1: `Added ${created.name}` });
        },
        onError: () =>
          Toast.show({ type: 'error', text1: 'Failed to add peptide' }),
      },
    );
  };

  const handleLogInjection = () => {
    if (!selectedId) return;
    const dose = Number(iDose);
    if (!iDose || Number.isNaN(dose) || dose <= 0) {
      Toast.show({ type: 'error', text1: 'A valid dose is required' });
      return;
    }
    logInjectionMutation.mutate(
      {
        peptideId: selectedId,
        data: {
          dose,
          injection_site: iSite.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setLogOpen(false);
          setIDose('');
          setISite('');
          Toast.show({ type: 'success', text1: 'Injection logged' });
        },
        onError: () =>
          Toast.show({ type: 'error', text1: 'Failed to log injection' }),
      },
    );
  };

  const confirmDeletePeptide = (id: string, name: string) => {
    Alert.alert(
      'Delete peptide',
      `Delete "${name}" and all of its logged injections? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deletePeptideMutation.mutate(id, {
              onSuccess: () =>
                Toast.show({ type: 'success', text1: 'Peptide deleted' }),
              onError: () =>
                Toast.show({ type: 'error', text1: 'Failed to delete peptide' }),
            }),
        },
      ],
    );
  };

  const handleDeleteInjection = (injectionId: string) => {
    if (!selectedId) return;
    deleteInjectionMutation.mutate(
      { injectionId, peptideId: selectedId },
      {
        onError: () =>
          Toast.show({ type: 'error', text1: 'Failed to delete injection' }),
      },
    );
  };

  const renderHeader = () => (
    <View
      className="flex-row items-center justify-between px-4 pb-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center flex-1">
        <Button
          variant="ghost"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="py-0 px-0 mr-2"
        >
          <Icon name="chevron-back" size={22} color={accentColor} />
        </Button>
        <Text className="text-2xl font-bold text-text-primary">Peptides</Text>
      </View>
      <Button variant="primary" className="px-4 py-2" onPress={() => setAddOpen(true)}>
        <View className="flex-row items-center">
          <Icon name="add" size={16} color="#fff" />
          <Text className="text-white font-semibold ml-1">Add</Text>
        </View>
      </Button>
    </View>
  );

  if (!isConnectionLoading && !isConnected) {
    return (
      <View className="flex-1 bg-background">
        {renderHeader()}
        <StatusView
          icon="peptides"
          title="Not connected"
          subtitle="Connect to your SparkyFitness server to track peptides."
          action={{
            label: 'Go to Settings',
            onPress: () => navigation.navigate('Tabs', { screen: 'Settings' }),
            variant: 'primary',
          }}
        />
      </View>
    );
  }

  const activeLevels = levels.filter((l) => l.is_active);

  return (
    <View className="flex-1 bg-background">
      {renderHeader()}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 0,
          paddingBottom: insets.bottom + activeWorkoutBarPadding + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-text-secondary mb-4">
          Estimated remaining levels based on each peptide&apos;s half-life. For
          tracking and visualization only — not medical or dosing advice.
        </Text>

        {/* Current level cards */}
        {activeLevels.map((l) => {
          const isSel = selectedId === l.peptide_id;
          return (
            <Pressable
              key={l.peptide_id}
              onPress={() => setSelectedId(l.peptide_id)}
              className="bg-surface rounded-xl p-4 mb-3 shadow-sm"
              style={
                isSel
                  ? { borderWidth: 2, borderColor: accentColor }
                  : { borderWidth: 2, borderColor: 'transparent' }
              }
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-text-primary">
                  {l.name}
                </Text>
                <View className="bg-raised rounded-full px-2 py-0.5">
                  <Text className="text-text-secondary text-xs">
                    ~{l.half_life_hours}h
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-semibold text-text-primary mt-1">
                {l.currentLevel} {l.dose_unit}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">
                {l.percentOfLastDoseRemaining != null
                  ? `${l.percentOfLastDoseRemaining}% of last dose remaining`
                  : 'No injections logged'}
                {l.hoursSinceLastDose != null
                  ? ` · ${Math.round(l.hoursSinceLastDose)}h ago`
                  : ''}
              </Text>
            </Pressable>
          );
        })}

        {!isPeptidesLoading && peptides.length === 0 && (
          <View className="bg-surface rounded-xl p-6 items-center my-2 shadow-sm">
            <Icon name="peptides" size={28} color={accentColor} />
            <Text className="text-text-secondary text-center mt-2">
              No peptides yet. Tap “Add” to start tracking.
            </Text>
          </View>
        )}

        {/* Selected peptide: chart + actions + history */}
        {selected && (
          <View className="mt-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-lg font-semibold text-text-primary flex-1">
                {selected.name} — estimated level
              </Text>
              <Button
                variant="outline"
                className="px-3 py-2 mr-2"
                onPress={() => setLogOpen(true)}
              >
                <View className="flex-row items-center">
                  <Icon name="peptides" size={16} color={accentColor} />
                  <Text className="text-accent-primary font-semibold ml-1">
                    Log
                  </Text>
                </View>
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-2"
                onPress={() => confirmDeletePeptide(selected.id, selected.name)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="trash" size={18} color="#ef4444" />
              </Button>
            </View>

            <PeptideLevelChart
              series={series?.series ?? []}
              doseUnit={selected.dose_unit}
              isLoading={isSeriesLoading}
              isError={isSeriesError}
              color={selected.color}
            />

            <Text className="text-base font-semibold text-text-primary mt-4 mb-2">
              Injection history
            </Text>
            <View className="bg-surface rounded-xl shadow-sm overflow-hidden">
              {injections.length === 0 ? (
                <Text className="text-text-muted text-sm p-4">
                  No injections logged yet.
                </Text>
              ) : (
                injections.map((inj, idx) => (
                  <View
                    key={inj.id}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      idx < injections.length - 1
                        ? 'border-b border-border-subtle'
                        : ''
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-text-primary text-sm">
                        {inj.dose} {inj.dose_unit}
                        {inj.injection_site ? ` · ${inj.injection_site}` : ''}
                      </Text>
                      <Text className="text-text-muted text-xs mt-0.5">
                        {formatInjectionDate(inj.injected_at)}
                      </Text>
                    </View>
                    <Button
                      variant="ghost"
                      className="px-2 py-1"
                      onPress={() => handleDeleteInjection(inj.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="trash" size={16} color="#ef4444" />
                    </Button>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add peptide modal */}
      <Modal
        visible={addOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View className="bg-background rounded-t-2xl p-5" style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-text-primary">
                Add peptide
              </Text>
              <Button variant="ghost" className="px-2 py-1" onPress={() => setAddOpen(false)}>
                <Icon name="close" size={22} color={accentColor} />
              </Button>
            </View>

            <Text className="text-text-secondary text-xs mb-2">Quick preset</Text>
            <View className="flex-row flex-wrap mb-4">
              {HALF_LIFE_PRESETS.map((p) => (
                <Pressable
                  key={p.name}
                  onPress={() => applyPreset(p.name)}
                  className="bg-raised rounded-full px-3 py-1.5 mr-2 mb-2"
                >
                  <Text className="text-text-primary text-sm">{p.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-text-secondary text-xs mb-1">Name</Text>
            <FormInput
              value={pName}
              onChangeText={setPName}
              placeholder="e.g. Semaglutide"
              className="mb-3"
            />

            <View className="flex-row">
              <View className="flex-1 mr-2">
                <Text className="text-text-secondary text-xs mb-1">
                  Half-life (h)
                </Text>
                <FormInput
                  value={pHalf}
                  onChangeText={setPHalf}
                  keyboardType="numeric"
                  placeholder="165"
                />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-text-secondary text-xs mb-1">
                  Default dose
                </Text>
                <FormInput
                  value={pDose}
                  onChangeText={setPDose}
                  keyboardType="numeric"
                  placeholder="optional"
                />
              </View>
              <View style={{ width: 72 }}>
                <Text className="text-text-secondary text-xs mb-1">Unit</Text>
                <FormInput value={pUnit} onChangeText={setPUnit} placeholder="mg" />
              </View>
            </View>

            <Button
              variant="primary"
              className="mt-5 py-3"
              onPress={handleAddPeptide}
              disabled={createPeptideMutation.isPending}
            >
              {createPeptideMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log injection modal */}
      <Modal
        visible={logOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLogOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View className="bg-background rounded-t-2xl p-5" style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-text-primary">
                Log injection{selected ? ` — ${selected.name}` : ''}
              </Text>
              <Button variant="ghost" className="px-2 py-1" onPress={() => setLogOpen(false)}>
                <Icon name="close" size={22} color={accentColor} />
              </Button>
            </View>

            <Text className="text-text-secondary text-xs mb-1">
              Dose ({selected?.dose_unit ?? 'mg'})
            </Text>
            <FormInput
              value={iDose}
              onChangeText={setIDose}
              keyboardType="numeric"
              placeholder={
                selected?.default_dose != null
                  ? String(selected.default_dose)
                  : ''
              }
              className="mb-3"
            />

            <Text className="text-text-secondary text-xs mb-1">
              Injection site (optional)
            </Text>
            <FormInput
              value={iSite}
              onChangeText={setISite}
              placeholder="e.g. left abdomen"
              className="mb-2"
            />

            <Text className="text-text-muted text-xs">
              Logged at the current time.
            </Text>

            <Button
              variant="primary"
              className="mt-5 py-3"
              onPress={handleLogInjection}
              disabled={logInjectionMutation.isPending}
            >
              {logInjectionMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PeptidesScreen;
