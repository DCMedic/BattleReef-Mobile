import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type Aquarium,
  type AquariumType,
  type MaintenanceTask,
  type NewAquarium,
  type NewReading,
  type NewTask,
  parameterCatalog,
  type ParameterKey,
  type ParameterReading,
  type ReadingSource,
} from '@/domain/models';
import { validateAquarium, validateReading } from '@/domain/validation';

type AquariumRow = {
  id: string;
  name: string;
  type: string;
  volume_gallons: number;
  created_at: string;
};

type ReadingRow = {
  id: string;
  aquarium_id: string;
  parameter: string;
  value: number;
  unit: string;
  recorded_at: string;
  note: string | null;
  source: string;
  confidence: number | null;
  confirmed_at: string | null;
};

type TaskRow = {
  id: string;
  aquarium_id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapAquarium(row: AquariumRow): Aquarium {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AquariumType,
    volumeGallons: row.volume_gallons,
    createdAt: row.created_at,
  };
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
  };
}

export async function listAquariums(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<AquariumRow>('SELECT * FROM aquariums ORDER BY created_at ASC');
  return rows.map(mapAquarium);
}

export async function createAquarium(db: SQLiteDatabase, input: NewAquarium) {
  const validation = validateAquarium(input);
  if (!validation.valid) throw new Error(validation.message);

  const aquarium: Aquarium = {
    id: createId('aq'),
    name: input.name.trim(),
    type: input.type,
    volumeGallons: input.volumeGallons,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    'INSERT INTO aquariums (id, name, type, volume_gallons, created_at) VALUES (?, ?, ?, ?, ?)',
    aquarium.id,
    aquarium.name,
    aquarium.type,
    aquarium.volumeGallons,
    aquarium.createdAt,
  );

  return aquarium;
}

export async function listReadings(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<ReadingRow>(
    'SELECT * FROM parameter_readings WHERE aquarium_id = ? ORDER BY recorded_at DESC LIMIT 250',
    aquariumId,
  );
  return rows.map(mapReading);
}

export async function createReading(
  db: SQLiteDatabase,
  aquariumId: string,
  input: NewReading,
) {
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
    reading.id,
    reading.aquariumId,
    reading.parameter,
    reading.value,
    reading.unit,
    reading.recordedAt,
    reading.note,
    reading.source,
    reading.confidence,
    reading.confirmedAt,
  );

  return reading;
}

export async function listTasks(db: SQLiteDatabase, aquariumId: string) {
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM maintenance_tasks
      WHERE aquarium_id = ?
      ORDER BY completed_at IS NOT NULL ASC, due_at IS NULL ASC, due_at ASC, created_at DESC`,
    aquariumId,
  );
  return rows.map(mapTask);
}

export async function createTask(db: SQLiteDatabase, aquariumId: string, input: NewTask) {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) {
    throw new Error('Task title must contain between 2 and 120 characters.');
  }

  const task: MaintenanceTask = {
    id: createId('task'),
    aquariumId,
    title,
    dueAt: input.dueAt,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    `INSERT INTO maintenance_tasks
      (id, aquarium_id, title, due_at, completed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    task.id,
    task.aquariumId,
    task.title,
    task.dueAt,
    task.completedAt,
    task.createdAt,
  );

  return task;
}

export async function toggleTask(db: SQLiteDatabase, task: MaintenanceTask) {
  const completedAt = task.completedAt ? null : new Date().toISOString();
  await db.runAsync('UPDATE maintenance_tasks SET completed_at = ? WHERE id = ?', completedAt, task.id);
}

export async function getSelectedAquariumId(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_preferences WHERE key = 'selectedAquariumId'",
  );
  return row?.value ?? null;
}

export async function saveSelectedAquariumId(db: SQLiteDatabase, aquariumId: string) {
  await db.runAsync(
    `INSERT INTO app_preferences (key, value) VALUES ('selectedAquariumId', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    aquariumId,
  );
}
