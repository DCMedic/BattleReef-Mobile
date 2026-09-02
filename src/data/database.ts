import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

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

    CREATE INDEX IF NOT EXISTS idx_readings_aquarium_recorded
      ON parameter_readings(aquarium_id, recorded_at DESC);

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      aquarium_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_aquarium_due
      ON maintenance_tasks(aquarium_id, due_at);

    CREATE TABLE IF NOT EXISTS app_preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    PRAGMA user_version = ${DATABASE_VERSION};
  `);
}
