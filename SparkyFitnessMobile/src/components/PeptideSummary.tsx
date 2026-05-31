import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useCSSVariable } from 'uniwind';
import Icon from './Icon';
import { usePeptideLevels } from '../hooks/usePeptides';

interface PeptideSummaryProps {
  /** Gate the request on server connection, matching the other summaries. */
  enabled?: boolean;
  onPress?: () => void;
}

/**
 * Compact, read-only peptide summary for the Diary screen. Mirrors the web
 * `PeptideSummary` — shows the current estimated level for each active peptide
 * and navigates to the full Peptides screen on tap. Renders nothing when there
 * are no active peptides, so it stays out of the way for users who don't track
 * peptides.
 */
const PeptideSummary: React.FC<PeptideSummaryProps> = ({
  enabled = true,
  onPress,
}) => {
  const accentColor = useCSSVariable('--color-accent-primary') as string;
  const { data: levels, isLoading } = usePeptideLevels({ enabled });

  const activeLevels = (levels ?? []).filter((l) => l.is_active);

  // Stay invisible until we know there's something to show.
  if (isLoading || activeLevels.length === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-xl p-4 my-2 shadow-sm"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Icon name="peptides" size={20} color={accentColor} />
          <Text className="text-text-primary text-lg font-semibold ml-2">
            Peptides
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color="#999" />
      </View>

      <View className="flex-row flex-wrap">
        {activeLevels.map((l) => (
          <View key={l.peptide_id} className="mr-6 mb-2" style={{ minWidth: 110 }}>
            <View className="flex-row items-center">
              <Text
                className="text-sm font-medium text-text-primary"
                numberOfLines={1}
              >
                {l.name}
              </Text>
              <View className="bg-raised rounded-full px-2 py-0.5 ml-2">
                <Text className="text-text-secondary text-xs">
                  ~{l.half_life_hours}h
                </Text>
              </View>
            </View>
            <Text className="text-xl font-semibold text-text-primary mt-0.5">
              {l.currentLevel} {l.dose_unit}
            </Text>
            <Text className="text-xs text-text-muted">
              {l.percentOfLastDoseRemaining != null
                ? `${l.percentOfLastDoseRemaining}% of last dose`
                : 'No injections logged'}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

export default PeptideSummary;
