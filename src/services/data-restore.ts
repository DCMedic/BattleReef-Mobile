import type { SQLiteDatabase } from 'expo-sqlite';

import { BACKUP_SCHEMA_VERSION, type BattleReefBackup } from '@/services/data-export';

export type RestorePreview = {
  aquariumName: string;
  exportedAt: string;
  schemaVersion: number;
  counts: {
    readings: number;
    tasks: number;
    husbandryEvents: number;
    livestock: number;
    equipment: number;
    inventoryEvents: number;
    targetOverrides: number;
    photos: number;
  };
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function requireArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Backup field "${name}" is missing or invalid.`);
  return value;
}

export function parseAndValidateBackup(raw: string): BattleReefBackup {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  if (!isRecord(value)) throw new Error('Backup root is invalid.');
  if (value.format !== 'battlereef-backup') throw new Error('This is not a BattleReef backup archive.');
  if (value.app !== 'BattleReef Mobile') throw new Error('Backup application identity is invalid.');
  if (value.scope !== 'aquarium') throw new Error('Only aquarium-scoped backups are supported.');
  if (typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion)) throw new Error('Backup schema version is invalid.');
  if (value.schemaVersion > BACKUP_SCHEMA_VERSION) throw new Error(`This backup uses schema v${value.schemaVersion}, newer than this app supports (v${BACKUP_SCHEMA_VERSION}).`);
  if (value.schemaVersion < 1) throw new Error('Backup schema version is unsupported.');
  if (!isString(value.exportedAt) || Number.isNaN(Date.parse(value.exportedAt))) throw new Error('Backup export timestamp is invalid.');
  if (!isRecord(value.data)) throw new Error('Backup data payload is missing.');
  if (!isRecord(value.data.aquarium)) throw new Error('Backup aquarium record is missing.');

  const aquarium = value.data.aquarium;
  if (!isString(aquarium.id) || !isString(aquarium.name) || aquarium.name.trim().length < 2) throw new Error('Backup aquarium identity is invalid.');
  if (!isString(aquarium.type) || typeof aquarium.volumeGallons !== 'number' || !Number.isFinite(aquarium.volumeGallons) || aquarium.volumeGallons <= 0) {
    throw new Error('Backup aquarium configuration is invalid.');
  }
  if (!isString(aquarium.createdAt) || Number.isNaN(Date.parse(aquarium.createdAt))) throw new Error('Backup aquarium creation time is invalid.');

  for (const key of ['readings','tasks','husbandryEvents','livestock','equipment','inventoryEvents','targetOverrides','photos']) {
    requireArray(value.data[key], key);
  }

  return value as unknown as BattleReefBackup;
}

export function previewBackup(backup: BattleReefBackup): RestorePreview {
  return {
    aquariumName: backup.data.aquarium.name,
    exportedAt: backup.exportedAt,
    schemaVersion: backup.schemaVersion,
    counts: {
      readings: backup.data.readings.length,
      tasks: backup.data.tasks.length,
      husbandryEvents: backup.data.husbandryEvents.length,
      livestock: backup.data.livestock.length,
      equipment: backup.data.equipment.length,
      inventoryEvents: backup.data.inventoryEvents.length,
      targetOverrides: backup.data.targetOverrides.length,
      photos: backup.data.photos.length,
    },
    warnings: backup.data.photos.length > 0
      ? ['Photo metadata will be restored, but image files are not embedded in Alpha backups and will be marked unavailable.']
      : [],
  };
}

function restoredId(prefix: string, original: string) {
  const fragment = original.replace(/[^a-zA-Z0-9]/g, '').slice(-10) || 'record';
  return `${prefix}_restore_${Date.now()}_${Math.random().toString(36).slice(2,8)}_${fragment}`;
}

export async function restoreBackup(db: SQLiteDatabase, backup: BattleReefBackup) {
  const source = backup.data;
  const aquariumId = restoredId('aq', source.aquarium.id);
  const livestockIds = new Map(source.livestock.map((item) => [item.id, restoredId('livestock', item.id)]));
  const equipmentIds = new Map(source.equipment.map((item) => [item.id, restoredId('equipment', item.id)]));
  const taskIds = new Map(source.tasks.map((item) => [item.id, restoredId('task', item.id)]));

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO aquariums (id, name, type, volume_gallons, created_at) VALUES (?, ?, ?, ?, ?)',
      aquariumId, `${source.aquarium.name} (Restored)`, source.aquarium.type, source.aquarium.volumeGallons, source.aquarium.createdAt,
    );

    for (const reading of source.readings) {
      await db.runAsync(
        `INSERT INTO parameter_readings
          (id, aquarium_id, parameter, value, unit, recorded_at, note, source, confidence, confirmed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        restoredId('reading', reading.id), aquariumId, reading.parameter, reading.value, reading.unit,
        reading.recordedAt, reading.note, reading.source, reading.confidence, reading.confirmedAt,
      );
    }

    for (const task of source.tasks) {
      await db.runAsync(
        `INSERT INTO maintenance_tasks
          (id, aquarium_id, title, due_at, completed_at, created_at, recurrence, notification_id, parent_task_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
        taskIds.get(task.id)!, aquariumId, task.title, task.dueAt, task.completedAt, task.createdAt, task.recurrence,
        task.parentTaskId ? taskIds.get(task.parentTaskId) ?? null : null,
      );
    }

    for (const event of source.husbandryEvents) {
      await db.runAsync(
        `INSERT INTO husbandry_events
          (id, aquarium_id, kind, occurred_at, amount, unit, subject, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        restoredId('event', event.id), aquariumId, event.kind, event.occurredAt, event.amount, event.unit, event.subject, event.note, event.createdAt,
      );
    }

    for (const item of source.livestock) {
      await db.runAsync(
        `INSERT INTO livestock
          (id, aquarium_id, name, species, kind, quantity, status, acquired_at, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        livestockIds.get(item.id)!, aquariumId, item.name, item.species, item.kind, item.quantity, item.status, item.acquiredAt, item.note, item.createdAt,
      );
    }

    for (const item of source.equipment) {
      await db.runAsync(
        `INSERT INTO equipment
          (id, aquarium_id, name, manufacturer, model, kind, status, installed_at, warranty_ends_at, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        equipmentIds.get(item.id)!, aquariumId, item.name, item.manufacturer, item.model, item.kind, item.status,
        item.installedAt, item.warrantyEndsAt, item.note, item.createdAt,
      );
    }

    for (const event of source.inventoryEvents) {
      const entityId = event.entityType === 'livestock'
        ? livestockIds.get(event.entityId)
        : equipmentIds.get(event.entityId);
      if (!entityId) continue;
      await db.runAsync(
        `INSERT INTO inventory_events
          (id, aquarium_id, entity_type, entity_id, kind, from_status, to_status, note, occurred_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        restoredId('inventory_event', event.id), aquariumId, event.entityType, entityId, event.kind,
        event.fromStatus, event.toStatus, event.note, event.occurredAt, event.createdAt,
      );
    }

    for (const target of source.targetOverrides) {
      await db.runAsync(
        `INSERT INTO target_overrides (aquarium_id, parameter, min_value, max_value, updated_at)
          VALUES (?, ?, ?, ?, ?)`,
        aquariumId, target.parameter, target.min, target.max, target.updatedAt,
      );
    }

    for (const photo of source.photos) {
      await db.runAsync(
        `INSERT INTO photo_records
          (id, aquarium_id, uri, caption, linked_livestock_id, captured_at, created_at, storage_key, media_state, viewpoint, lighting_profile, guided_capture)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'missing', ?, ?, ?)`,
        restoredId('photo', photo.id), aquariumId, photo.uri, photo.caption,
        photo.linkedLivestockId ? livestockIds.get(photo.linkedLivestockId) ?? null : null,
        photo.capturedAt, photo.createdAt, photo.viewpoint, photo.lightingProfile, photo.guidedCapture ? 1 : 0,
      );
    }
  });

  return aquariumId;
}
