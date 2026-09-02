import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { Card, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { parseAndValidateBackup, previewBackup, type RestorePreview } from '@/services/data-restore';
import type { BattleReefBackup } from '@/services/data-export';

async function readPickedFile(uri: string) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Could not read the selected backup file.');
    return response.text();
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export default function RestoreBackupScreen() {
  const router = useRouter();
  const { restoreBackupArchive } = useAppData();
  const [backup, setBackup] = useState<BattleReefBackup | null>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [filename, setFilename] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [choosing, setChoosing] = useState(false);

  async function chooseBackup() {
    if (choosing || restoring) return;
    setChoosing(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const raw = await readPickedFile(asset.uri);
      const parsed = parseAndValidateBackup(raw);
      setBackup(parsed);
      setPreview(previewBackup(parsed));
      setFilename(asset.name);
    } catch (caught) {
      setBackup(null);
      setPreview(null);
      setFilename('');
      Alert.alert('Backup rejected', caught instanceof Error ? caught.message : 'This backup could not be validated.');
    } finally {
      setChoosing(false);
    }
  }

  async function restore() {
    if (!backup || !preview || restoring) return;

    Alert.alert(
      'Restore as a new aquarium?',
      `BattleReef will import "${preview.aquariumName}" as a separate restored aquarium. Existing aquariums will not be overwritten.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            setRestoring(true);
            void restoreBackupArchive(backup)
              .then(() => {
                Alert.alert('Restore complete', 'The restored aquarium is now active.');
                router.replace('/');
              })
              .catch((caught) => {
                Alert.alert('Restore failed', caught instanceof Error ? caught.message : 'No data was restored.');
              })
              .finally(() => setRestoring(false));
          },
        },
      ],
    );
  }

  const countRows = preview ? [
    ['Water readings', preview.counts.readings],
    ['Maintenance tasks', preview.counts.tasks],
    ['Husbandry events', preview.counts.husbandryEvents],
    ['Livestock', preview.counts.livestock],
    ['Equipment', preview.counts.equipment],
    ['Inventory history', preview.counts.inventoryEvents],
    ['Custom targets', preview.counts.targetOverrides],
    ['Photo records', preview.counts.photos],
  ] as const : [];

  return (
    <Screen subtitle="Validate before importing" title="Restore backup">
      <Card>
        <Text style={styles.intro}>
          BattleReef validates archive identity and schema before touching the database. Restores are imported as new aquariums in a single transaction.
        </Text>
        <PrimaryButton disabled={choosing || restoring} icon="folder-open-outline" label={choosing ? 'Reading backup…' : 'Choose BattleReef backup'} onPress={() => void chooseBackup()} />
      </Card>

      {preview ? (
        <>
          <Card>
            <Text style={styles.eyebrow}>VALIDATED BACKUP</Text>
            <Text style={styles.name}>{preview.aquariumName}</Text>
            <Text style={styles.meta}>{filename}</Text>
            <Text style={styles.meta}>Schema v{preview.schemaVersion} · exported {new Date(preview.exportedAt).toLocaleString()}</Text>
          </Card>

          <View style={styles.counts}>
            {countRows.map(([label, count]) => (
              <View key={label} style={styles.countRow}>
                <Text style={styles.countLabel}>{label}</Text>
                <Text style={styles.countValue}>{count}</Text>
              </View>
            ))}
          </View>

          <Card>
            <Text style={styles.eyebrow}>MEDIA PAYLOAD</Text>
            <Text style={styles.name}>{preview.mediaFiles} embedded image{preview.mediaFiles === 1 ? '' : 's'}</Text>
            <Text style={styles.meta}>{(preview.mediaBytes / (1024 * 1024)).toFixed(1)} MB of restorable photo data</Text>
          </Card>

          {preview.warnings.map((warning) => (
            <View key={warning} style={styles.warning}>
              <Text style={styles.warningTitle}>Restore note</Text>
              <Text style={styles.warningBody}>{warning}</Text>
            </View>
          ))}

          <Text style={styles.safety}>
            Existing aquariums are never overwritten. Record identifiers are remapped, stale notification IDs are discarded, and failed restores roll back automatically.
          </Text>
          <PrimaryButton disabled={restoring} label={restoring ? 'Restoring…' : 'Restore as new aquarium'} onPress={() => void restore()} />

          <Pressable accessibilityRole="button" disabled={restoring} onPress={() => { setBackup(null); setPreview(null); setFilename(''); }} style={styles.clear}>
            <Text style={styles.clearText}>Choose a different file</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: Brand.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  eyebrow: { color: Brand.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  name: { color: Brand.text, fontSize: 24, fontWeight: '900', marginTop: 5 },
  meta: { color: Brand.textMuted, fontSize: 11, marginTop: 4 },
  counts: { borderRadius: 16, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, overflow: 'hidden' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Brand.border },
  countLabel: { color: Brand.textMuted, fontSize: 12 },
  countValue: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  warning: { padding: 14, borderRadius: 15, borderWidth: 1, borderColor: Brand.amber, backgroundColor: Brand.surface },
  warningTitle: { color: Brand.amber, fontSize: 12, fontWeight: '900' },
  warningBody: { color: Brand.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  safety: { color: Brand.textFaint, fontSize: 11, lineHeight: 17 },
  clear: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: Brand.cyan, fontSize: 12, fontWeight: '800' },
});
