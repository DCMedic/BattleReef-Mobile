import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 9;

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

  if (currentVersion < 5) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS livestock (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        name TEXT NOT NULL,
        species TEXT,
        kind TEXT NOT NULL CHECK (kind IN ('fish', 'coral', 'invertebrate', 'plant', 'other')),
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        status TEXT NOT NULL CHECK (status IN ('active', 'quarantine', 'removed', 'deceased')),
        acquired_at TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_livestock_aquarium_status ON livestock(aquarium_id, status);

      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        kind TEXT NOT NULL CHECK (kind IN ('lighting', 'filtration', 'pump', 'heater', 'doser', 'monitor', 'other')),
        status TEXT NOT NULL CHECK (status IN ('active', 'spare', 'service', 'retired')),
        installed_at TEXT,
        warranty_ends_at TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_equipment_aquarium_status ON equipment(aquarium_id, status);
    `);
  }

  if (currentVersion < 6) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_events (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        entity_type TEXT NOT NULL CHECK (entity_type IN ('livestock', 'equipment')),
        entity_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('status_change', 'service', 'note')),
        from_status TEXT,
        to_status TEXT,
        note TEXT,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_events_aquarium_occurred
        ON inventory_events(aquarium_id, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS idx_inventory_events_entity
        ON inventory_events(entity_type, entity_id, occurred_at DESC);
    `);
  }

  if (currentVersion < 7) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS photo_records (
        id TEXT PRIMARY KEY NOT NULL,
        aquarium_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        caption TEXT,
        linked_livestock_id TEXT,
        captured_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (aquarium_id) REFERENCES aquariums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_photo_records_aquarium_captured
        ON photo_records(aquarium_id, captured_at DESC);
      CREATE INDEX IF NOT EXISTS idx_photo_records_livestock
        ON photo_records(linked_livestock_id, captured_at DESC);
    `);
  }

  if (currentVersion < 8) {
    await db.execAsync(`
      ALTER TABLE photo_records ADD COLUMN storage_key TEXT;
      ALTER TABLE photo_records ADD COLUMN media_state TEXT NOT NULL DEFAULT 'legacy'
        CHECK (media_state IN ('managed', 'legacy', 'missing'));
    `);
  }

  if (currentVersion < 9) {
    await db.execAsync(`
      ALTER TABLE photo_records ADD COLUMN viewpoint TEXT;
      ALTER TABLE photo_records ADD COLUMN lighting_profile TEXT;
      ALTER TABLE photo_records ADD COLUMN guided_capture INTEGER NOT NULL DEFAULT 0
        CHECK (guided_capture IN (0, 1));
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
