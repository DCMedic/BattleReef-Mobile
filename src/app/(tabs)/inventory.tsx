import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function InventoryScreen() {
  const router = useRouter();
  const { equipment, livestock, selectedAquarium } = useAppData();

  return (
    <Screen subtitle={selectedAquarium ? selectedAquarium.name : 'Tank assets and inhabitants'} title="Inventory">
      {!selectedAquarium ? (
        <EmptyState body="Create an aquarium before building its inventory." icon="cube-outline" title="No aquarium selected" />
      ) : (
        <>
          <View style={styles.actions}>
            <PrimaryButton icon="fish-outline" label="Add livestock" onPress={() => router.push('/livestock/new')} />
            <PrimaryButton icon="hardware-chip-outline" label="Add equipment" onPress={() => router.push('/equipment/new')} />
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Livestock</Text><Text style={styles.count}>{livestock.length}</Text></View>
          {livestock.length === 0 ? <EmptyState body="Track fish, coral, invertebrates, plants, and other inhabitants." icon="fish-outline" title="No livestock yet" /> :
            livestock.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.icon}><Ionicons color={Brand.cyan} name="fish-outline" size={21} /></View>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</Text>
                  <Text style={styles.meta}>{item.species || item.kind} · {item.status}{item.acquiredAt ? ` · acquired ${formatWhen(item.acquiredAt)}` : ''}</Text>
                </View>
              </View>
            ))}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Equipment</Text><Text style={styles.count}>{equipment.length}</Text></View>
          {equipment.length === 0 ? <EmptyState body="Track pumps, lights, heaters, filtration, monitors, and other equipment." icon="hardware-chip-outline" title="No equipment yet" /> :
            equipment.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.icon}><Ionicons color={Brand.cyan} name="hardware-chip-outline" size={21} /></View>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.meta}>{[item.manufacturer, item.model, item.kind, item.status].filter(Boolean).join(' · ')}</Text>
                  {item.warrantyEndsAt ? <Text style={styles.warranty}>Warranty ends {formatWhen(item.warrantyEndsAt)}</Text> : null}
                </View>
              </View>
            ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { color: Brand.text, fontSize: 19, fontWeight: '800' },
  count: { color: Brand.cyan, fontSize: 12, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  meta: { color: Brand.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3, textTransform: 'capitalize' },
  warranty: { color: Brand.amber, fontSize: 10, marginTop: 4 },
});
