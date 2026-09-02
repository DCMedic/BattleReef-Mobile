import {
  parameterCatalog,
  type AquariumType,
  type ParameterKey,
  type ParameterReading,
  type TargetOverride,
} from '@/domain/models';

export type TargetRange = { min: number; max: number };

const sharedFreshwater: Partial<Record<ParameterKey, TargetRange>> = {
  temperature: { min: 74, max: 80 },
  ph: { min: 6.5, max: 8.0 },
  ammonia: { min: 0, max: 0.1 },
  nitrate: { min: 0, max: 40 },
};

const targetsByAquariumType: Record<AquariumType, Partial<Record<ParameterKey, TargetRange>>> = {
  reef: {
    temperature: { min: 76, max: 80 },
    ph: { min: 7.8, max: 8.5 },
    salinity: { min: 34, max: 36 },
    alkalinity: { min: 7, max: 11 },
    ammonia: { min: 0, max: 0.1 },
    nitrate: { min: 1, max: 20 },
    phosphate: { min: 0.02, max: 0.15 },
    calcium: { min: 380, max: 460 },
    magnesium: { min: 1200, max: 1450 },
  },
  saltwater: {
    temperature: { min: 76, max: 80 },
    ph: { min: 7.8, max: 8.5 },
    salinity: { min: 32, max: 36 },
    ammonia: { min: 0, max: 0.1 },
    nitrate: { min: 0, max: 40 },
  },
  freshwater: sharedFreshwater,
  planted: { ...sharedFreshwater, ph: { min: 6.0, max: 7.8 }, nitrate: { min: 5, max: 40 }, phosphate: { min: 0.1, max: 3.0 } },
  quarantine: { temperature: { min: 72, max: 82 }, ph: { min: 6.5, max: 8.5 }, salinity: { min: 0, max: 36 }, ammonia: { min: 0, max: 0.1 }, nitrate: { min: 0, max: 40 } },
  pond: { temperature: { min: 50, max: 85 }, ph: { min: 6.5, max: 8.5 }, ammonia: { min: 0, max: 0.1 }, nitrate: { min: 0, max: 50 }, phosphate: { min: 0, max: 1.0 } },
  aquaculture: { temperature: { min: 65, max: 85 }, ph: { min: 6.5, max: 8.5 }, salinity: { min: 0, max: 36 }, ammonia: { min: 0, max: 0.1 }, nitrate: { min: 0, max: 80 } },
  custom: {},
};

export function getApplicableParameters(type: AquariumType): ParameterKey[] {
  const configured = Object.keys(targetsByAquariumType[type]) as ParameterKey[];
  return configured.length > 0 ? configured : (Object.keys(parameterCatalog) as ParameterKey[]);
}

export function getDefaultTargetRange(type: AquariumType, parameter: ParameterKey): TargetRange | null {
  return targetsByAquariumType[type][parameter] ?? null;
}

export function getEffectiveTargetRange(
  aquariumId: string,
  type: AquariumType,
  parameter: ParameterKey,
  overrides: TargetOverride[],
): TargetRange | null {
  const override = overrides.find((item) => item.aquariumId === aquariumId && item.parameter === parameter);
  return override ? { min: override.min, max: override.max } : getDefaultTargetRange(type, parameter);
}

export type RangeStatus = 'in_range' | 'low' | 'high' | 'unconfigured';

export function getRangeStatusForTarget(reading: ParameterReading, target: TargetRange | null): RangeStatus {
  if (!target) return 'unconfigured';
  if (reading.value < target.min) return 'low';
  if (reading.value > target.max) return 'high';
  return 'in_range';
}

export function getPreviousReading(readings: ParameterReading[], current: ParameterReading): ParameterReading | null {
  return readings.find(
    (candidate) =>
      candidate.parameter === current.parameter &&
      candidate.id !== current.id &&
      candidate.recordedAt < current.recordedAt,
  ) ?? null;
}

export function getDelta(current: ParameterReading, previous: ParameterReading | null) {
  if (!previous) return null;
  return current.value - previous.value;
}
