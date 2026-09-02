import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
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

export default function LogbookScreen() {
  const router = useRouter();
  const { loading, readings, selectedAquarium } = useAppData();

  return (
    <Screen
      action={selectedAquarium ? <IconButton icon="add" label="Log reading" onPress={() => router.push('/reading/new')} /> : undefined}
      subtitle={selectedAquarium ? `${selectedAquarium.name} · ${readings.length} reading${readings.length === 1 ? '' : 's'} · newest first` : 'Water parameters and observations'}
      title="History">
      {loading ? <LoadingState /> : null}
      {!loading && !selectedAquarium ? (
        <EmptyState
          action={<PrimaryButton label="Create aquarium" onPress={() => router.push('/aquarium/new')} />}
          body="Create an aquarium before adding water-test readings."
          icon="fish-outline"
          title="No aquarium selected"
        />
      ) : null}
      {selectedAquarium && readings.length === 0 ? (
        <EmptyState
          action={<PrimaryButton icon="add" label="Log first reading" onPress={() => router.push('/reading/new')} />}
          body="Build a reliable history one manual test at a time. Your data remains available offline."
          icon="water-outline"
          title="Start your water log"
        />
      ) : null}
      {readings.map((reading) => (
        <View key={reading.id} style={styles.row}>
          <View style={styles.icon}>
            <Ionicons color={Brand.cyan} name={parameterCatalog[reading.parameter].icon} size={20} />
          </View>
          <View style={styles.details}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{parameterCatalog[reading.parameter].label}</Text>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>{sourceLabels[reading.source]}</Text>
              </View>
            </View>
            <Text style={styles.time}>{formatWhen(reading.recordedAt)}{reading.note ? ` · ${reading.note}` : ''}</Text>
          </View>
          <Text style={styles.value}>{reading.value} <Text style={styles.unit}>{reading.unit}</Text></Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  label: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  sourceBadge: { backgroundColor: Brand.cyanSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  sourceText: { color: Brand.cyan, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  value: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  unit: { color: Brand.textMuted, fontSize: 11, fontWeight: '700' },
});
