export const aquariumTypes = ['reef', 'saltwater', 'freshwater', 'pond'] as const;
export type AquariumType = (typeof aquariumTypes)[number];

export type Aquarium = {
  id: string;
  name: string;
  type: AquariumType;
  volumeGallons: number;
  createdAt: string;
};

export const parameterCatalog = {
  temperature: { label: 'Temperature', unit: '\u00b0F', icon: 'thermometer-outline' },
  ph: { label: 'pH', unit: 'pH', icon: 'flask-outline' },
  salinity: { label: 'Salinity', unit: 'ppt', icon: 'water-outline' },
  alkalinity: { label: 'Alkalinity', unit: 'dKH', icon: 'analytics-outline' },
  ammonia: { label: 'Ammonia', unit: 'ppm', icon: 'warning-outline' },
  nitrate: { label: 'Nitrate', unit: 'ppm', icon: 'leaf-outline' },
  phosphate: { label: 'Phosphate', unit: 'ppm', icon: 'beaker-outline' },
  calcium: { label: 'Calcium', unit: 'ppm', icon: 'diamond-outline' },
  magnesium: { label: 'Magnesium', unit: 'ppm', icon: 'layers-outline' },
} as const;

export type ParameterKey = keyof typeof parameterCatalog;

export type ParameterReading = {
  id: string;
  aquariumId: string;
  parameter: ParameterKey;
  value: number;
  unit: string;
  recordedAt: string;
  note: string | null;
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
export type NewReading = Pick<ParameterReading, 'parameter' | 'value' | 'note'>;
export type NewTask = Pick<MaintenanceTask, 'title' | 'dueAt'>;
