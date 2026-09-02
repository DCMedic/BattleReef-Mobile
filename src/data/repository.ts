import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type Aquarium,
  type HusbandryEvent,
  type Livestock,
  type LivestockKind,
  type LivestockStatus,
  type Equipment,
  type EquipmentKind,
  type EquipmentStatus,
  type InventoryEvent,
  type InventoryEventKind,
  type HusbandryEventKind,
  type AquariumType,
  type MaintenanceTask,
  type TaskRecurrence,
  type NewAquarium,
  type NewHusbandryEvent,
  type NewLivestock,
  type NewEquipment,
  type NewReading,
  type NewTask,
  parameterCatalog,
  type ParameterKey,
  type ParameterReading,
  type PhotoRecord,
  type NewPhotoRecord,
  type PhotoViewpoint,
  type PhotoLightingProfile,
  type ReadingSource,
  type TargetOverride,
} from '@/domain/models';
import { validateAquarium, validateReading } from '@/domain/validation';

type AquariumRow = { id: string; name: string; type: string; volume_gallons: number; created_at: string };
type ReadingRow = { id: string; aquarium_id: string; parameter: string; value: number; unit: string; recorded_at: string; note: string | null; source: string; confidence: number | null; confirmed_at: string | null };
type TaskRow = { id: string; aquarium_id: string; title: string; due_at: string | null; completed_at: string | null; created_at: string; recurrence: string; notification_id: string | null; parent_task_id: string | null };
type TargetRow = { aquarium_id: string; parameter: string; min_value: number; max_value: number; updated_at: string };
type HusbandryRow = { id: string; aquarium_id: string; kind: string; occurred_at: string; amount: number | null; unit: string | null; subject: string | null; note: string | null; created_at: string };
type LivestockRow = { id: string; aquarium_id: string; name: string; species: string | null; kind: string; quantity: number; status: string; acquired_at: string | null; note: string | null; created_at: string };
type EquipmentRow = { id: string; aquarium_id: string; name: string; manufacturer: string | null; model: string | null; kind: string; status: string; installed_at: string | null; warranty_ends_at: string | null; note: string | null; created_at: string };
type InventoryEventRow = { id: string; aquarium_id: string; entity_type: string; entity_id: string; kind: string; from_status: string | null; to_status: string | null; note: string | null; occurred_at: string; created_at: string };
type PhotoRow = { id: string; aquarium_id: string; uri: string; caption: string | null; linked_livestock_id: string | null; captured_at: string; created_at: string; storage_key: string | null; media_state: string; viewpoint: string | null; lighting_profile: string | null; guided_capture: number };

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapAquarium(row: AquariumRow): Aquarium {
  return { id: row.id, name: row.name, type: row.type as AquariumType, volumeGallons: row.volume_gallons, createdAt: row.created_at };
}

function mapReading(row: ReadingRow): ParameterReading {
  return {
    id: row.id,
    aquariumId: row.aquarium_id,
    parameter: row.parameter as ParameterKey,
    value: row.value,
    unit: row.unit,
    recordedAt: row.recorded_at,
    note: row.note,
    source: row.source as ReadingSource,
    confidence: row.confidence,
    confirmedAt: row.confirmed_at,
  };
}

function mapTask(row: TaskRow): MaintenanceTask {
  return {
    id: row.id,
    aquariumId: row.aquarium_id,
    title: row.title,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    recurrence: row.recurrence as TaskRecurrence,
    notificationId: row.notification_id,
    parentTaskId: row.parent_task_id,
  };
}

function mapTarget(row: TargetRow): TargetOverride {
  return { aquariumId: row.aquarium_id, parameter: row.parameter as ParameterKey, min: row.min_value, max: row.max_value, updatedAt: row.updated_at };
}

