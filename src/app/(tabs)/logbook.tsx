import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { getRangeStatus } from '@/domain/context';
import { parameterCatalog } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

const sourceLabels = {
  manual_user: 'Manual',
  photo_interpreted: 'Photo',
  imported: 'Imported',
  calculated: 'Calculated',
  brmc_telemetry: 'BRMC',
} as const;

type TimelineItem =
  | { kind: 'reading'; at: string; id: string; reading: ReturnType<typeof useAppData>['readings'][number] }
  | { kind: 'task-created'; at: string; id: string; title: string }
  | { kind: 'task-completed'; at: string; id: string; title: string };

export default function LogbookScreen() {
  const router = useRouter();
  const { loading, readings, selectedAquarium, tasks } = useAppData();

  const timeline: TimelineItem[] = [
    ...readings.map((reading) => ({ kind: 'reading' as const, at: reading.recordedAt, id: reading.id, reading })),
    ...tasks.map((task) => ({ kind: 'task-created' as const, at: task.createdAt, id: `${task.id}-created`, title: task.title })),
    ...tasks
      .filter((task) => task.completedAt)
      .map((task) => ({ kind: 'task-completed' as const, at: task.completedAt!, id: `${task.id}-completed`, title: task.title })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Screen
      action={selectedAquarium ? <IconButton icon="add" label="Log reading" onPress={() => router.push('/reading/new')} /> : undefined}
      subtitle={selectedAquarium ? `${selectedAquarium.name} · newest first` : 'Measurements and care activity'}
      title="Timeline">
      {loading ? <LoadingState /> : null}
      {!loading && !selectedAquarium ? (
        <EmptyState
          action={<PrimaryButton label="Create aquarium" onPress={() => router.push('/aquarium/new')} />}
          body="Create an aquarium before building its timeline."
          icon="fish-outline"
          title="No aquarium selected"
        />
      ) : null}
      {selectedAquarium && timeline.length === 0 ? (
        <EmptyState
          action={<PrimaryButton icon="add" label="Log first reading" onPress={() => router.push('/reading/new')} />}
          body="Measurements and maintenance activity will build a chronological history here."
          icon="time-outline"
          title="Start the aquarium timeline"
        />
      ) : null}

      {selectedAquarium ? timeline.map((item) => {
        if (item.kind === 'reading') {
          const reading = item.reading;
          const status = getRangeStatus(selectedAquarium.type, reading);
          const statusColor =
            status === 'in_range' ? Brand.green :
            status === 'unconfigured' ? Brand.textFaint :
            Brand.amber;
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.icon}>
                <Ionicons color={Brand.cyan} name={parameterCatalog[reading.parameter].icon} size={20} />
              </View>
              <View style={styles.details}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{parameterCatalog[reading.parameter].label}</Text>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceText}>{sourceLabels[reading.source]}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                </View>
                <Text style={styles.time}>{formatWhen(reading.recordedAt)}{reading.note ? ` · ${reading.note}` : ''}</Text>
              </View>
              <Text style={styles.value}>{reading.value} <Text style={styles.unit}>{reading.unit}</Text></Text>
            </View>
          );
        }

        const completed = item.kind === 'task-completed';
        return (
          <View key={item.id} style={styles.row}>
            <View style={[styles.icon, completed && styles.completedIcon]}>
              <Ionicons color={completed ? Brand.green : Brand.cyan} name={completed ? 'checkmark-circle' : 'calendar-outline'} size={20} />
            </View>
            <View style={styles.details}>
              <Text style={styles.label}>{completed ? 'Maintenance completed' : 'Maintenance scheduled'}</Text>
              <Text style={styles.time}>{formatWhen(item.at)} · {item.title}</Text>
            </View>
          </View>
        );
      }) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  completedIcon: { backgroundColor: '#0D382F' },
  details: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  label: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  sourceBadge: { backgroundColor: Brand.cyanSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  sourceText: { color: Brand.cyan, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  time: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  value: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  unit: { color: Brand.textMuted, fontSize: 11, fontWeight: '700' },
});
