import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import type { PhotoRecord } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

function dayDifference(a: string, b: string) {
  const delta = Math.abs(Date.parse(b) - Date.parse(a));
  return Math.max(0, Math.round(delta / 86_400_000));
}

function PhotoPanel({ label, photo, livestockName }: { label: string; photo: PhotoRecord; livestockName?: string }) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelLabel}>{label}</Text>
        <Text style={styles.date}>{formatWhen(photo.capturedAt)}</Text>
      </View>
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.meta}>
        {livestockName ? <Text style={styles.linked}>{livestockName}</Text> : <Text style={styles.linked}>Whole aquarium</Text>}
        {photo.caption ? <Text style={styles.caption}>{photo.caption}</Text> : <Text style={styles.captionMuted}>No caption</Text>}
      </View>
    </View>
  );
}

export default function PhotoComparisonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ before?: string; after?: string }>();
  const { livestock, photos, selectedAquarium } = useAppData();

  const available = photos.filter((photo) => photo.mediaState !== 'missing');
  const before = available.find((photo) => photo.id === params.before);
  const after = available.find((photo) => photo.id === params.after);

  if (!selectedAquarium || available.length < 2) {
    return (
      <Screen subtitle="Visual progress" title="Compare photos">
        <EmptyState
          body="Add at least two available photos before creating a visual comparison."
          icon="git-compare-outline"
          title="Two photos required"
        />
      </Screen>
    );
  }

  if (!before || !after || before.id === after.id) {
    return (
      <Screen subtitle={selectedAquarium.name} title="Compare photos">
        <Text style={styles.instructions}>Choose two different photos. For the most meaningful comparison, select images of the same aquarium view or the same linked livestock.</Text>
        <Text style={styles.step}>1 · Earlier photo</Text>
        <View style={styles.choices}>
          {available.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => router.setParams({ before: photo.id, after: params.after })}
              style={[styles.choice, params.before === photo.id && styles.choiceActive]}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <Text style={styles.choiceDate}>{formatWhen(photo.capturedAt)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.step}>2 · Later photo</Text>
        <View style={styles.choices}>
          {available.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => router.setParams({ before: params.before, after: photo.id })}
              style={[styles.choice, params.after === photo.id && styles.choiceActive, params.before === photo.id && styles.choiceDisabled]}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <Text style={styles.choiceDate}>{formatWhen(photo.capturedAt)}</Text>
            </Pressable>
          ))}
        </View>
        {before && after && before.id === after.id ? <Text style={styles.warning}>Select two different photos.</Text> : null}
      </Screen>
    );
  }

  const ordered = [before, after].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  const earlier = ordered[0];
  const later = ordered[1];
  const days = dayDifference(earlier.capturedAt, later.capturedAt);
  const earlierLivestock = livestock.find((item) => item.id === earlier.linkedLivestockId);
  const laterLivestock = livestock.find((item) => item.id === later.linkedLivestockId);
  const sameSubject = earlier.linkedLivestockId === later.linkedLivestockId;
  const subjectLabel = sameSubject
    ? earlierLivestock?.name ?? 'Whole aquarium'
    : 'Different subjects';

  return (
    <Screen
      action={<Pressable accessibilityLabel="Change comparison" onPress={() => router.setParams({ before: undefined, after: undefined })} style={styles.change}><Ionicons color={Brand.cyan} name="swap-horizontal" size={22} /></Pressable>}
      subtitle={selectedAquarium.name}
      title="Visual comparison">
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{days}</Text>
        <Text style={styles.summaryUnit}>{days === 1 ? 'day apart' : 'days apart'}</Text>
        <Text style={styles.subject}>{subjectLabel}</Text>
      </View>
      {!sameSubject ? <View style={styles.caution}><Ionicons color={Brand.amber} name="warning-outline" size={18} /><Text style={styles.cautionText}>These photos are linked to different subjects, so visual change may not represent true progress.</Text></View> : null}
      <View style={styles.compare}>
        <PhotoPanel label="BEFORE" photo={earlier} livestockName={earlierLivestock?.name} />
        <PhotoPanel label="AFTER" photo={later} livestockName={laterLivestock?.name} />
      </View>
      <View style={styles.foundation}>
        <Ionicons color={Brand.cyan} name="analytics-outline" size={21} />
        <View style={styles.foundationText}>
          <Text style={styles.foundationTitle}>Visual baseline established</Text>
          <Text style={styles.foundationBody}>This comparison is observational only. Future analysis can add alignment, region tracking, and measured growth without changing the underlying photo records.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  instructions: { color: Brand.textMuted, fontSize: 13, lineHeight: 19 },
  step: { color: Brand.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { width: 104, padding: 6, borderRadius: 13, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  choiceActive: { borderColor: Brand.cyan, backgroundColor: Brand.cyanSoft },
  choiceDisabled: { opacity: 0.4 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 9, backgroundColor: Brand.surfaceRaised },
  choiceDate: { color: Brand.textMuted, fontSize: 9, fontWeight: '700', marginTop: 5 },
  warning: { color: Brand.amber, fontSize: 12, fontWeight: '800' },
  change: { width: 44, height: 44, borderRadius: 14, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  summary: { alignItems: 'center', paddingVertical: 10 },
  summaryValue: { color: Brand.cyan, fontSize: 34, fontWeight: '900' },
  summaryUnit: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  subject: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  caution: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Brand.amber, backgroundColor: Brand.surface, alignItems: 'center' },
  cautionText: { color: Brand.amber, fontSize: 11, lineHeight: 16, flex: 1 },
  compare: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  panel: { flex: 1, minWidth: 260, backgroundColor: Brand.surface, borderRadius: 18, borderWidth: 1, borderColor: Brand.border, overflow: 'hidden' },
  panelHeader: { padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelLabel: { color: Brand.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  date: { color: Brand.textMuted, fontSize: 10, fontWeight: '700' },
  image: { width: '100%', aspectRatio: 1.1, backgroundColor: Brand.surfaceRaised },
  meta: { padding: 12, gap: 5 },
  linked: { color: Brand.text, fontSize: 12, fontWeight: '800' },
  caption: { color: Brand.textMuted, fontSize: 11, lineHeight: 16 },
  captionMuted: { color: Brand.textFaint, fontSize: 11, fontStyle: 'italic' },
  foundation: { flexDirection: 'row', gap: 11, padding: 15, borderRadius: 16, backgroundColor: Brand.cyanSoft, borderWidth: 1, borderColor: Brand.border },
  foundationText: { flex: 1, gap: 3 },
  foundationTitle: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  foundationBody: { color: Brand.textMuted, fontSize: 11, lineHeight: 17 },
});
