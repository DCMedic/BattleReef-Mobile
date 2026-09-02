import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function PhotosScreen() {
  const router = useRouter();
  const { livestock, photos, selectedAquarium } = useAppData();

  return (
    <Screen
      action={selectedAquarium ? (
        <Pressable accessibilityLabel="Add photo" onPress={() => router.push('/photo/new')} style={styles.add}>
          <Ionicons color={Brand.cyan} name="add" size={24} />
        </Pressable>
      ) : undefined}
      subtitle={selectedAquarium ? `${selectedAquarium.name} · visual history` : 'Aquarium visual history'}
      title="Photos">
      {!selectedAquarium ? (
        <EmptyState body="Create an aquarium before building a photo timeline." icon="images-outline" title="No aquarium selected" />
      ) : photos.length === 0 ? (
        <EmptyState
          action={<PrimaryButton icon="camera-outline" label="Add first photo" onPress={() => router.push('/photo/new')} />}
          body="Build a visual record of the aquarium and optionally link photos to livestock."
          icon="images-outline"
          title="Start a photo timeline"
        />
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => {
            const linked = livestock.find((item) => item.id === photo.linkedLivestockId);
            return (
              <View key={photo.id} style={styles.card}>
                <Image source={{ uri: photo.uri }} style={styles.image} />
                <View style={styles.body}>
                  <Text style={styles.date}>{formatWhen(photo.capturedAt)}</Text>
                  {linked ? <Text style={styles.linked}>Linked to {linked.name}</Text> : null}
                  {photo.caption ? <Text numberOfLines={3} style={styles.caption}>{photo.caption}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 44, height: 44, borderRadius: 14, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', flexGrow: 1, maxWidth: 360, backgroundColor: Brand.surface, borderRadius: 17, borderWidth: 1, borderColor: Brand.border, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.15, backgroundColor: Brand.surfaceRaised },
  body: { padding: 11, gap: 4 },
  date: { color: Brand.text, fontSize: 12, fontWeight: '800' },
  linked: { color: Brand.cyan, fontSize: 10, fontWeight: '700' },
  caption: { color: Brand.textMuted, fontSize: 11, lineHeight: 16 },
});
