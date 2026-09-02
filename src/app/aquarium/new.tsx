import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { aquariumTypes, type AquariumType } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

const typeLabels: Record<AquariumType, string> = {
  reef: 'Reef',
  saltwater: 'Saltwater',
  freshwater: 'Freshwater',
  pond: 'Pond',
};

export default function NewAquariumScreen() {
  const router = useRouter();
  const { addAquarium } = useAppData();
  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [type, setType] = useState<AquariumType>('reef');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedVolume = Number(volume);
  const valid = name.trim().length >= 2 && Number.isFinite(parsedVolume) && parsedVolume > 0;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addAquarium({ name, type, volumeGallons: parsedVolume });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the aquarium.');
      setSaving(false);
    }
  }

  return (
    <FormScreen intro="Create a local aquarium profile. Additional details, livestock, and equipment can be added in later MVP milestones.">
      <Field
        autoCapitalize="words"
        autoFocus
        label="Aquarium name"
        maxLength={60}
        onChangeText={setName}
        placeholder="Main reef"
        value={name}
      />
      <View style={styles.group}>
        <Text style={styles.label}>Aquarium type</Text>
        <View style={styles.options}>
          {aquariumTypes.map((item) => (
            <Pressable key={item} onPress={() => setType(item)} style={[styles.option, item === type && styles.optionActive]}>
              <Text style={[styles.optionText, item === type && styles.optionTextActive]}>{typeLabels[item]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Field
        hint="Enter the total system volume in U.S. gallons."
        keyboardType="decimal-pad"
        label="System volume"
        onChangeText={setVolume}
        placeholder="120"
        value={volume}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton disabled={!valid || saving} label={saving ? 'Creating…' : 'Create aquarium'} onPress={() => void save()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  optionActive: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  optionText: { color: Brand.textMuted, fontSize: 13, fontWeight: '700' },
  optionTextActive: { color: Brand.cyan },
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
});
