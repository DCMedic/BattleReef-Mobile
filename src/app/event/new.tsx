import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { husbandryEventKinds, type HusbandryEventKind } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

const labels: Record<HusbandryEventKind, string> = {
  water_change: 'Water change',
  feeding: 'Feeding',
  dosing: 'Dosing',
  observation: 'Observation',
};

export default function NewHusbandryEventScreen() {
  const router = useRouter();
  const { addHusbandryEvent, selectedAquarium } = useAppData();
  const [kind, setKind] = useState<HusbandryEventKind>('water_change');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('gal');
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedAmount = amount.trim() === '' ? null : Number(amount);

  async function save() {
    if (!selectedAquarium || saving) return;
    setSaving(true);
    setError('');
    try {
      await addHusbandryEvent({
        kind,
        amount: parsedAmount,
        unit: kind === 'water_change' ? unit : (parsedAmount === null ? null : unit.trim() || null),
        subject: subject.trim() || null,
        note: note.trim() || null,
      });
      router.replace('/logbook');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save activity.');
      setSaving(false);
    }
  }

  return (
    <FormScreen intro={`Add husbandry context to ${selectedAquarium?.name ?? 'your aquarium'}. These records help BattleReef explain changes over time.`}>
      <View style={styles.group}>
        <Text style={styles.label}>Activity type</Text>
        <View style={styles.options}>
          {husbandryEventKinds.map((item) => (
            <Pressable
              key={item}
              onPress={() => { setKind(item); setAmount(''); setSubject(''); setNote(''); setUnit(item === 'water_change' ? 'gal' : ''); }}
              style={[styles.option, kind === item && styles.optionActive]}>
              <Text style={[styles.optionText, kind === item && styles.optionTextActive]}>{labels[item]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {kind === 'water_change' ? (
        <>
          <Field label="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="20" />
          <View style={styles.options}>
            {['gal', '%'].map((item) => (
              <Pressable key={item} onPress={() => setUnit(item)} style={[styles.option, unit === item && styles.optionActive]}>
                <Text style={[styles.optionText, unit === item && styles.optionTextActive]}>{item === 'gal' ? 'Gallons' : 'Percent'}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {kind === 'feeding' ? (
        <>
          <Field label="Food" value={subject} onChangeText={setSubject} placeholder="Frozen mysis" maxLength={100} />
          <Field label="Amount (optional)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="1" />
          <Field label="Unit (optional)" value={unit} onChangeText={setUnit} placeholder="cube, pinch, g" maxLength={20} />
        </>
      ) : null}

      {kind === 'dosing' ? (
        <>
          <Field label="Additive" value={subject} onChangeText={setSubject} placeholder="Alkalinity solution" maxLength={100} />
          <Field label="Amount (optional)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="10" />
          <Field label="Unit (optional)" value={unit} onChangeText={setUnit} placeholder="mL" maxLength={20} />
        </>
      ) : null}

      <Field
        label={kind === 'observation' ? 'Observation' : 'Note (optional)'}
        multiline
        maxLength={240}
        value={note}
        onChangeText={setNote}
        placeholder={kind === 'observation' ? 'Coral polyp extension improved after lights ramped up.' : 'Optional context'}
        style={styles.note}
      />

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton disabled={!selectedAquarium || saving} label={saving ? 'Saving…' : 'Save to timeline'} onPress={() => void save()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  optionActive: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  optionText: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  optionTextActive: { color: Brand.cyan },
  note: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
});
