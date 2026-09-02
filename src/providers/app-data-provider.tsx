import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  createAquarium as insertAquarium,
  createReading as insertReading,
  createTask as insertTask,
  getSelectedAquariumId,
  listAquariums,
  listReadings,
  listTasks,
  saveSelectedAquariumId,
  toggleTask as updateTask,
} from '@/data/repository';
import type {
  Aquarium,
  MaintenanceTask,
  NewAquarium,
  NewReading,
  NewTask,
  ParameterReading,
} from '@/domain/models';

type AppDataValue = {
  loading: boolean;
  aquariums: Aquarium[];
  selectedAquarium: Aquarium | null;
  readings: ParameterReading[];
  tasks: MaintenanceTask[];
  selectAquarium: (aquariumId: string) => Promise<void>;
  addAquarium: (input: NewAquarium) => Promise<void>;
  addReading: (input: NewReading) => Promise<void>;
  addTask: (input: NewTask) => Promise<void>;
  toggleTask: (task: MaintenanceTask) => Promise<void>;
};

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null);
  const [readings, setReadings] = useState<ParameterReading[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);

  const loadDetails = useCallback(
    async (aquariumId: string | null) => {
      if (!aquariumId) {
        setReadings([]);
        setTasks([]);
        return;
      }
      const [nextReadings, nextTasks] = await Promise.all([
        listReadings(db, aquariumId),
        listTasks(db, aquariumId),
      ]);
      setReadings(nextReadings);
      setTasks(nextTasks);
    },
    [db],
  );

  const bootstrap = useCallback(async () => {
    const nextAquariums = await listAquariums(db);
    const savedId = await getSelectedAquariumId(db);
    const nextId = nextAquariums.some((item) => item.id === savedId)
      ? savedId
      : (nextAquariums[0]?.id ?? null);
    setAquariums(nextAquariums);
    setSelectedAquariumId(nextId);
    await loadDetails(nextId);
    setLoading(false);
  }, [db, loadDetails]);

  useEffect(() => {
    // The provider must hydrate its view state after the SQLite context is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  const selectAquarium = useCallback(
    async (aquariumId: string) => {
      setSelectedAquariumId(aquariumId);
      await saveSelectedAquariumId(db, aquariumId);
      await loadDetails(aquariumId);
    },
    [db, loadDetails],
  );

  const addAquarium = useCallback(
    async (input: NewAquarium) => {
      const aquarium = await insertAquarium(db, input);
      const nextAquariums = await listAquariums(db);
      setAquariums(nextAquariums);
      await selectAquarium(aquarium.id);
    },
    [db, selectAquarium],
  );

  const addReading = useCallback(
    async (input: NewReading) => {
      if (!selectedAquariumId) throw new Error('Create an aquarium before logging a reading.');
      await insertReading(db, selectedAquariumId, input);
      setReadings(await listReadings(db, selectedAquariumId));
    },
    [db, selectedAquariumId],
  );

  const addTask = useCallback(
    async (input: NewTask) => {
      if (!selectedAquariumId) throw new Error('Create an aquarium before adding a task.');
      await insertTask(db, selectedAquariumId, input);
      setTasks(await listTasks(db, selectedAquariumId));
    },
    [db, selectedAquariumId],
  );

  const toggleTask = useCallback(
    async (task: MaintenanceTask) => {
      await updateTask(db, task);
      if (selectedAquariumId) setTasks(await listTasks(db, selectedAquariumId));
    },
    [db, selectedAquariumId],
  );

  const selectedAquarium = useMemo(
    () => aquariums.find((item) => item.id === selectedAquariumId) ?? null,
    [aquariums, selectedAquariumId],
  );

  const value = useMemo<AppDataValue>(
    () => ({
      loading,
      aquariums,
      selectedAquarium,
      readings,
      tasks,
      selectAquarium,
      addAquarium,
      addReading,
      addTask,
      toggleTask,
    }),
    [loading, aquariums, selectedAquarium, readings, tasks, selectAquarium, addAquarium, addReading, addTask, toggleTask],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used within AppDataProvider');
  return value;
}
