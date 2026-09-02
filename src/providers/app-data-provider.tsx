import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  createAquarium as insertAquarium,
  createHusbandryEvent as insertHusbandryEvent,
  createReading as insertReading,
  createTask as insertTask,
  deleteTargetOverride as removeTargetOverride,
  getSelectedAquariumId,
  listAquariums,
  listHusbandryEvents,
  listReadings,
  listTargetOverrides,
  listTasks,
  saveSelectedAquariumId,
  saveTargetOverride as upsertTargetOverride,
  toggleTask as updateTask,
} from '@/data/repository';
import type {
  Aquarium,
  HusbandryEvent,
  MaintenanceTask,
  NewAquarium,
  NewHusbandryEvent,
  NewReading,
  NewTask,
  ParameterKey,
  ParameterReading,
  TargetOverride,
} from '@/domain/models';

type AppDataValue = {
  loading: boolean;
  aquariums: Aquarium[];
  selectedAquarium: Aquarium | null;
  readings: ParameterReading[];
  tasks: MaintenanceTask[];
  husbandryEvents: HusbandryEvent[];
  targetOverrides: TargetOverride[];
  selectAquarium: (aquariumId: string) => Promise<void>;
  addAquarium: (input: NewAquarium) => Promise<void>;
  addReading: (input: NewReading) => Promise<void>;
  addTask: (input: NewTask) => Promise<void>;
  addHusbandryEvent: (input: NewHusbandryEvent) => Promise<void>;
  toggleTask: (task: MaintenanceTask) => Promise<void>;
  saveTargetOverride: (parameter: ParameterKey, min: number, max: number) => Promise<void>;
  resetTargetOverride: (parameter: ParameterKey) => Promise<void>;
};

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null);
  const [readings, setReadings] = useState<ParameterReading[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [husbandryEvents, setHusbandryEvents] = useState<HusbandryEvent[]>([]);
  const [targetOverrides, setTargetOverrides] = useState<TargetOverride[]>([]);

  const loadDetails = useCallback(async (aquariumId: string | null) => {
    if (!aquariumId) {
      setReadings([]);
      setTasks([]);
      setHusbandryEvents([]);
      setTargetOverrides([]);
      return;
    }
    const [nextReadings, nextTasks, nextEvents, nextOverrides] = await Promise.all([
      listReadings(db, aquariumId),
      listTasks(db, aquariumId),
      listHusbandryEvents(db, aquariumId),
      listTargetOverrides(db, aquariumId),
    ]);
    setReadings(nextReadings);
    setTasks(nextTasks);
    setHusbandryEvents(nextEvents);
    setTargetOverrides(nextOverrides);
  }, [db]);

  const bootstrap = useCallback(async () => {
    const nextAquariums = await listAquariums(db);
    const savedId = await getSelectedAquariumId(db);
    const nextId = nextAquariums.some((item) => item.id === savedId) ? savedId : (nextAquariums[0]?.id ?? null);
    setAquariums(nextAquariums);
    setSelectedAquariumId(nextId);
    await loadDetails(nextId);
    setLoading(false);
  }, [db, loadDetails]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  const selectAquarium = useCallback(async (aquariumId: string) => {
    setSelectedAquariumId(aquariumId);
    await saveSelectedAquariumId(db, aquariumId);
    await loadDetails(aquariumId);
  }, [db, loadDetails]);

  const addAquarium = useCallback(async (input: NewAquarium) => {
    const aquarium = await insertAquarium(db, input);
    setAquariums(await listAquariums(db));
    await selectAquarium(aquarium.id);
  }, [db, selectAquarium]);

  const addReading = useCallback(async (input: NewReading) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before logging a reading.');
    await insertReading(db, selectedAquariumId, input);
    setReadings(await listReadings(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addTask = useCallback(async (input: NewTask) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before adding a task.');
    await insertTask(db, selectedAquariumId, input);
    setTasks(await listTasks(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addHusbandryEvent = useCallback(async (input: NewHusbandryEvent) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before logging activity.');
    await insertHusbandryEvent(db, selectedAquariumId, input);
    setHusbandryEvents(await listHusbandryEvents(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const toggleTask = useCallback(async (task: MaintenanceTask) => {
    await updateTask(db, task);
    if (selectedAquariumId) setTasks(await listTasks(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const saveTargetOverride = useCallback(async (parameter: ParameterKey, min: number, max: number) => {
    if (!selectedAquariumId) throw new Error('Select an aquarium before changing targets.');
    await upsertTargetOverride(db, selectedAquariumId, parameter, min, max);
    setTargetOverrides(await listTargetOverrides(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const resetTargetOverride = useCallback(async (parameter: ParameterKey) => {
    if (!selectedAquariumId) return;
    await removeTargetOverride(db, selectedAquariumId, parameter);
    setTargetOverrides(await listTargetOverrides(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const selectedAquarium = useMemo(
    () => aquariums.find((item) => item.id === selectedAquariumId) ?? null,
    [aquariums, selectedAquariumId],
  );

  const value = useMemo<AppDataValue>(() => ({
    loading, aquariums, selectedAquarium, readings, tasks, husbandryEvents, targetOverrides,
    selectAquarium, addAquarium, addReading, addTask, addHusbandryEvent, toggleTask, saveTargetOverride, resetTargetOverride,
  }), [
    loading, aquariums, selectedAquarium, readings, tasks, husbandryEvents, targetOverrides,
    selectAquarium, addAquarium, addReading, addTask, addHusbandryEvent, toggleTask, saveTargetOverride, resetTargetOverride,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used within AppDataProvider');
  return value;
}
