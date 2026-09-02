import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { getEffectiveTargetRange } from '@/domain/context';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { analyzeTrend } from '@/domain/trend-analysis';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function TrendScreen() {
  const params = useLocalSearchParams<{ parameter?: string }>();
  const { readings, selectedAquarium, targetOverrides } = useAppData();
  const parameter = params.parameter as ParameterKey | undefined;
  const target = selectedAquarium && parameter
    ? getEffectiveTargetRange(selectedAquarium.id, selectedAquarium.type, parameter, targetOverrides)
    : null;
  const trend = parameter ? analyzeTrend(parameter, readings, target) : null;

  return (
    <Screen subtitle="Short-window trajectory from local readings" title="Trend">
      {!trend ? (
        <EmptyState
          body="Log at least three readings for this parameter to establish a short-window trend."
          icon="trending-up-outline"
          title="More history needed"
        />
      ) : (
        <>
          <Card>
            <View style={styles.heading}>
              <View>
                <Text style={styles.eyebrow}>{parameterCatalog[trend.parameter].label.toUpperCase()}</Text>
                <Text style={styles.direction}>{trend.direction}</Text>
              </View>
              <Ionicons
                color={trend.direction === 'steady' ? Brand.green : Brand.cyan}
                name={trend.direction === 'rising' ? 'trending-up' : trend.direction === 'falling' ? 'trending-down' : 'remove'}
                size={34}
              />
            </View>
            <Text style={styles.summary}>{trend.summary}</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{Math.abs(trend.ratePerDay).toFixed(parameterCatalog[trend.parameter].decimals)}</Text>
                <Text style={styles.metricLabel}>{parameterCatalog[trend.parameter].unit}/day</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{trend.readings.length}</Text>
                <Text style={styles.metricLabel}>readings</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{trend.persistence}</Text>
                <Text style={styles.metricLabel}>consecutive out</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Recent trajectory</Text>
          {trend.readings.slice().reverse().map((reading) => (
            <View key={reading.id} style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.rowBody}>
                <Text style={styles.value}>{reading.value} {reading.unit}</Text>
                <Text style={styles.time}>{formatWhen(reading.recordedAt)}</Text>
              </View>
            </View>
          ))}

          <Card>
            <Text style={styles.note}>
              Trend direction is calculated from the oldest and newest readings in a rolling 14-day window, using up to eight observations. It is descriptive, not a forecast.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: Brand.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  direction: { color: Brand.text, fontSize: 28, fontWeight: '900', textTransform: 'capitalize', marginTop: 4 },
  summary: { color: Brand.textMuted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  metrics: { flexDirection: 'row', marginTop: 20 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: Brand.text, fontSize: 20, fontWeight: '900' },
  metricLabel: { color: Brand.textFaint, fontSize: 10, marginTop: 3, textAlign: 'center' },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 15, padding: 13 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Brand.cyan },
  rowBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { color: Brand.text, fontSize: 14, fontWeight: '800' },
  time: { color: Brand.textMuted, fontSize: 11 },
  note: { color: Brand.textMuted, fontSize: 12, lineHeight: 18 },
});
