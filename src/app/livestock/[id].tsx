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
  const { livestock, photos, setLivestockStatus } = useAppData();
  const item = livestock.find((entry) => entry.id === params.id);
  const photoCount = photos.filter((photo) => photo.linkedLivestockId === params.id).length;

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

      <Pressable onPress={() => router.push({ pathname: '/photo/series', params: { livestockId: item.id } })} style={styles.visualHistory}>
        <View style={styles.visualIcon}><Text style={styles.visualCount}>{photoCount}</Text></View>
        <View style={styles.visualText}>
          <Text style={styles.visualTitle}>Visual history</Text>
          <Text style={styles.visualBody}>{photoCount === 0 ? 'Start a longitudinal photo series' : `${photoCount} linked ${photoCount === 1 ? 'photo' : 'photos'}`}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

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
  visualHistory: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: Brand.cyanSoft, borderWidth: 1, borderColor: Brand.border },
  visualIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.surface, alignItems: 'center', justifyContent: 'center' },
  visualCount: { color: Brand.cyan, fontSize: 17, fontWeight: '900' },
  visualText: { flex: 1, gap: 2 },
  visualTitle: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  visualBody: { color: Brand.textMuted, fontSize: 11 },
  chevron: { color: Brand.textFaint, fontSize: 25 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  optionText: { color: Brand.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  activeText: { color: Brand.cyan },
  back: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { color: Brand.cyan, fontSize: 14, fontWeight: '800' },
});
