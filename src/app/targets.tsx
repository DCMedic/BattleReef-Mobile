import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { getApplicableParameters, getDefaultTargetRange, getEffectiveTargetRange } from '@/domain/context';
import { parameterCatalog, type ParameterKey } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

export default function TargetsScreen() {
  const { selectedAquarium, targetOverrides, saveTargetOverride, resetTargetOverride } = useAppData();
  const parameters = selectedAquarium ? getApplicableParameters(selectedAquarium.type) : [];
  const [selected, setSelected] = useState<ParameterKey>(parameters[0] ?? 'temperature');
  const effectiveSelected = parameters.includes(selected) ? selected : (parameters[0] ?? 'temperature');
  const effective = selectedAquarium
    ? getEffectiveTargetRange(selectedAquarium.id, selectedAquarium.type, effectiveSelected, targetOverrides)
    : null;
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [message, setMessage] = useState('');

  if (!selectedAquarium) {
    return <FormScreen intro="Create an aquarium before configuring parameter targets."><Text style={styles.message}>No aquarium selected.</Text></FormScreen>;
  }

  const definition = parameterCatalog[effectiveSelected];
  const min = minText === '' ? effective?.min ?? NaN : Number(minText);
  const max = maxText === '' ? effective?.max ?? NaN : Number(maxText);
  const valid = Number.isFinite(min) && Number.isFinite(max) && min <= max;

  async function save() {
    setMessage('');
    try {
      await saveTargetOverride(effectiveSelected, min, max);
      setMinText('');
      setMaxText('');
      setMessage('Custom target saved.');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Could not save target.');
    }
  }

  async function reset() {
    await resetTargetOverride(effectiveSelected);
    setMinText('');
    setMaxText('');
    setMessage('Reset to the BattleReef default.');
  }

  const defaultTarget = getDefaultTargetRange(selectedAquarium.type, effectiveSelected);
  const customized = targetOverrides.some((item) => item.parameter === effectiveSelected);

  return (
    <FormScreen intro={`Customize targets for ${selectedAquarium.name}. Defaults are guidance and can be changed to match your husbandry plan.`}>
      <View style={styles.parameters}>
        {parameters.map((parameter) => (
          <Pressable
            key={parameter}
            onPress={() => { setSelected(parameter); setMinText(''); setMaxText(''); setMessage(''); }}
            style={[styles.chip, parameter === effectiveSelected && styles.chipActive]}>
            <Text style={[styles.chipText, parameter === effectiveSelected && styles.chipTextActive]}>
              {parameterCatalog[parameter].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.current}>
        Current target: {effective ? `${effective.min}–${effective.max} ${definition.unit}` : 'Not configured'}
        {customized ? ' · Custom' : ' · Default'}
      </Text>
      {defaultTarget ? (
        <Text style={styles.defaultText}>BattleReef default: {defaultTarget.min}–{defaultTarget.max} {definition.unit}</Text>
      ) : null}

      <View style={styles.row}>
        <View style={styles.field}><Field label="Minimum" keyboardType="decimal-pad" value={minText} onChangeText={setMinText} placeholder={String(effective?.min ?? '')} /></View>
        <View style={styles.field}><Field label="Maximum" keyboardType="decimal-pad" value={maxText} onChangeText={setMaxText} placeholder={String(effective?.max ?? '')} /></View>
      </View>

      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
      <PrimaryButton disabled={!valid} label="Save custom target" onPress={() => void save()} />
      {customized ? (
        <Pressable onPress={() => void reset()} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset to default</Text>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  parameters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  chipActive: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  chipText: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: Brand.cyan },
  current: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  defaultText: { color: Brand.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  message: { color: Brand.cyan, fontSize: 13, lineHeight: 18 },
  resetButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  resetText: { color: Brand.textMuted, fontSize: 13, fontWeight: '800' },
});
