import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, EmptyState, Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { equipmentStatuses, type EquipmentStatus } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function EquipmentDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { addEquipmentService, equipment, setEquipmentStatus } = useAppData();
  const item = equipment.find((entry) => entry.id === params.id);
  const [serviceNote, setServiceNote] = useState('');
  const [message, setMessage] = useState('');

  if (!item) {
    return <Screen title="Equipment"><EmptyState body="This equipment record could not be found." icon="hardware-chip-outline" title="Record unavailable" /></Screen>;
  }

  async function addService() {
    setMessage('');
    try {
      await addEquipmentService(item, serviceNote);
      setServiceNote('');
      setMessage('Service event recorded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not record service.');
    }
  }

  return (
    <Screen subtitle={[item.manufacturer, item.model].filter(Boolean).join(' · ') || item.kind} title={item.name}>
      <Card>
        <Text style={styles.label}>STATUS</Text>
        <Text style={styles.status}>{item.status}</Text>
        {item.installedAt ? <Text style={styles.meta}>Installed {formatWhen(item.installedAt)}</Text> : null}
        {item.warrantyEndsAt ? <Text style={styles.warranty}>Warranty ends {formatWhen(item.warrantyEndsAt)}</Text> : null}
      </Card>

      <Text style={styles.section}>Lifecycle</Text>
      <View style={styles.options}>
        {equipmentStatuses.map((status) => (
          <Pressable
            key={status}
            disabled={status === item.status}
            onPress={() => void setEquipmentStatus(item, status as EquipmentStatus)}
            style={[styles.option, status === item.status && styles.active]}>
            <Text style={[styles.optionText, status === item.status && styles.activeText]}>{status}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Service history</Text>
      <Field
        label="Service note"
        maxLength={240}
        multiline
        onChangeText={setServiceNote}
        placeholder="Cleaned impeller, replaced tubing, calibrated probe…"
        value={serviceNote}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <PrimaryButton disabled={serviceNote.trim().length < 2} label="Record service" onPress={() => void addService()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: Brand.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  status: { color: Brand.text, fontSize: 26, fontWeight: '900', textTransform: 'capitalize', marginTop: 5 },
  meta: { color: Brand.textMuted, fontSize: 12, marginTop: 8 },
  warranty: { color: Brand.amber, fontSize: 11, marginTop: 5 },
  section: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  active: { backgroundColor: Brand.cyanSoft, borderColor: Brand.cyan },
  optionText: { color: Brand.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  activeText: { color: Brand.cyan },
  message: { color: Brand.cyan, fontSize: 12, lineHeight: 17 },
});