function mapHusbandryEvent(row: HusbandryRow): HusbandryEvent {
  return {
    id: row.id,
    aquariumId: row.aquarium_id,
    kind: row.kind as HusbandryEventKind,
    occurredAt: row.occurred_at,
    amount: row.amount,
    unit: row.unit,
    subject: row.subject,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function listAquariums(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<AquariumRow>('SELECT * FROM aquariums ORDER BY created_at ASC');
  return rows.map(mapAquarium);
}

export async function createAquarium(db: SQLiteDatabase, input: NewAquarium) {
  const validation = validateAquarium(input);
  if (!validation.valid) throw new Error(validation.message);
  const aquarium: Aquarium = { id: createId('aq'), name: input.name.trim(), type: input.type, volumeGallons: input.volumeGallons, createdAt: new Date().toISOString() };
  await db.runAsync('INSERT INTO aquariums (id, name, type, volume_gallons, created_at) VALUES (?, ?, ?, ?, ?)', aquarium.id, aquarium.name, aquarium.type, aquarium.volumeGallons, aquarium.createdAt);
  return aquarium;
}

export async function listReadings(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<ReadingRow>('SELECT * FROM parameter_readings WHERE aquarium_id = ? ORDER BY recorded_at DESC LIMIT 250', aquariumId);
  return rows.map(mapReading);
}

export async function createReading(db: SQLiteDatabase, aquariumId: string, input: NewReading) {
  const validation = validateReading(input);
  if (!validation.valid) throw new Error(validation.message);
  const now = new Date().toISOString();
  const reading: ParameterReading = {
    id: createId('reading'),
    aquariumId,
    parameter: input.parameter,
    value: input.value,
    unit: parameterCatalog[input.parameter].unit,
    recordedAt: input.recordedAt ?? now,
    note: input.note?.trim() || null,
    source: 'manual_user',
    confidence: null,
    confirmedAt: now,
  };
  await db.runAsync(
    `INSERT INTO parameter_readings
      (id, aquarium_id, parameter, value, unit, recorded_at, note, source, confidence, confirmed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    reading.id, reading.aquariumId, reading.parameter, reading.value, reading.unit, reading.recordedAt, reading.note, reading.source, reading.confidence, reading.confirmedAt,
  );
  return reading;
}

export async function listTasks(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM maintenance_tasks WHERE aquarium_id = ?
      ORDER BY completed_at IS NOT NULL ASC, due_at IS NULL ASC, due_at ASC, created_at DESC`,
    aquariumId,
  );
  return rows.map(mapTask);
}

export async function createTask(db: SQLiteDatabase, aquariumId: string, input: NewTask) {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) throw new Error('Task title must contain between 2 and 120 characters.');
  if (input.recurrence !== 'none' && !input.dueAt) throw new Error('Recurring tasks require a due date.');
  const task: MaintenanceTask = {
    id: createId('task'),
    aquariumId,
    title,
    dueAt: input.dueAt,
    completedAt: null,
    createdAt: new Date().toISOString(),
    recurrence: input.recurrence,
    notificationId: null,
    parentTaskId: null,
  };
  await db.runAsync(
    `INSERT INTO maintenance_tasks
      (id, aquarium_id, title, due_at, completed_at, created_at, recurrence, notification_id, parent_task_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id, task.aquariumId, task.title, task.dueAt, task.completedAt, task.createdAt,
    task.recurrence, task.notificationId, task.parentTaskId,
  );
  return task;
}

export async function setTaskNotificationId(db: SQLiteDatabase, taskId: string, notificationId: string | null) {
  await db.runAsync('UPDATE maintenance_tasks SET notification_id = ? WHERE id = ?', notificationId, taskId);
}

export async function completeTask(db: SQLiteDatabase, task: MaintenanceTask, nextDueAt: string | null): Promise<MaintenanceTask | null> {
  if (task.completedAt) return null;
  const completedAt = new Date().toISOString();

  let nextTask: MaintenanceTask | null = null;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE maintenance_tasks SET completed_at = ?, notification_id = NULL WHERE id = ?', completedAt, task.id);

    if (task.recurrence !== 'none' && nextDueAt) {
      nextTask = {
        id: createId('task'),
        aquariumId: task.aquariumId,
        title: task.title,
        dueAt: nextDueAt,
        completedAt: null,
        createdAt: completedAt,
        recurrence: task.recurrence,
        notificationId: null,
        parentTaskId: task.parentTaskId ?? task.id,
      };
      await db.runAsync(
        `INSERT INTO maintenance_tasks
          (id, aquarium_id, title, due_at, completed_at, created_at, recurrence, notification_id, parent_task_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        nextTask.id, nextTask.aquariumId, nextTask.title, nextTask.dueAt, nextTask.completedAt,
        nextTask.createdAt, nextTask.recurrence, nextTask.notificationId, nextTask.parentTaskId,
      );
    }
  });

  return nextTask;
}

