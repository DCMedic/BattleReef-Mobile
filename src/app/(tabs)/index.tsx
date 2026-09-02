import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { aquariums, loading, readings, selectedAquarium, selectAquarium, tasks } = useAppData();

  const latest = readings.reduce<Partial<Record<ParameterKey, (typeof readings)[number]>>>((result, reading) => {
    if (!result[reading.parameter]) result[reading.parameter] = reading;
    return result;
  }, {});
  const openTasks = tasks.filter((task) => !task.completedAt).length;

  return (
    <Screen
      action={<Image source={require('@/assets/brand/battlereef-mark.webp')} style={styles.logo} />}
      subtitle="Your aquarium, understood."
      title="Overview">
      {loading ? <LoadingState /> : null}

      {!loading && !selectedAquarium ? (
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

          <View style={styles.actionGrid}>
            <Pressable onPress={() => router.push('/reading/new')} style={styles.quickAction}>
              <View style={styles.actionIcon}><Ionicons color={Brand.cyan} name="water" size={22} /></View>
              <Text style={styles.actionTitle}>Log water test</Text>
              <Text style={styles.actionBody}>Record a parameter reading</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/task/new')} style={styles.quickAction}>
              <View style={styles.actionIcon}><Ionicons color={Brand.cyan} name="calendar" size={22} /></View>
              <Text style={styles.actionTitle}>Add maintenance</Text>
              <Text style={styles.actionBody}>Create a care task</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest parameters</Text>
            <Pressable onPress={() => router.push('/logbook')}><Text style={styles.link}>View logbook</Text></Pressable>
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
                return (
                  <View key={key} style={styles.parameterCard}>
                    <Text style={styles.parameterLabel}>{parameterCatalog[key].label}</Text>
                    <Text style={styles.parameterValue}>{reading.value} <Text style={styles.unit}>{reading.unit}</Text></Text>
                    <Text style={styles.parameterTime}>{formatWhen(reading.recordedAt)}</Text>
                  </View>
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
  actionGrid: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, minHeight: 142, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 18, padding: 16 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  actionTitle: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  actionBody: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: Brand.text, fontSize: 19, fontWeight: '800' },
  link: { color: Brand.cyan, fontSize: 13, fontWeight: '800' },
  parameterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  parameterCard: { width: '48%', flexGrow: 1, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 15 },
  parameterLabel: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  parameterValue: { color: Brand.text, fontSize: 22, fontWeight: '900', marginTop: 7 },
  unit: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  parameterTime: { color: Brand.textFaint, fontSize: 11, marginTop: 5 },
});
