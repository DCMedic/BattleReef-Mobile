import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { formatDueDate } from '@/utils/format';

export default function TasksScreen() {
  const router = useRouter();
  const { loading, selectedAquarium, tasks, toggleTask } = useAppData();

  return (
    <Screen
      action={selectedAquarium ? <IconButton icon="add" label="Add task" onPress={() => router.push('/task/new')} /> : undefined}
      subtitle={selectedAquarium ? `Maintenance for ${selectedAquarium.name}` : 'Plan consistent aquarium care'}
      title="Tasks">
      {loading ? <LoadingState /> : null}
      {!loading && !selectedAquarium ? (
        <EmptyState
          action={<PrimaryButton label="Create aquarium" onPress={() => router.push('/aquarium/new')} />}
          body="Create an aquarium before scheduling maintenance."
          icon="fish-outline"
          title="No aquarium selected"
        />
      ) : null}
      {selectedAquarium && tasks.length === 0 ? (
        <EmptyState
          action={<PrimaryButton icon="add" label="Add first task" onPress={() => router.push('/task/new')} />}
          body="Add water changes, filter service, dosing checks, and other recurring care items."
          icon="calendar-outline"
          title="Your maintenance list is clear"
        />
      ) : null}
      {tasks.map((task) => {
        const completed = Boolean(task.completedAt);
        return (
          <Pressable key={task.id} onPress={() => void toggleTask(task)} style={[styles.row, completed && styles.completedRow]}>
            <View style={[styles.check, completed && styles.checked]}>
              {completed ? <Ionicons color={Brand.navy} name="checkmark" size={18} /> : null}
            </View>
            <View style={styles.details}>
              <Text style={[styles.title, completed && styles.completedText]}>{task.title}</Text>
              <Text style={styles.due}>{completed ? 'Completed' : formatDueDate(task.dueAt)}</Text>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 17, padding: 15 },
  completedRow: { opacity: 0.62 },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: Brand.cyan, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Brand.green, borderColor: Brand.green },
  details: { flex: 1 },
  title: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  completedText: { textDecorationLine: 'line-through' },
  due: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
});
