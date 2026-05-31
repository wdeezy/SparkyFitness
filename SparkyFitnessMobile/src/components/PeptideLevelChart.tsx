import React, { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { matchFont } from '@shopify/react-native-skia';
import { useCSSVariable } from 'uniwind';
import type { LevelSeriesPoint } from '../types/peptides';

interface PeptideLevelChartProps {
  series: LevelSeriesPoint[];
  doseUnit: string;
  isLoading?: boolean;
  isError?: boolean;
  /** Per-peptide accent; falls back to the theme accent when null. */
  color?: string | null;
}

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });
const font = matchFont({ fontFamily, fontSize: 11 });

const formatXLabel = (timestamp: number): string => {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Half-life decay line chart for a single peptide. Mirrors the web Peptides
 * page chart (estimated remaining level over time). `x` is an epoch-ms
 * timestamp; victory plots it as a numeric axis and we format ticks as dates.
 */
const PeptideLevelChart: React.FC<PeptideLevelChartProps> = ({
  series,
  doseUnit,
  isLoading = false,
  isError = false,
  color,
}) => {
  const [accentColor, textMuted] = useCSSVariable([
    '--color-accent-primary',
    '--color-text-muted',
  ]) as [string, string];

  const data = useMemo(
    () => series.map((p) => ({ x: p.timestamp, level: p.level })),
    [series],
  );

  return (
    <View className="bg-surface rounded-xl p-4 my-2 shadow-sm">
      <Text className="text-text-secondary text-xs mb-2">
        Estimated level ({doseUnit})
      </Text>
      {isLoading ? (
        <View style={{ height: 200 }} className="justify-center items-center">
          <Text className="text-text-muted text-sm">Loading…</Text>
        </View>
      ) : isError ? (
        <View style={{ height: 200 }} className="justify-center items-center">
          <Text className="text-text-muted text-sm">
            Failed to load chart data
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={{ height: 200 }} className="justify-center items-center">
          <Text className="text-text-muted text-sm">
            No data yet — log an injection to see the curve.
          </Text>
        </View>
      ) : (
        <View style={{ height: 200 }}>
          <CartesianChart
            data={data}
            xKey="x"
            yKeys={['level']}
            domainPadding={{ left: 20, right: 20, top: 20, bottom: 10 }}
            xAxis={{
              font,
              tickCount: 5,
              labelColor: textMuted,
              formatXLabel,
            }}
            yAxis={[{ font, tickCount: 5, labelColor: textMuted }]}
          >
            {({ points }) => (
              <Line
                points={points.level}
                color={color ?? accentColor}
                strokeWidth={2}
                animate={{ type: 'timing', duration: 300 }}
                curveType="monotoneX"
              />
            )}
          </CartesianChart>
        </View>
      )}
    </View>
  );
};

export default PeptideLevelChart;
