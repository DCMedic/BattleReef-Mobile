import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  createAquarium as insertAquarium,
  createHusbandryEvent as insertHusbandryEvent,
  createPhotoRecord as insertPhotoRecord,
  createLivestock as insertLivestock,
  createEquipment as insertEquipment,
  createReading as insertReading,
  createTask as insertTask,
  deleteTargetOverride as removeTargetOverride,
  getSelectedAquariumId,
  listAquariums,
  listHusbandryEvents,
  listAllHusbandryEvents,
  listPhotos,
  listAllPhotos,
  listLivestock,
  listEquipment,
  listInventoryEvents,
  listAllInventoryEvents,
  listReadings,
  listAllReadings,
  listTargetOverrides,
  listTasks,
  saveSelectedAquariumId,
  saveTargetOverride as upsertTargetOverride,
  completeTask as persistTaskCompletion,
  reopenTask as persistTaskReopen,
  setTaskNotificationId,
  updateLivestockStatus as persistLivestockStatus,
  updateEquipmentStatus as persistEquipmentStatus,
  updatePhotoMediaState as persistPhotoMediaState,
  recordEquipmentService as persistEquipmentService,
} from '@/data/repository';
import { cancelTaskReminder, nextRecurringDue, scheduleTaskReminder } from '@/services/task-reminders';
import { restoreBackup } from '@/services/data-restore';
import type { AquariumExportData, BattleReefBackup } from '@/services/data-export';
import type {
  Aquarium,
  HusbandryEvent,
  Livestock,
  Equipment,
  InventoryEvent,
  LivestockStatus,
  EquipmentStatus,
  MaintenanceTask,
  NewAquarium,
  NewHusbandryEvent,
  NewLivestock,
  NewEquipment,
  NewReading,
  NewTask,
  ParameterKey,
  ParameterReading,
  PhotoRecord,
  NewPhotoRecord,
  TargetOverride,
} from '@/domain/models';

