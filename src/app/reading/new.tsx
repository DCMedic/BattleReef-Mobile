import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

const parameters = Object.keys(parameterCatalog) as ParameterKey[];

export default function NewReadingScreen() {
  const router = useRouter();
  const { addReading, selectedAquarium } = useAppData();
  const [parameter, setParameter] = useState<ParameterKey>('temperature');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedValue = Number(value);
  const valid = Boolean(selectedAquarium) && value.trim() !== '' && Number.isFinite(parsedValue);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addReading({ parameter, value: parsedValue, note });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the reading.');
      setSaving(false);
    }
  }

  return (
    <FormScreen intro={`Record a manual test for ${selectedAquarium?.name ?? 'your aquarium'}. Values are stored locally and remain available offline.`}>
      <View style={styles.group}>
        <Text style={styles.label}>Parameter</Text>
        <View style={styles.grid}>
          {parameters.map((key) => {
            const selected = key === parameter;
            const item = parameterCatalog[key];
            return (
              <Pressable key={key} onPress={() => { setParameter(key); setValue(''); }} style={[styles.parameter, selected && styles.parameterActive]}>
                <Ionicons color={selected ? Brand.cyan : Brand.textMuted} name={item.icon} size={20} />
                <Text style={[styles.parameterText, selected && styles.parameterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Field
        autoFocus={false}
        keyboardType="decimal-pad"
        label={`Value (${parameterCatalog[parameter].unit})`}
        onChangeText={setValue}
        placeholder="0.0"
        value={value}
      />
      <Field
        label="Note (optional)"
        maxLength={240}
        multiline
        onChangeText={setNote}
        placeholder="Test method, observation, or context"
        style={styles.noteInput}
        value={note}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton disabled={!valid || saving} label={saving ? 'Saving…' : 'Save reading'} onPress={() => void save()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parameter: { width: '31%', minWidth: 98, flexGrow: 1, minHeight: 74, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, alignItems: 'center', justifyContent: 'center', gap: 7 },
  parameterActive: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  parameterText: { color: Brand.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  parameterTextActive: { color: Brand.cyan },
  noteInput: { minHeight: 94, paddingTop: 14, textAlignVertical: 'top' },
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
});
