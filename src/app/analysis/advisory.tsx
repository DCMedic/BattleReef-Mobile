import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { buildAdvisory } from '@/domain/advisories';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

const severityLabels = {
  info: 'Monitor',
  watch: 'Watch',
  attention: 'Needs attention',
} as const;

export default function AdvisoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ parameter?: string }>();
  const { readings, selectedAquarium, targetOverrides } = useAppData();
  const parameter = params.parameter as ParameterKey | undefined;
  const advisory = selectedAquarium && parameter
    ? buildAdvisory(selectedAquarium, parameter, readings, targetOverrides)
    : null;

  return (
    <Screen subtitle="Evidence-based aquarium guidance" title="Advisory">
      {!advisory ? (
        <EmptyState
          body="BattleReef does not currently have enough evidence for an advisory on this parameter."
          icon="notifications-outline"
          title="No active advisory"
        />
      ) : (
        <>
          <Card>
            <View style={styles.header}>
              <View style={styles.badge}>
                <Ionicons color={advisory.severity === 'attention' ? Brand.red : Brand.amber} name="alert-circle-outline" size={18} />
                <Text style={styles.badgeText}>{severityLabels[advisory.severity]}</Text>
              </View>
              <Text style={styles.parameter}>{parameterCatalog[advisory.parameter].label}</Text>
            </View>
            <Text style={styles.title}>{advisory.title}</Text>
            <Text style={styles.summary}>{advisory.summary}</Text>
          </Card>

          <Text style={styles.sectionTitle}>Why BattleReef surfaced this</Text>
          {advisory.evidence.map((item) => (
            <View key={item} style={styles.evidenceRow}>
              <Ionicons color={Brand.cyan} name="checkmark-circle-outline" size={19} />
              <Text style={styles.evidenceText}>{item}</Text>
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push({ pathname: '/analysis/change', params: { parameter: advisory.parameter } })}
              style={styles.action}>
              <Ionicons color={Brand.cyan} name="git-compare-outline" size={19} />
              <Text style={styles.actionText}>Review what changed</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/analysis/trend', params: { parameter: advisory.parameter } })}
              style={styles.action}>
              <Ionicons color={Brand.cyan} name="trending-up-outline" size={19} />
              <Text style={styles.actionText}>Review trend</Text>
            </Pressable>
          </View>

          <Card>
            <Text style={styles.note}>
              BattleReef advisories are conservative decision support. Confirm unusual measurements and consider the aquarium's full context before changing husbandry.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3A2816', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: Brand.amber, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  parameter: { color: Brand.textMuted, fontSize: 12, fontWeight: '800' },
  title: { color: Brand.text, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 14 },
  summary: { color: Brand.textMuted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 15, padding: 13 },
  evidenceText: { color: Brand.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
  actions: { gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderColor: Brand.border, borderWidth: 1, backgroundColor: Brand.surface },
  actionText: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  note: { color: Brand.textMuted, fontSize: 12, lineHeight: 18 },
});