type AppDataValue = {
  loading: boolean;
  dataError: string | null;
  aquariums: Aquarium[];
  selectedAquarium: Aquarium | null;
  readings: ParameterReading[];
  tasks: MaintenanceTask[];
  husbandryEvents: HusbandryEvent[];
  livestock: Livestock[];
  equipment: Equipment[];
  inventoryEvents: InventoryEvent[];
  targetOverrides: TargetOverride[];
  photos: PhotoRecord[];
  selectAquarium: (aquariumId: string) => Promise<void>;
  addAquarium: (input: NewAquarium) => Promise<void>;
  addReading: (input: NewReading) => Promise<void>;
  addTask: (input: NewTask) => Promise<void>;
  addHusbandryEvent: (input: NewHusbandryEvent) => Promise<void>;
  addLivestock: (input: NewLivestock) => Promise<void>;
  addEquipment: (input: NewEquipment) => Promise<void>;
  setLivestockStatus: (item: Livestock, status: LivestockStatus, note?: string) => Promise<void>;
  setEquipmentStatus: (item: Equipment, status: EquipmentStatus, note?: string) => Promise<void>;
  addEquipmentService: (item: Equipment, note: string) => Promise<void>;
  addPhoto: (input: NewPhotoRecord) => Promise<void>;
  markPhotoMissing: (photoId: string) => Promise<void>;
  toggleTask: (task: MaintenanceTask) => Promise<void>;
  saveTargetOverride: (parameter: ParameterKey, min: number, max: number) => Promise<void>;
  resetTargetOverride: (parameter: ParameterKey) => Promise<void>;
  restoreBackupArchive: (backup: BattleReefBackup) => Promise<void>;
  getSelectedAquariumExportData: () => Promise<AquariumExportData>;
};

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null);
  const [readings, setReadings] = useState<ParameterReading[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [husbandryEvents, setHusbandryEvents] = useState<HusbandryEvent[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>([]);
  const [targetOverrides, setTargetOverrides] = useState<TargetOverride[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  const loadDetails = useCallback(async (aquariumId: string | null) => {
    if (!aquariumId) {
      setReadings([]);
      setTasks([]);
      setHusbandryEvents([]);
      setLivestock([]);
      setEquipment([]);
      setInventoryEvents([]);
      setTargetOverrides([]);
      setPhotos([]);
      return;
    }
    const [nextReadings, nextTasks, nextEvents, nextOverrides, nextLivestock, nextEquipment, nextInventoryEvents, nextPhotos] = await Promise.all([
      listReadings(db, aquariumId),
      listTasks(db, aquariumId),
      listHusbandryEvents(db, aquariumId),
      listTargetOverrides(db, aquariumId),
      listLivestock(db, aquariumId),
      listEquipment(db, aquariumId),
      listInventoryEvents(db, aquariumId),
      listPhotos(db, aquariumId),
    ]);
    setReadings(nextReadings);
    setTasks(nextTasks);
    setHusbandryEvents(nextEvents);
    setTargetOverrides(nextOverrides);
    setLivestock(nextLivestock);
    setEquipment(nextEquipment);
    setInventoryEvents(nextInventoryEvents);
    setPhotos(nextPhotos);
  }, [db]);

  const bootstrap = useCallback(async () => {
    setDataError(null);
    try {
      const nextAquariums = await listAquariums(db);
      const savedId = await getSelectedAquariumId(db);
      const nextId = nextAquariums.some((item) => item.id === savedId) ? savedId : (nextAquariums[0]?.id ?? null);
      setAquariums(nextAquariums);
      setSelectedAquariumId(nextId);
      await loadDetails(nextId);
    } catch (caught) {
      setDataError(caught instanceof Error ? caught.message : 'BattleReef could not load local aquarium data.');
    } finally {
      setLoading(false);
    }
  }, [db, loadDetails]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  const selectAquarium = useCallback(async (aquariumId: string) => {
    const previousId = selectedAquariumId;
    if (aquariumId === previousId) return;
    if (!aquariums.some((item) => item.id === aquariumId)) throw new Error('Aquarium is no longer available.');

    try {
      await loadDetails(aquariumId);
      await saveSelectedAquariumId(db, aquariumId);
      setSelectedAquariumId(aquariumId);
    } catch (caught) {
      if (previousId) await loadDetails(previousId);
      throw caught;
    }
  }, [aquariums, db, loadDetails, selectedAquariumId]);

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
    const task = await insertTask(db, selectedAquariumId, input);
    const notificationId = await scheduleTaskReminder(task);
    if (notificationId) await setTaskNotificationId(db, task.id, notificationId);
    setTasks(await listTasks(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addHusbandryEvent = useCallback(async (input: NewHusbandryEvent) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before logging activity.');
    await insertHusbandryEvent(db, selectedAquariumId, input);
    setHusbandryEvents(await listHusbandryEvents(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addLivestock = useCallback(async (input: NewLivestock) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before adding livestock.');
    await insertLivestock(db, selectedAquariumId, input);
    setLivestock(await listLivestock(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addEquipment = useCallback(async (input: NewEquipment) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before adding equipment.');
    await insertEquipment(db, selectedAquariumId, input);
    setEquipment(await listEquipment(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const setLivestockStatus = useCallback(async (item: Livestock, status: LivestockStatus, note?: string) => {
    await persistLivestockStatus(db, item, status, note);
    if (selectedAquariumId) {
      setLivestock(await listLivestock(db, selectedAquariumId));
      setInventoryEvents(await listInventoryEvents(db, selectedAquariumId));
    }
  }, [db, selectedAquariumId]);

  const setEquipmentStatus = useCallback(async (item: Equipment, status: EquipmentStatus, note?: string) => {
    await persistEquipmentStatus(db, item, status, note);
    if (selectedAquariumId) {
      setEquipment(await listEquipment(db, selectedAquariumId));
      setInventoryEvents(await listInventoryEvents(db, selectedAquariumId));
    }
  }, [db, selectedAquariumId]);

  const addEquipmentService = useCallback(async (item: Equipment, note: string) => {
    await persistEquipmentService(db, item, note);
    if (selectedAquariumId) setInventoryEvents(await listInventoryEvents(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const addPhoto = useCallback(async (input: NewPhotoRecord) => {
    if (!selectedAquariumId) throw new Error('Create an aquarium before adding photos.');
    await insertPhotoRecord(db, selectedAquariumId, input);
    setPhotos(await listPhotos(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const markPhotoMissing = useCallback(async (photoId: string) => {
    await persistPhotoMediaState(db, photoId, 'missing');
    if (selectedAquariumId) setPhotos(await listPhotos(db, selectedAquariumId));
  }, [db, selectedAquariumId]);

  const toggleTask = useCallback(async (task: MaintenanceTask) => {
    if (task.completedAt) {
      await persistTaskReopen(db, task);
      const notificationId = await scheduleTaskReminder({ ...task, completedAt: null });
      if (notificationId) await setTaskNotificationId(db, task.id, notificationId);
    } else {
      await cancelTaskReminder(task.notificationId);
      const nextDueAt = nextRecurringDue(task.dueAt, task.recurrence);
      const nextTask = await persistTaskCompletion(db, task, nextDueAt);
      if (nextTask) {
        const notificationId = await scheduleTaskReminder(nextTask);
        if (notificationId) await setTaskNotificationId(db, nextTask.id, notificationId);
      }
    }
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

  const getSelectedAquariumExportData = useCallback(async (): Promise<AquariumExportData> => {
    const aquarium = aquariums.find((item) => item.id === selectedAquariumId);
    if (!aquarium) throw new Error('Select an aquarium before exporting data.');

    const [allReadings, allHusbandryEvents, allInventoryEvents, allPhotos, allTasks, allLivestock, allEquipment, allTargets] = await Promise.all([
      listAllReadings(db, aquarium.id),
      listAllHusbandryEvents(db, aquarium.id),
      listAllInventoryEvents(db, aquarium.id),
      listAllPhotos(db, aquarium.id),
      listTasks(db, aquarium.id),
      listLivestock(db, aquarium.id),
      listEquipment(db, aquarium.id),
      listTargetOverrides(db, aquarium.id),
    ]);

    return {
      aquarium,
      readings: allReadings,
      tasks: allTasks,
      husbandryEvents: allHusbandryEvents,
      livestock: allLivestock,
      equipment: allEquipment,
      inventoryEvents: allInventoryEvents,
      targetOverrides: allTargets,
      photos: allPhotos,
    };
  }, [aquariums, db, selectedAquariumId]);

  const restoreBackupArchive = useCallback(async (backup: BattleReefBackup) => {
    const restoredAquariumId = await restoreBackup(db, backup);
    const restoredTasks = await listTasks(db, restoredAquariumId);

    for (const task of restoredTasks) {
      if (!task.completedAt && task.dueAt) {
        const notificationId = await scheduleTaskReminder(task);
        if (notificationId) await setTaskNotificationId(db, task.id, notificationId);
      }
    }

    setAquariums(await listAquariums(db));
    setSelectedAquariumId(restoredAquariumId);
    await saveSelectedAquariumId(db, restoredAquariumId);
    await loadDetails(restoredAquariumId);
  }, [db, loadDetails]);

  const selectedAquarium = useMemo(
    () => aquariums.find((item) => item.id === selectedAquariumId) ?? null,
    [aquariums, selectedAquariumId],
  );

  const value = useMemo<AppDataValue>(() => ({
    loading, dataError, aquariums, selectedAquarium, readings, tasks, husbandryEvents, livestock, equipment, inventoryEvents, targetOverrides, photos,
    selectAquarium, addAquarium, addReading, addTask, addHusbandryEvent, addLivestock, addEquipment, setLivestockStatus, setEquipmentStatus, addEquipmentService, addPhoto, markPhotoMissing, toggleTask, saveTargetOverride, resetTargetOverride, restoreBackupArchive, getSelectedAquariumExportData,
  }), [
    loading, dataError, aquariums, selectedAquarium, readings, tasks, husbandryEvents, livestock, equipment, inventoryEvents, targetOverrides, photos,
    selectAquarium, addAquarium, addReading, addTask, addHusbandryEvent, addLivestock, addEquipment, setLivestockStatus, setEquipmentStatus, addEquipmentService, addPhoto, markPhotoMissing, toggleTask, saveTargetOverride, resetTargetOverride, restoreBackupArchive, getSelectedAquariumExportData,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used within AppDataProvider');
  return value;
}
