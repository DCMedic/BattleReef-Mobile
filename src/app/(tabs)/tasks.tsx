import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, IconButton, LoadingState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { formatDueDate } from '@/utils/format';
import { getTaskDueState } from '@/services/task-reminders';

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
        const dueState = getTaskDueState(task);
        const dueColor = dueState === 'overdue' ? Brand.red : dueState === 'due_today' ? Brand.amber : Brand.textMuted;
        return (
          <Pressable
            accessibilityHint={completed ? 'Reopens this maintenance task when supported.' : 'Marks this maintenance task complete.'}
            accessibilityLabel={`${task.title}. ${completed ? 'Completed' : dueState === 'overdue' ? 'Overdue' : dueState === 'due_today' ? 'Due today' : formatDueDate(task.dueAt)}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            key={task.id}
            onPress={() => void toggleTask(task)}
            style={[styles.row, completed && styles.completedRow, dueState === 'overdue' && styles.overdueRow]}>
            <View style={[styles.check, completed && styles.checked, dueState === 'overdue' && styles.overdueCheck]}>
              {completed ? <Ionicons color={Brand.navy} name="checkmark" size={18} /> : null}
            </View>
            <View style={styles.details}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, completed && styles.completedText]}>{task.title}</Text>
                {task.recurrence !== 'none' ? (
                  <View style={styles.repeatBadge}><Ionicons color={Brand.cyan} name="repeat" size={12} /><Text style={styles.repeatText}>{task.recurrence}</Text></View>
                ) : null}
              </View>
              <Text style={[styles.due, { color: dueColor }]}>
                {completed ? 'Completed' : dueState === 'overdue' ? `Overdue · ${formatDueDate(task.dueAt)}` : dueState === 'due_today' ? 'Due today' : formatDueDate(task.dueAt)}
              </Text>
              {!completed && task.notificationId ? <Text style={styles.reminder}>Local reminder scheduled</Text> : null}
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
  overdueRow: { borderColor: '#713338' },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: Brand.cyan, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Brand.green, borderColor: Brand.green },
  overdueCheck: { borderColor: Brand.red },
  details: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  repeatBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Brand.cyanSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  repeatText: { color: Brand.cyan, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  completedText: { textDecorationLine: 'line-through' },
  due: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  reminder: { color: Brand.green, fontSize: 10, fontWeight: '800', marginTop: 3 },
});
