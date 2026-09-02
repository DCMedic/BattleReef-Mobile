import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { getDelta, getEffectiveTargetRange, getPreviousReading, getRangeStatusForTarget } from '@/domain/context';
import { buildAdvisories } from '@/domain/advisories';
import { findMaterialChanges } from '@/domain/change-analysis';
import { calculateStabilityScore } from '@/domain/stability';
import { analyzeTrend } from '@/domain/trend-analysis';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { aquariums, dataError, husbandryEvents, loading, readings, selectedAquarium, selectAquarium, targetOverrides, tasks } = useAppData();

  const latest = readings.reduce<Partial<Record<ParameterKey, (typeof readings)[number]>>>((result, reading) => {
    if (!result[reading.parameter]) result[reading.parameter] = reading;
    return result;
  }, {});
  const openTasks = tasks.filter((task) => !task.completedAt).length;
  const stability = selectedAquarium ? calculateStabilityScore(selectedAquarium, readings, targetOverrides) : null;
  const materialChanges = findMaterialChanges(readings, husbandryEvents, tasks);
  const advisories = selectedAquarium ? buildAdvisories(selectedAquarium, readings, targetOverrides) : [];

  return (
    <Screen
      action={<Image source={require('@/assets/brand/battlereef-mark.webp')} style={styles.logo} />}
      subtitle="Your aquarium, understood."
      title="Overview">
      {loading ? <LoadingState /> : null}

      {!loading && dataError ? (
        <EmptyState
          body={`BattleReef could not load local data safely: ${dataError}`}
          icon="warning-outline"
          title="Local data unavailable"
        />
      ) : null}

      {!loading && !dataError && !selectedAquarium ? (
        <EmptyState
          action={<PrimaryButton icon="add" label="Create your first aquarium" onPress={() => router.push('/aquarium/new')} />}
          body="Set up a tank to begin logging water parameters, maintenance, livestock, and observations locally on this device."
          icon="fish-outline"
          title="Build your first reef record"
        />
      ) : null}

      {selectedAquarium ? (
        <>
          <View style={styles.aquariumRow}>
            <View style={styles.selectorWrap}>
              <Text style={styles.sectionLabel}>ACTIVE AQUARIUM</Text>
              <View style={styles.chips}>
                {aquariums.map((aquarium) => {
                  const active = aquarium.id === selectedAquarium.id;
                  return (
                    <Pressable
                      key={aquarium.id}
                      onPress={() => void selectAquarium(aquarium.id)}
                      style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{aquarium.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <IconButton icon="add" label="Add aquarium" onPress={() => router.push('/aquarium/new')} />
          </View>

          <Card>
            <View style={styles.tankHeader}>
              <View>
                <Text style={styles.tankName}>{selectedAquarium.name}</Text>
                <Text style={styles.tankMeta}>
                  {selectedAquarium.volumeGallons} gal · {selectedAquarium.type}
                </Text>
              </View>
              <View style={styles.localBadge}>
                <Ionicons color={Brand.green} name="shield-checkmark" size={14} />
                <Text style={styles.localText}>Local</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{readings.length}</Text>
                <Text style={styles.summaryLabel}>readings</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{openTasks}</Text>
                <Text style={styles.summaryLabel}>open tasks</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{Object.keys(latest).length}</Text>
                <Text style={styles.summaryLabel}>parameters</Text>
              </View>
            </View>
          </Card>

          {stability ? (
            <Card>
              <View style={styles.stabilityRow}>
                <View>
                  <Text style={styles.sectionLabel}>STABILITY SCORE</Text>
                  <View style={styles.scoreLine}>
                    <Text style={styles.scoreValue}>{stability.score ?? '—'}</Text>
                    <Text style={styles.scoreSuffix}>{stability.score === null ? '' : '/100'}</Text>
                  </View>
                  <Text style={styles.scoreLabel}>{stability.label}</Text>
                </View>
                <View style={styles.scoreDetails}>
                  <Text style={styles.scoreExplanation}>{stability.explanation}</Text>
                  <Pressable onPress={() => router.push('/targets')}><Text style={styles.link}>Adjust targets</Text></Pressable>
                </View>
              </View>
            </Card>
          ) : null}

          <View style={styles.actionGrid}>
            <Pressable onPress={() => router.push('/reading/new')} style={styles.quickAction}>
              <View style={styles.actionIcon}><Ionicons color={Brand.cyan} name="water" size={22} /></View>
              <Text style={styles.actionTitle}>Log water test</Text>
              <Text style={styles.actionBody}>Record a parameter reading</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/event/new')} style={styles.quickAction}>
              <View style={styles.actionIcon}><Ionicons color={Brand.cyan} name="add-circle" size={22} /></View>
              <Text style={styles.actionTitle}>Log activity</Text>
              <Text style={styles.actionBody}>Water change, feeding, dosing, or observation</Text>
            </Pressable>
          </View>

          {advisories.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Advisories</Text>
                <Text style={styles.advisoryCount}>{advisories.length} active</Text>
              </View>
              {advisories.slice(0, 2).map((advisory) => (
                <Pressable
                  key={advisory.parameter}
                  onPress={() => router.push({ pathname: '/analysis/advisory', params: { parameter: advisory.parameter } })}
                  style={[
                    styles.advisoryCard,
                    advisory.severity === 'attention' && styles.advisoryCardAttention,
                  ]}>
                  <View style={styles.advisoryIcon}>
                    <Ionicons
                      color={advisory.severity === 'attention' ? Brand.red : Brand.amber}
                      name="alert-circle-outline"
                      size={22}
                    />
                  </View>
                  <View style={styles.insightBody}>
                    <Text style={styles.insightTitle}>{advisory.title}</Text>
                    <Text style={styles.insightText}>{advisory.summary}</Text>
                    <Text style={styles.insightMeta}>{advisory.evidence.length} evidence point{advisory.evidence.length === 1 ? '' : 's'}</Text>
                  </View>
                  <Ionicons color={Brand.textFaint} name="chevron-forward" size={18} />
                </Pressable>
              ))}
            </>
          ) : null}

          {materialChanges.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What changed?</Text>
                <Text style={styles.insightCount}>{materialChanges.length} detected</Text>
              </View>
              {materialChanges.slice(0, 2).map((change) => (
                <Pressable
                  key={change.parameter}
                  onPress={() => router.push({ pathname: '/analysis/change', params: { parameter: change.parameter } })}
                  style={styles.insightCard}>
                  <View style={styles.insightIcon}>
                    <Ionicons color={Brand.cyan} name="git-compare-outline" size={21} />
                  </View>
                  <View style={styles.insightBody}>
                    <Text style={styles.insightTitle}>{parameterCatalog[change.parameter].label}</Text>
                    <Text style={styles.insightText}>{change.summary}</Text>
                    <Text style={styles.insightMeta}>
                      {change.context.length} recent contextual event{change.context.length === 1 ? '' : 's'} available
                    </Text>
                  </View>
                  <Ionicons color={Brand.textFaint} name="chevron-forward" size={18} />
                </Pressable>
              ))}
            </>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest parameters</Text>
            <Pressable onPress={() => router.push('/logbook')}><Text style={styles.link}>View timeline</Text></Pressable>
          </View>

          {Object.keys(latest).length === 0 ? (
            <EmptyState
              body="Your newest readings will appear here after your first water test."
              icon="analytics-outline"
              title="No readings yet"
            />
          ) : (
            <View style={styles.parameterGrid}>
              {(Object.keys(latest) as ParameterKey[]).slice(0, 6).map((key) => {
                const reading = latest[key]!;
                const previous = getPreviousReading(readings, reading);
                const delta = getDelta(reading, previous);
                const target = getEffectiveTargetRange(selectedAquarium.id, selectedAquarium.type, key, targetOverrides);
                const status = getRangeStatusForTarget(reading, target);
                const statusColor =
                  status === 'in_range' ? Brand.green :
                  status === 'unconfigured' ? Brand.textFaint :
                  Brand.amber;
                const trend = analyzeTrend(key, readings, target);
                return (
                  <Pressable
                    key={key}
                    disabled={!trend}
                    onPress={() => router.push({ pathname: '/analysis/trend', params: { parameter: key } })}
                    style={styles.parameterCard}>
                    <View style={styles.parameterTopRow}>
                      <Text style={styles.parameterLabel}>{parameterCatalog[key].label}</Text>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    </View>
                    <Text style={styles.parameterValue}>{reading.value} <Text style={styles.unit}>{reading.unit}</Text></Text>
                    <View style={styles.trendRow}>
                      <Text style={[styles.parameterTime, { flex: 1 }]}>{formatWhen(reading.recordedAt)}</Text>
                      {delta !== null ? (
                        <Text style={styles.delta}>
                          {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(parameterCatalog[key].decimals)}
                        </Text>
                      ) : null}
                    </View>
                    {target ? (
                      <Text style={styles.target}>
                        Target {target.min}–{target.max} {reading.unit}
                      </Text>
                    ) : (
                      <Text style={styles.target}>Custom target not set</Text>
                    )}
                    {trend ? (
                      <View style={styles.trendInsight}>
                        <Ionicons
                          color={trend.direction === 'steady' ? Brand.green : Brand.cyan}
                          name={trend.direction === 'rising' ? 'trending-up' : trend.direction === 'falling' ? 'trending-down' : 'remove'}
                          size={14}
                        />
                        <Text style={styles.trendInsightText}>
                          {trend.direction}{trend.persistence >= 2 ? ` · ${trend.persistence} consecutive out` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 58, height: 58, resizeMode: 'contain' },
  aquariumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  selectorWrap: { flex: 1, gap: 8 },
  sectionLabel: { color: Brand.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  chipActive: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  chipText: { color: Brand.textMuted, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: Brand.cyan },
  tankHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tankName: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  tankMeta: { color: Brand.textMuted, fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0D382F', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  localText: { color: Brand.green, fontSize: 11, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: Brand.text, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: Brand.textMuted, fontSize: 11, marginTop: 2 },
  divider: { height: 36, width: 1, backgroundColor: Brand.border },
  stabilityRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  scoreValue: { color: Brand.text, fontSize: 36, fontWeight: '900' },
  scoreSuffix: { color: Brand.textMuted, fontSize: 13, fontWeight: '700', marginLeft: 3 },
  scoreLabel: { color: Brand.cyan, fontSize: 12, fontWeight: '800', marginTop: 2 },
  scoreDetails: { flex: 1, gap: 8 },
  scoreExplanation: { color: Brand.textMuted, fontSize: 12, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, minHeight: 142, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 18, padding: 16 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  actionTitle: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  actionBody: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: Brand.text, fontSize: 19, fontWeight: '800' },
  insightCount: { color: Brand.cyan, fontSize: 11, fontWeight: '900' },
  advisoryCount: { color: Brand.amber, fontSize: 11, fontWeight: '900' },
  advisoryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2A2118', borderColor: '#6A4C22', borderWidth: 1, borderRadius: 17, padding: 14 },
  advisoryCardAttention: { backgroundColor: '#2C1719', borderColor: '#713338' },
  advisoryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#3A2816', alignItems: 'center', justifyContent: 'center' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 14 },
  insightIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  insightBody: { flex: 1 },
  insightTitle: { color: Brand.text, fontSize: 14, fontWeight: '800' },
  insightText: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  insightMeta: { color: Brand.textFaint, fontSize: 10, marginTop: 5 },
  link: { color: Brand.cyan, fontSize: 13, fontWeight: '800' },
  parameterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  parameterCard: { width: '48%', flexGrow: 1, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 15 },
  parameterTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  parameterLabel: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  parameterValue: { color: Brand.text, fontSize: 22, fontWeight: '900', marginTop: 7 },
  unit: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  parameterTime: { color: Brand.textFaint, fontSize: 11 },
  delta: { color: Brand.cyan, fontSize: 11, fontWeight: '800' },
  target: { color: Brand.textFaint, fontSize: 10, lineHeight: 14, marginTop: 6 },
  trendInsight: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  trendInsightText: { color: Brand.cyan, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
});
