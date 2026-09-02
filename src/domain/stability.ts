import { getApplicableParameters, getEffectiveTargetRange, getRangeStatusForTarget } from '@/domain/context';
import type { Aquarium, ParameterKey, ParameterReading, TargetOverride } from '@/domain/models';

export type StabilityScore = {
  score: number | null;
  label: 'Insufficient data' | 'Stable' | 'Watch' | 'Unstable';
  evaluated: number;
  inRange: number;
  outOfRange: number;
  missing: number;
  explanation: string;
};

export function calculateStabilityScore(
  aquarium: Aquarium,
  readings: ParameterReading[],
  overrides: TargetOverride[],
): StabilityScore {
  const applicable = getApplicableParameters(aquarium.type);
  const latest = readings.reduce<Partial<Record<ParameterKey, ParameterReading>>>((result, reading) => {
    if (!result[reading.parameter]) result[reading.parameter] = reading;
    return result;
  }, {});

  let evaluated = 0;
  let inRange = 0;
  let outOfRange = 0;

  for (const parameter of applicable) {
    const reading = latest[parameter];
    if (!reading) continue;
    const target = getEffectiveTargetRange(aquarium.id, aquarium.type, parameter, overrides);
    if (!target) continue;
    evaluated += 1;
    const status = getRangeStatusForTarget(reading, target);
    if (status === 'in_range') inRange += 1;
    else outOfRange += 1;
  }

  const missing = Math.max(0, applicable.length - evaluated);

  if (evaluated < 2) {
    return {
      score: null,
      label: 'Insufficient data',
      evaluated,
      inRange,
      outOfRange,
      missing,
      explanation: 'Log at least two targeted parameters to establish a first stability score.',
    };
  }

  const score = Math.round((inRange / evaluated) * 100);
  const label = score >= 85 ? 'Stable' : score >= 65 ? 'Watch' : 'Unstable';

  return {
    score,
    label,
    evaluated,
    inRange,
    outOfRange,
    missing,
    explanation: `${inRange} of ${evaluated} measured targeted parameters are currently within range. ${missing} applicable parameter${missing === 1 ? '' : 's'} have no current reading.`,
  };
}
