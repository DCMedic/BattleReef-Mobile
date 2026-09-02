import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { deleteManagedMedia, importPhotoToManagedStorage } from '@/services/media-storage';

export default function NewPhotoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ livestockId?: string }>();
  const { addPhoto, livestock, selectedAquarium } = useAppData();
  const [uri, setUri] = useState('');
  const [caption, setCaption] = useState('');
  const [linkedLivestockId, setLinkedLivestockId] = useState<string | null>(params.livestockId ?? null);
  const [saving, setSaving] = useState(false);

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (!result.canceled) setUri(result.assets[0]?.uri ?? '');
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to capture an aquarium photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled) setUri(result.assets[0]?.uri ?? '');
  }

  async function save() {
    if (!uri || !selectedAquarium || saving) return;
    setSaving(true);
    let managedUri = '';
    try {
      const managed = await importPhotoToManagedStorage(uri);
      managedUri = managed.uri;
      await addPhoto({
        uri: managed.uri,
        storageKey: managed.storageKey,
        mediaState: 'managed',
        caption,
        linkedLivestockId,
      });
      router.replace('/photos');
    } catch (error) {
      if (managedUri) await deleteManagedMedia(managedUri);
      Alert.alert('Unable to save photo', error instanceof Error ? error.message : 'Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen subtitle={selectedAquarium?.name ?? 'Aquarium'} title="Add photo">
      {uri ? <Image source={{ uri }} style={styles.preview} /> : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>Choose or capture an aquarium photo</Text></View>
      )}

      <View style={styles.actions}>
        <PrimaryButton icon="images-outline" label="Choose photo" onPress={() => void choosePhoto()} />
        <PrimaryButton icon="camera-outline" label="Take photo" onPress={() => void takePhoto()} />
      </View>

      <Field
        label="Caption (optional)"
        maxLength={240}
        multiline
        onChangeText={setCaption}
        placeholder="Full tank shot, coral growth, livestock observation…"
        value={caption}
      />

      {livestock.length > 0 ? (
        <>
          <Text style={styles.label}>Link to livestock (optional)</Text>
          <View style={styles.chips}>
            <Pressable onPress={() => setLinkedLivestockId(null)} style={[styles.chip, linkedLivestockId === null && styles.active]}>
              <Text style={[styles.chipText, linkedLivestockId === null && styles.activeText]}>Tank</Text>
            </Pressable>
            {livestock.filter((item) => item.status === 'active').map((item) => (
              <Pressable key={item.id} onPress={() => setLinkedLivestockId(item.id)} style={[styles.chip, linkedLivestockId === item.id && styles.active]}>
                <Text style={[styles.chipText, linkedLivestockId === item.id && styles.activeText]}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.note}>Photos are copied into BattleReef-managed local storage on this device. Cloud backup is not enabled in this Alpha.</Text>
      <PrimaryButton disabled={!uri || saving} label={saving ? 'Saving…' : 'Save to photo timeline'} onPress={() => void save()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 1.25, borderRadius: 18, backgroundColor: Brand.surfaceRaised },
  placeholder: { minHeight: 220, borderRadius: 18, borderWidth: 1, borderColor: Brand.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.surface },
  placeholderText: { color: Brand.textMuted, fontSize: 13 },
  actions: { gap: 10 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  chipText: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  activeText: { color: Brand.cyan },
  note: { color: Brand.textFaint, fontSize: 11, lineHeight: 16 },
});
