import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type {
  Aquarium, Equipment, HusbandryEvent, InventoryEvent, Livestock,
  MaintenanceTask, ParameterReading, PhotoRecord, TargetOverride,
} from '@/domain/models';

export const BACKUP_SCHEMA_VERSION = 1;

export type AquariumExportData = {
  aquarium: Aquarium;
  readings: ParameterReading[];
  tasks: MaintenanceTask[];
  husbandryEvents: HusbandryEvent[];
  livestock: Livestock[];
  equipment: Equipment[];
  inventoryEvents: InventoryEvent[];
  targetOverrides: TargetOverride[];
  photos: PhotoRecord[];
};

export type BattleReefBackup = {
  format: 'battlereef-backup';
  schemaVersion: number;
  exportedAt: string;
  app: 'BattleReef Mobile';
  scope: 'aquarium';
  data: AquariumExportData;
};

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'aquarium';
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
}

async function writeAndShare(filename: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') throw new Error('Browser export is unavailable.');
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (!FileSystem.cacheDirectory) throw new Error('Export storage is unavailable on this device.');
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });

  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Export BattleReef data', UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text' });
}

export function createBackup(data: AquariumExportData): BattleReefBackup {
  return {
    format: 'battlereef-backup',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'BattleReef Mobile',
    scope: 'aquarium',
    data,
  };
}

export async function exportBackup(data: AquariumExportData) {
  const backup = createBackup(data);
  const filename = `battlereef-${safeName(data.aquarium.name)}-${new Date().toISOString().slice(0, 10)}.br.json`;
  await writeAndShare(filename, JSON.stringify(backup, null, 2), 'application/json');
}

export async function exportReadingsCsv(data: AquariumExportData) {
  const rows = data.readings.map((reading) => ({
    aquarium: data.aquarium.name,
    parameter: reading.parameter,
    value: reading.value,
    unit: reading.unit,
    recordedAt: reading.recordedAt,
    source: reading.source,
    confidence: reading.confidence,
    confirmedAt: reading.confirmedAt,
    note: reading.note,
  }));
  if (!rows.length) throw new Error('There are no water-test readings to export.');
  const filename = `battlereef-${safeName(data.aquarium.name)}-readings-${new Date().toISOString().slice(0, 10)}.csv`;
  await writeAndShare(filename, toCsv(rows), 'text/csv');
}