export async function reopenTask(db: SQLiteDatabase, task: MaintenanceTask) {
  if (!task.completedAt || task.recurrence !== 'none') return;
  await db.runAsync('UPDATE maintenance_tasks SET completed_at = NULL WHERE id = ?', task.id);
}

export async function listHusbandryEvents(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<HusbandryRow>(
    'SELECT * FROM husbandry_events WHERE aquarium_id = ? ORDER BY occurred_at DESC LIMIT 250',
    aquariumId,
  );
  return rows.map(mapHusbandryEvent);
}

export async function createHusbandryEvent(
  db: SQLiteDatabase,
  aquariumId: string,
  input: NewHusbandryEvent,
) {
  const now = new Date().toISOString();
  const occurredAt = input.occurredAt ?? now;
  if (Number.isNaN(Date.parse(occurredAt))) throw new Error('Event time is invalid.');

  const subject = input.subject?.trim() || null;
  const note = input.note?.trim() || null;
  if ((subject?.length ?? 0) > 100) throw new Error('Event subject cannot exceed 100 characters.');
  if ((note?.length ?? 0) > 240) throw new Error('Event note cannot exceed 240 characters.');

  if (input.kind === 'water_change') {
    if (!Number.isFinite(input.amount) || (input.amount ?? 0) <= 0) throw new Error('Enter a water-change amount greater than zero.');
    if (!input.unit) throw new Error('Choose gallons or percent for the water change.');
  }
  if ((input.kind === 'feeding' || input.kind === 'dosing') && !subject) {
    throw new Error(input.kind === 'feeding' ? 'Enter the food used.' : 'Enter the additive dosed.');
  }
  if (input.amount !== null && input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount < 0)) {
    throw new Error('Amount must be zero or greater.');
  }
  if (input.kind === 'observation' && !note) throw new Error('Enter an observation.');

  const event: HusbandryEvent = {
    id: createId('event'),
    aquariumId,
    kind: input.kind,
    occurredAt,
    amount: input.amount ?? null,
    unit: input.unit?.trim() || null,
    subject,
    note,
    createdAt: now,
  };

  await db.runAsync(
    `INSERT INTO husbandry_events
      (id, aquarium_id, kind, occurred_at, amount, unit, subject, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.id, event.aquariumId, event.kind, event.occurredAt, event.amount, event.unit, event.subject, event.note, event.createdAt,
  );
  return event;
}

export async function listTargetOverrides(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<TargetRow>('SELECT * FROM target_overrides WHERE aquarium_id = ? ORDER BY parameter ASC', aquariumId);
  return rows.map(mapTarget);
}

export async function saveTargetOverride(db: SQLiteDatabase, aquariumId: string, parameter: ParameterKey, min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new Error('Target minimum must be less than or equal to maximum.');
  const definition = parameterCatalog[parameter];
  if (min < definition.hardMin || max > definition.hardMax) throw new Error(`Target must stay within ${definition.hardMin}–${definition.hardMax} ${definition.unit}.`);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO target_overrides (aquarium_id, parameter, min_value, max_value, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(aquarium_id, parameter)
      DO UPDATE SET min_value = excluded.min_value, max_value = excluded.max_value, updated_at = excluded.updated_at`,
    aquariumId, parameter, min, max, updatedAt,
  );
}

export async function deleteTargetOverride(db: SQLiteDatabase, aquariumId: string, parameter: ParameterKey) {
  await db.runAsync('DELETE FROM target_overrides WHERE aquarium_id = ? AND parameter = ?', aquariumId, parameter);
}

export async function getSelectedAquariumId(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_preferences WHERE key = 'selectedAquariumId'");
  return row?.value ?? null;
}

