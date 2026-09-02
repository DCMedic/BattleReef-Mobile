import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { analyzeLatestChange } from '@/domain/change-analysis';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function ChangeAnalysisScreen() {
  const params = useLocalSearchParams<{ parameter?: string }>();
  const { husbandryEvents, readings, tasks } = useAppData();
  const parameter = params.parameter as ParameterKey | undefined;
  const analysis = parameter ? analyzeLatestChange(parameter, readings, husbandryEvents, tasks) : null;

  return (
    <Screen subtitle="Recent context, not proof of causation" title="What changed?">
      {!analysis ? (
        <EmptyState
          body="BattleReef needs at least two readings for this parameter before it can compare changes."
          icon="git-compare-outline"
          title="Not enough history yet"
        />
      ) : (
        <>
          <Card>
            <Text style={styles.eyebrow}>{parameterCatalog[analysis.parameter].label.toUpperCase()}</Text>
            <Text style={styles.summary}>{analysis.summary}</Text>
            <View style={styles.readingRow}>
              <View>
                <Text style={styles.value}>{analysis.previous.value} {analysis.previous.unit}</Text>
                <Text style={styles.caption}>{formatWhen(analysis.previous.recordedAt)}</Text>
              </View>
              <Ionicons color={Brand.cyan} name="arrow-forward" size={22} />
              <View>
                <Text style={styles.value}>{analysis.current.value} {analysis.current.unit}</Text>
                <Text style={styles.caption}>{formatWhen(analysis.current.recordedAt)}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plausible recent context</Text>
            <Text style={styles.count}>{analysis.context.length}</Text>
          </View>

          {analysis.context.length === 0 ? (
            <Card>
              <Text style={styles.body}>
                No husbandry or completed maintenance events were logged between the compared readings or within the seven-day lookback window.
              </Text>
            </Card>
          ) : (
            analysis.context.map((item, index) => (
              <View key={`${item.kind}-${item.at}-${index}`} style={styles.contextRow}>
                <View style={styles.icon}>
                  <Ionicons color={Brand.cyan} name={item.kind === 'maintenance' ? 'checkmark-circle-outline' : 'time-outline'} size={20} />
                </View>
                <View style={styles.contextText}>
                  <Text style={styles.contextLabel}>{item.label}</Text>
                  <Text style={styles.contextDetail}>{formatWhen(item.at)} · {item.detail}</Text>
                </View>
              </View>
            ))
          )}

          <Card>
            <View style={styles.noticeRow}>
              <Ionicons color={Brand.amber} name="information-circle-outline" size={22} />
              <Text style={styles.notice}>
                BattleReef is showing temporal context only. A nearby event may be relevant, unrelated, or one of several contributors.
              </Text>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: Brand.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  summary: { color: Brand.text, fontSize: 20, lineHeight: 27, fontWeight: '800', marginTop: 8 },
  readingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  value: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  caption: { color: Brand.textMuted, fontSize: 11, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  count: { color: Brand.cyan, fontSize: 12, fontWeight: '900' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, borderRadius: 16, padding: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  contextText: { flex: 1 },
  contextLabel: { color: Brand.text, fontSize: 14, fontWeight: '800' },
  contextDetail: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  body: { color: Brand.textMuted, fontSize: 13, lineHeight: 19 },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  notice: { color: Brand.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
