import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 4;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS aquariums (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        volume_gallons REAL NOT NULL CHECK (volume_gallons > 0),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS parameter_readings (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        parameter TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_readings_aquarium_recorded ON parameter_readings(aquarium_id, recorded_at DESC);
      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        title TEXT NOT NULL,
        due_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_aquarium_due ON maintenance_tasks(aquarium_id, due_at);
      CREATE TABLE IF NOT EXISTS app_preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      ALTER TABLE parameter_readings ADD COLUMN source TEXT NOT NULL DEFAULT 'manual_user';
      ALTER TABLE parameter_readings ADD COLUMN confidence REAL;
      ALTER TABLE parameter_readings ADD COLUMN confirmed_at TEXT;
      CREATE INDEX IF NOT EXISTS idx_readings_aquarium_parameter_recorded ON parameter_readings(aquarium_id, parameter, recorded_at DESC);
    `);
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS target_overrides (
        aquarium_id TEXT NOT NULL,
        parameter TEXT NOT NULL,
        min_value REAL NOT NULL,
        max_value REAL NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (aquarium_id, parameter),
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE,
        CHECK (min_value <= max_value)
      );
    `);
  }

  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS husbandry_events (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('water_change', 'feeding', 'dosing', 'observation')),
        occurred_at TEXT NOT NULL,
        amount REAL,
        unit TEXT,
        subject TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_husbandry_events_aquarium_occurred
        ON husbandry_events(aquarium_id, occurred_at DESC);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
