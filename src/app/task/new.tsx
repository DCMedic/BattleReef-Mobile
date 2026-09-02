import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { FormScreen } from '@/components/app/form-screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';

export default function NewTaskScreen() {
  const router = useRouter();
  const { addTask, selectedAquarium } = useAppData();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedDue = dueDate.trim() ? new Date(`${dueDate.trim()}T12:00:00`) : null;
  const dueValid = !parsedDue || !Number.isNaN(parsedDue.getTime());
  const valid = Boolean(selectedAquarium) && title.trim().length >= 2 && dueValid;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addTask({ title, dueAt: parsedDue?.toISOString() ?? null });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the task.');
      setSaving(false);
    }
  }

  return (
    <FormScreen intro={`Add a maintenance item for ${selectedAquarium?.name ?? 'your aquarium'}. Notification scheduling will be added in the reminders milestone.`}>
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
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton disabled={!valid || saving} label={saving ? 'Saving…' : 'Add task'} onPress={() => void save()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: Brand.red, fontSize: 13, lineHeight: 18 },
});
