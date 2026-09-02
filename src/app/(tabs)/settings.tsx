import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';

const roadmap = [
  { icon: 'phone-portrait-outline' as const, title: 'Standalone by design', body: 'Logging, maintenance, and insights work without aquarium hardware.' },
  { icon: 'cloud-offline-outline' as const, title: 'Offline first', body: 'Core records are stored locally and remain available without internet.' },
  { icon: 'sparkles-outline' as const, title: 'Future ecosystem integrations', body: 'Voice, shortcuts, routines, and optional cloud services arrive after the core experience.' },
  { icon: 'hardware-chip-outline' as const, title: 'Matter-ready future', body: 'BRMC integration and direct control remain reserved for active hardware production.' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { aquariums } = useAppData();

  return (
    <Screen subtitle="Account, aquariums, and product information" title="More">
      <Card>
        <View style={styles.brandRow}>
          <Image source={require('@/assets/brand/battlereef-logo-full.webp')} style={styles.wordmark} />
        </View>
        <View style={styles.planRow}>
          <View><Text style={styles.planLabel}>CURRENT PLAN</Text><Text style={styles.planName}>Basic</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>MVP</Text></View>
        </View>
        <Text style={styles.planBody}>Core aquarium records, water-test logging, and maintenance tools. No external-device control.</Text>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aquariums</Text>
        <Text style={styles.count}>{aquariums.length}</Text>
      </View>
      <Pressable onPress={() => router.push('/aquarium/new')} style={styles.menuRow}>
        <View style={styles.menuIcon}><Ionicons color={Brand.cyan} name="add" size={21} /></View>
        <View style={styles.menuText}><Text style={styles.menuTitle}>Add aquarium</Text><Text style={styles.menuBody}>Create another independent record</Text></View>
        <Ionicons color={Brand.textFaint} name="chevron-forward" size={19} />
      </Pressable>

      <Text style={styles.sectionTitle}>Architecture guardrails</Text>
      {roadmap.map((item) => (
        <View key={item.title} style={styles.menuRow}>
          <View style={styles.menuIcon}><Ionicons color={Brand.cyan} name={item.icon} size={21} /></View>
          <View style={styles.menuText}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuBody}>{item.body}</Text></View>
        </View>
      ))}

      <Text style={styles.version}>BattleReef Mobile · Foundation 0.1.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { alignItems: 'center', paddingVertical: 8 },
  wordmark: { width: 250, height: 92, resizeMode: 'contain' },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  planLabel: { color: Brand.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  planName: { color: Brand.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
  badge: { backgroundColor: Brand.cyanSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: Brand.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  planBody: { color: Brand.textMuted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  count: { color: Brand.cyan, fontSize: 13, fontWeight: '900' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuTitle: { color: Brand.text, fontSize: 14, fontWeight: '800' },
  menuBody: { color: Brand.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  version: { color: Brand.textFaint, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
