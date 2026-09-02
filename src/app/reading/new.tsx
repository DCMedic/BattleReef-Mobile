import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { getApplicableParameters, getEffectiveTargetRange } from '@/domain/context';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { validateReading } from '@/domain/validation';
import { useAppData } from '@/providers/app-data-provider';

export default function NewReadingScreen() {
  const router = useRouter();
  const { addReading, selectedAquarium, targetOverrides } = useAppData();
  const parameters = useMemo(
    () => selectedAquarium
      ? getApplicableParameters(selectedAquarium.type)
      : (Object.keys(parameterCatalog) as ParameterKey[]),
    [selectedAquarium],
  );
  const [parameter, setParameter] = useState<ParameterKey>(parameters[0] ?? 'temperature');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedParameter = parameters.includes(parameter)
    ? parameter
    : (parameters[0] ?? 'temperature');

  const parsedValue = Number(value);
  const draft = { parameter: selectedParameter, value: parsedValue, note };
  const validation = validateReading(draft);
  const valid = Boolean(selectedAquarium) && value.trim() !== '' && validation.valid;
  const definition = parameterCatalog[selectedParameter];
  const target = selectedAquarium ? getEffectiveTargetRange(selectedAquarium.id, selectedAquarium.type, selectedParameter, targetOverrides) : null;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addReading(draft);
      router.replace('/logbook');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the reading.');
      setSaving(false);
    }
  }

  const inlineError = value.trim() !== '' && !validation.valid ? validation.message : '';

  return (
    <FormScreen intro={`Record a manual test for ${selectedAquarium?.name ?? 'your aquarium'}. Parameter choices adapt to this aquarium type.`}>
      <View style={styles.group}>
        <Text style={styles.label}>Parameter</Text>
        <View style={styles.grid}>
          {parameters.map((key) => {
            const selected = key === selectedParameter;
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
        hint={`Supported entry range: ${definition.hardMin}–${definition.hardMax} ${definition.unit}`}
        autoFocus={false}
        keyboardType="decimal-pad"
        label={`Value (${definition.unit})`}
        onChangeText={setValue}
        placeholder="0.0"
        value={value}
      />
      {target ? (
        <Text style={styles.targetText}>
          Typical target for this aquarium: {target.min}–{target.max} {definition.unit}
        </Text>
      ) : null}
      {inlineError ? <Text accessibilityRole="alert" style={styles.error}>{inlineError}</Text> : null}
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
      <View style={styles.provenance}>
        <Ionicons color={Brand.green} name="person-circle-outline" size={18} />
        <Text style={styles.provenanceText}>Source: Manual entry · Confirmed by you</Text>
      </View>
      <PrimaryButton disabled={!valid || saving} label={saving ? 'Saving…' : 'Save & view timeline'} onPress={() => void save()} />
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
  targetText: { color: Brand.cyan, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  noteInput: { minHeight: 94, paddingTop: 14, textAlignVertical: 'top' },
  provenance: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#0D382F', borderRadius: 12, padding: 12 },
  provenanceText: { color: Brand.green, fontSize: 12, fontWeight: '700', flex: 1 },
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
});
