export const aquariumTypes = [
  'reef',
  'saltwater',
  'freshwater',
  'planted',
  'quarantine',
  'pond',
  'aquaculture',
  'custom',
] as const;
export type AquariumType = (typeof aquariumTypes)[number];

export type Aquarium = {
  id: string;
  name: string;
  type: AquariumType;
  volumeGallons: number;
  createdAt: string;
};

export const parameterCatalog = {
  temperature: { label: 'Temperature', unit: '°F', icon: 'thermometer-outline', hardMin: 32, hardMax: 120, decimals: 1 },
  ph: { label: 'pH', unit: 'pH', icon: 'flask-outline', hardMin: 0, hardMax: 14, decimals: 2 },
  salinity: { label: 'Salinity', unit: 'ppt', icon: 'water-outline', hardMin: 0, hardMax: 60, decimals: 1 },
  alkalinity: { label: 'Alkalinity', unit: 'dKH', icon: 'analytics-outline', hardMin: 0, hardMax: 30, decimals: 1 },
  ammonia: { label: 'Ammonia', unit: 'ppm', icon: 'warning-outline', hardMin: 0, hardMax: 100, decimals: 2 },
  nitrate: { label: 'Nitrate', unit: 'ppm', icon: 'leaf-outline', hardMin: 0, hardMax: 1000, decimals: 1 },
  phosphate: { label: 'Phosphate', unit: 'ppm', icon: 'beaker-outline', hardMin: 0, hardMax: 100, decimals: 3 },
  calcium: { label: 'Calcium', unit: 'ppm', icon: 'diamond-outline', hardMin: 0, hardMax: 1000, decimals: 0 },
  magnesium: { label: 'Magnesium', unit: 'ppm', icon: 'layers-outline', hardMin: 0, hardMax: 3000, decimals: 0 },
} as const;

export type ParameterKey = keyof typeof parameterCatalog;

export const readingSources = ['manual_user', 'photo_interpreted', 'imported', 'calculated', 'brmc_telemetry'] as const;
export type ReadingSource = (typeof readingSources)[number];

export type ParameterReading = {
  id: string;
  aquariumId: string;
  parameter: ParameterKey;
  value: number;
  unit: string;
  recordedAt: string;
  note: string | null;
  source: ReadingSource;
  confidence: number | null;
  confirmedAt: string | null;
};

export type TargetOverride = {
  aquariumId: string;
  parameter: ParameterKey;
  min: number;
  max: number;
  updatedAt: string;
};

export type MaintenanceTask = {
  id: string;
  aquariumId: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type NewAquarium = Pick<Aquarium, 'name' | 'type' | 'volumeGallons'>;
export type NewReading = Pick<ParameterReading, 'parameter' | 'value' | 'note'> & { recordedAt?: string };
export type NewTask = Pick<MaintenanceTask, 'title' | 'dueAt'>;


export const husbandryEventKinds = ['water_change', 'feeding', 'dosing', 'observation'] as const;
export type HusbandryEventKind = (typeof husbandryEventKinds)[number];

export type HusbandryEvent = {
  id: string;
  aquariumId: string;
  kind: HusbandryEventKind;
  occurredAt: string;
  amount: number | null;
  unit: string | null;
  subject: string | null;
  note: string | null;
  createdAt: string;
};

export type NewHusbandryEvent = Pick<HusbandryEvent, 'kind' | 'amount' | 'unit' | 'subject' | 'note'> & {
  occurredAt?: string;
};


export const livestockKinds = ['fish', 'coral', 'invertebrate', 'plant', 'other'] as const;
export type LivestockKind = (typeof livestockKinds)[number];
export const livestockStatuses = ['active', 'quarantine', 'removed', 'deceased'] as const;
export type LivestockStatus = (typeof livestockStatuses)[number];

export type Livestock = {
  id: string;
  aquariumId: string;
  name: string;
  species: string | null;
  kind: LivestockKind;
  quantity: number;
  status: LivestockStatus;
  acquiredAt: string | null;
  note: string | null;
  createdAt: string;
};
export type NewLivestock = Pick<Livestock, 'name' | 'species' | 'kind' | 'quantity' | 'status' | 'acquiredAt' | 'note'>;

export const equipmentKinds = ['lighting', 'filtration', 'pump', 'heater', 'doser', 'monitor', 'other'] as const;
export type EquipmentKind = (typeof equipmentKinds)[number];
export const equipmentStatuses = ['active', 'spare', 'service', 'retired'] as const;
export type EquipmentStatus = (typeof equipmentStatuses)[number];

export type Equipment = {
  id: string;
  aquariumId: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  kind: EquipmentKind;
  status: EquipmentStatus;
  installedAt: string | null;
  warrantyEndsAt: string | null;
  note: string | null;
  createdAt: string;
};
export type NewEquipment = Pick<Equipment, 'name' | 'manufacturer' | 'model' | 'kind' | 'status' | 'installedAt' | 'warrantyEndsAt' | 'note'>;


export const inventoryEventKinds = ['status_change', 'service', 'note'] as const;
export type InventoryEventKind = (typeof inventoryEventKinds)[number];

export type InventoryEvent = {
  id: string;
  aquariumId: string;
  entityType: 'livestock' | 'equipment';
  entityId: string;
  kind: InventoryEventKind;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
};
