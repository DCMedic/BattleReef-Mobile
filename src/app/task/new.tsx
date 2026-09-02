import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { taskRecurrences, type TaskRecurrence } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

export default function NewTaskScreen() {
  const router = useRouter();
  const { addTask, selectedAquarium } = useAppData();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [error, setError] = useState('');

  const parsedDue = dueDate.trim() ? new Date(`${dueDate.trim()}T12:00:00`) : null;
  const dueValid = !parsedDue || !Number.isNaN(parsedDue.getTime());
  const valid = Boolean(selectedAquarium) && title.trim().length >= 2 && dueValid && (recurrence === 'none' || Boolean(parsedDue));

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addTask({ title, dueAt: parsedDue?.toISOString() ?? null, recurrence });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the task.');
      setSaving(false);
    }
  }

  return (
    <FormScreen intro={`Add a maintenance item for ${selectedAquarium?.name ?? 'your aquarium'}. Due tasks can notify you locally even when BattleReef is offline.`}>
      <Field
        autoCapitalize="sentences"
        autoFocus
        label="Task"
        maxLength={100}
        onChangeText={setTitle}
        placeholder="20% water change"
        value={title}
      />
      <Field
        hint="Optional. Use YYYY-MM-DD, for example 2026-09-06."
        keyboardType="numbers-and-punctuation"
        label="Due date"
        maxLength={10}
        onChangeText={setDueDate}
        placeholder="YYYY-MM-DD"
        value={dueDate}
      />
      {!dueValid ? <Text accessibilityRole="alert" style={styles.error}>Enter a valid date in YYYY-MM-DD format.</Text> : null}

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.chips}>
        {taskRecurrences.map((item) => (
          <Pressable key={item} onPress={() => setRecurrence(item)} style={[styles.chip, recurrence === item && styles.active]}>
            <Text style={[styles.chipText, recurrence === item && styles.activeText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {recurrence !== 'none' && !parsedDue ? <Text style={styles.hint}>Recurring tasks require a due date.</Text> : null}
      <Text style={styles.hint}>BattleReef will request notification permission when the first future reminder is scheduled.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton disabled={!valid || saving} label={saving ? 'Saving…' : 'Add task'} onPress={() => void save()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  chipText: { color: Brand.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  activeText: { color: Brand.cyan },
  hint: { color: Brand.textFaint, fontSize: 11, lineHeight: 16 },
});
