import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { livestockStatuses, type LivestockStatus } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

export default function LivestockDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { livestock, setLivestockStatus } = useAppData();
  const item = livestock.find((entry) => entry.id === params.id);

  if (!item) {
    return <Screen title="Livestock"><EmptyState body="This livestock record could not be found." icon="fish-outline" title="Record unavailable" /></Screen>;
  }

  return (
    <Screen subtitle={item.species || item.kind} title={item.name}>
      <Card>
        <Text style={styles.label}>STATUS</Text>
        <Text style={styles.status}>{item.status}</Text>
        <Text style={styles.meta}>Quantity {item.quantity}{item.note ? ` · ${item.note}` : ''}</Text>
      </Card>

      <Text style={styles.section}>Lifecycle</Text>
      <View style={styles.options}>
        {livestockStatuses.map((status) => (
          <Pressable
            key={status}
            disabled={status === item.status}
            onPress={() => void setLivestockStatus(item, status as LivestockStatus)}
            style={[styles.option, status === item.status && styles.active]}>
            <Text style={[styles.optionText, status === item.status && styles.activeText]}>{status}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Done</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: Brand.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  status: { color: Brand.text, fontSize: 26, fontWeight: '900', textTransform: 'capitalize', marginTop: 5 },
  meta: { color: Brand.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  section: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  optionText: { color: Brand.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  activeText: { color: Brand.cyan },
  back: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { color: Brand.cyan, fontSize: 14, fontWeight: '800' },
});