export async function saveSelectedAquariumId(db: SQLiteDatabase, aquariumId: string) {
  await db.runAsync(
    `INSERT INTO app_preferences (key, value) VALUES ('selectedAquariumId', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    aquariumId,
  );
}


function mapLivestock(row: LivestockRow): Livestock {
  return {
    id: row.id, aquariumId: row.aquarium_id, name: row.name, species: row.species,
    kind: row.kind as LivestockKind, quantity: row.quantity, status: row.status as LivestockStatus,
    acquiredAt: row.acquired_at, note: row.note, createdAt: row.created_at,
  };
}

function mapEquipment(row: EquipmentRow): Equipment {
  return {
    id: row.id, aquariumId: row.aquarium_id, name: row.name, manufacturer: row.manufacturer,
    model: row.model, kind: row.kind as EquipmentKind, status: row.status as EquipmentStatus,
    installedAt: row.installed_at, warrantyEndsAt: row.warranty_ends_at, note: row.note, createdAt: row.created_at,
  };
}

export async function listLivestock(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<LivestockRow>(
    'SELECT * FROM livestock WHERE aquarium_id = ? ORDER BY status = \'active\' DESC, created_at DESC',
    aquariumId,
  );
  return rows.map(mapLivestock);
}

export async function createLivestock(db: SQLiteDatabase, aquariumId: string, input: NewLivestock) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) throw new Error('Livestock name must contain between 2 and 100 characters.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 999) throw new Error('Quantity must be a whole number between 1 and 999.');
  if (input.acquiredAt && Number.isNaN(Date.parse(input.acquiredAt))) throw new Error('Acquisition date is invalid.');
  const item: Livestock = {
    id: createId('livestock'), aquariumId, name, species: input.species?.trim() || null,
    kind: input.kind, quantity: input.quantity, status: input.status, acquiredAt: input.acquiredAt,
    note: input.note?.trim() || null, createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO livestock (id, aquarium_id, name, species, kind, quantity, status, acquired_at, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.aquariumId, item.name, item.species, item.kind, item.quantity, item.status, item.acquiredAt, item.note, item.createdAt,
  );
  return item;
}

export async function listEquipment(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<EquipmentRow>(
    'SELECT * FROM equipment WHERE aquarium_id = ? ORDER BY status = \'active\' DESC, created_at DESC',
    aquariumId,
  );
  return rows.map(mapEquipment);
}

export async function createEquipment(db: SQLiteDatabase, aquariumId: string, input: NewEquipment) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) throw new Error('Equipment name must contain between 2 and 100 characters.');
  if (input.installedAt && Number.isNaN(Date.parse(input.installedAt))) throw new Error('Installation date is invalid.');
  if (input.warrantyEndsAt && Number.isNaN(Date.parse(input.warrantyEndsAt))) throw new Error('Warranty date is invalid.');
  const item: Equipment = {
    id: createId('equipment'), aquariumId, name, manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null, kind: input.kind, status: input.status, installedAt: input.installedAt,
    warrantyEndsAt: input.warrantyEndsAt, note: input.note?.trim() || null, createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO equipment (id, aquarium_id, name, manufacturer, model, kind, status, installed_at, warranty_ends_at, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.aquariumId, item.name, item.manufacturer, item.model, item.kind, item.status, item.installedAt, item.warrantyEndsAt, item.note, item.createdAt,
  );
  return item;
}


function mapInventoryEvent(row: InventoryEventRow): InventoryEvent {
  return {
    id: row.id,
    aquariumId: row.aquarium_id,
    entityType: row.entity_type as 'livestock' | 'equipment',
    entityId: row.entity_id,
    kind: row.kind as InventoryEventKind,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    note: row.note,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export async function listInventoryEvents(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<InventoryEventRow>(
    'SELECT * FROM inventory_events WHERE aquarium_id = ? ORDER BY occurred_at DESC LIMIT 250',
    aquariumId,
  );
  return rows.map(mapInventoryEvent);
}

async function recordInventoryEvent(
  db: SQLiteDatabase,
  aquariumId: string,
  entityType: 'livestock' | 'equipment',
  entityId: string,
  kind: InventoryEventKind,
  fromStatus: string | null,
  toStatus: string | null,
  note: string | null,
) {
  const now = new Date().toISOString();
  const event: InventoryEvent = {
    id: createId('inventory_event'),
    aquariumId,
    entityType,
    entityId,
    kind,
    fromStatus,
    toStatus,
    note: note?.trim() || null,
    occurredAt: now,
    createdAt: now,
  };
  await db.runAsync(
    `INSERT INTO inventory_events
      (id, aquarium_id, entity_type, entity_id, kind, from_status, to_status, note, occurred_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.id, event.aquariumId, event.entityType, event.entityId, event.kind,
    event.fromStatus, event.toStatus, event.note, event.occurredAt, event.createdAt,
  );
  return event;
}

export async function updateLivestockStatus(
  db: SQLiteDatabase,
  item: Livestock,
  status: LivestockStatus,
  note?: string,
) {
  if (item.status === status) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE livestock SET status = ? WHERE id = ?', status, item.id);
    await recordInventoryEvent(db, item.aquariumId, 'livestock', item.id, 'status_change', item.status, status, note ?? null);
  });
}

