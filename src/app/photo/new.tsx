import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { photoLightingProfiles, photoViewpoints, type PhotoLightingProfile, type PhotoViewpoint } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { deleteManagedMedia, importPhotoToManagedStorage } from '@/services/media-storage';

export default function NewPhotoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ livestockId?: string }>();
  const { addPhoto, livestock, photos, selectedAquarium } = useAppData();
  const [uri, setUri] = useState('');
  const [caption, setCaption] = useState('');
  const [linkedLivestockId, setLinkedLivestockId] = useState<string | null>(params.livestockId ?? null);
  const [saving, setSaving] = useState(false);
  const [guidedCapture, setGuidedCapture] = useState(true);
  const [viewpoint, setViewpoint] = useState<PhotoViewpoint>('front');
  const [lightingProfile, setLightingProfile] = useState<PhotoLightingProfile>('display');

  const priorSubjectPhoto = linkedLivestockId
    ? photos.find((photo) => photo.linkedLivestockId === linkedLivestockId && photo.mediaState !== 'missing')
    : photos.find((photo) => photo.linkedLivestockId === null && photo.mediaState !== 'missing');

  function repeatPriorConditions() {
    if (!priorSubjectPhoto) return;
    if (priorSubjectPhoto.viewpoint) setViewpoint(priorSubjectPhoto.viewpoint);
    if (priorSubjectPhoto.lightingProfile) setLightingProfile(priorSubjectPhoto.lightingProfile);
    setGuidedCapture(true);
  }

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
        viewpoint,
        lightingProfile,
        guidedCapture,
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

      <View style={styles.guidanceCard}>
        <View style={styles.guidanceHeader}>
          <View style={styles.guidanceIcon}><Text style={styles.guidanceIconText}>◎</Text></View>
          <View style={styles.guidanceCopy}>
            <Text style={styles.guidanceTitle}>Repeatable capture</Text>
            <Text style={styles.guidanceBody}>Match viewpoint and lighting between sessions. Keep the phone level, center the same subject, and avoid digital zoom when possible.</Text>
          </View>
        </View>
        <Pressable onPress={() => setGuidedCapture((value) => !value)} style={[styles.guideToggle, guidedCapture && styles.guideToggleActive]}>
          <Text style={[styles.guideToggleText, guidedCapture && styles.guideToggleTextActive]}>{guidedCapture ? 'Guided capture on' : 'Guided capture off'}</Text>
        </Pressable>
        {priorSubjectPhoto?.viewpoint || priorSubjectPhoto?.lightingProfile ? (
          <Pressable onPress={repeatPriorConditions} style={styles.repeatButton}>
            <Text style={styles.repeatText}>Repeat previous subject conditions</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.label}>Viewpoint</Text>
      <View style={styles.chips}>
        {photoViewpoints.map((item) => (
          <Pressable key={item} onPress={() => setViewpoint(item)} style={[styles.chip, viewpoint === item && styles.active]}>
            <Text style={[styles.chipText, viewpoint === item && styles.activeText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Lighting</Text>
      <View style={styles.chips}>
        {photoLightingProfiles.map((item) => (
          <Pressable key={item} onPress={() => setLightingProfile(item)} style={[styles.chip, lightingProfile === item && styles.active]}>
            <Text style={[styles.chipText, lightingProfile === item && styles.activeText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton icon="images-outline" label="Choose photo" onPress={() => void choosePhoto()} />
        <PrimaryButton icon="camera-outline" label="Take guided photo" onPress={() => void takePhoto()} />
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
  guidanceCard: { gap: 12, padding: 15, borderRadius: 17, backgroundColor: Brand.cyanSoft, borderWidth: 1, borderColor: Brand.border },
  guidanceHeader: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  guidanceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Brand.surface, alignItems: 'center', justifyContent: 'center' },
  guidanceIconText: { color: Brand.cyan, fontSize: 22, fontWeight: '900' },
  guidanceCopy: { flex: 1, gap: 3 },
  guidanceTitle: { color: Brand.text, fontSize: 14, fontWeight: '900' },
  guidanceBody: { color: Brand.textMuted, fontSize: 11, lineHeight: 17 },
  guideToggle: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  guideToggleActive: { borderColor: Brand.cyan },
  guideToggleText: { color: Brand.textMuted, fontSize: 11, fontWeight: '800' },
  guideToggleTextActive: { color: Brand.cyan },
  repeatButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: Brand.cyan },
  repeatText: { color: Brand.cyan, fontSize: 11, fontWeight: '900' },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  chipText: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  activeText: { color: Brand.cyan },
  note: { color: Brand.textFaint, fontSize: 11, lineHeight: 16 },
});