export async function updateEquipmentStatus(
  db: SQLiteDatabase,
  item: Equipment,
  status: EquipmentStatus,
  note?: string,
) {
  if (item.status === status) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE equipment SET status = ? WHERE id = ?', status, item.id);
    await recordInventoryEvent(db, item.aquariumId, 'equipment', item.id, 'status_change', item.status, status, note ?? null);
  });
}

export async function recordEquipmentService(db: SQLiteDatabase, item: Equipment, note: string) {
  const clean = note.trim();
  if (clean.length < 2 || clean.length > 240) throw new Error('Service note must contain between 2 and 240 characters.');
  await recordInventoryEvent(db, item.aquariumId, 'equipment', item.id, 'service', item.status, item.status, clean);
}


function mapPhoto(row: PhotoRow): PhotoRecord {
  return {
    id: row.id,
    aquariumId: row.aquarium_id,
    uri: row.uri,
    caption: row.caption,
    linkedLivestockId: row.linked_livestock_id,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    storageKey: row.storage_key,
    mediaState: row.media_state as PhotoRecord['mediaState'],
    viewpoint: row.viewpoint as PhotoViewpoint | null,
    lightingProfile: row.lighting_profile as PhotoLightingProfile | null,
    guidedCapture: row.guided_capture === 1,
  };
}

export async function listPhotos(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photo_records WHERE aquarium_id = ? ORDER BY captured_at DESC LIMIT 250',
    aquariumId,
  );
  return rows.map(mapPhoto);
}

export async function createPhotoRecord(db: SQLiteDatabase, aquariumId: string, input: NewPhotoRecord) {
  const uri = input.uri.trim();
  if (!uri) throw new Error('Photo URI is required.');
  const caption = input.caption?.trim() || null;
  if ((caption?.length ?? 0) > 240) throw new Error('Photo caption cannot exceed 240 characters.');
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(capturedAt))) throw new Error('Photo capture time is invalid.');

  const photo: PhotoRecord = {
    id: createId('photo'),
    aquariumId,
    uri,
    caption,
    linkedLivestockId: input.linkedLivestockId ?? null,
    capturedAt,
    createdAt: new Date().toISOString(),
    storageKey: input.storageKey,
    mediaState: input.mediaState,
    viewpoint: input.viewpoint,
    lightingProfile: input.lightingProfile,
    guidedCapture: input.guidedCapture,
  };

  await db.runAsync(
    `INSERT INTO photo_records
      (id, aquarium_id, uri, caption, linked_livestock_id, captured_at, created_at, storage_key, media_state, viewpoint, lighting_profile, guided_capture)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    photo.id, photo.aquariumId, photo.uri, photo.caption, photo.linkedLivestockId, photo.capturedAt, photo.createdAt, photo.storageKey, photo.mediaState, photo.viewpoint, photo.lightingProfile, photo.guidedCapture ? 1 : 0,
  );
  return photo;
}


export async function updatePhotoMediaState(
  db: SQLiteDatabase,
  photoId: string,
  mediaState: PhotoRecord['mediaState'],
) {
  await db.runAsync('UPDATE photo_records SET media_state = ? WHERE id = ?', mediaState, photoId);
}
