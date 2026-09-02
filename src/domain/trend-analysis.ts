import { getRangeStatusForTarget, type TargetRange } from '@/domain/context';
import { parameterCatalog, type ParameterKey, type ParameterReading } from '@/domain/models';

export type TrendDirection = 'rising' | 'falling' | 'steady';

export type TrendAnalysis = {
  parameter: ParameterKey;
  readings: ParameterReading[];
  direction: TrendDirection;
  ratePerDay: number;
  spanDays: number;
  persistence: number;
  outOfRangeCount: number;
  summary: string;
};

const DAY_MS = 86_400_000;
const WINDOW_MS = 14 * DAY_MS;
const steadyRateThresholds: Record<ParameterKey, number> = {
  temperature: 0.15,
  ph: 0.03,
  salinity: 0.15,
  alkalinity: 0.1,
  ammonia: 0.02,
  nitrate: 0.5,
  phosphate: 0.01,
  calcium: 3,
  magnesium: 7,
};

export function analyzeTrend(
  parameter: ParameterKey,
  readings: ParameterReading[],
  target: TargetRange | null,
): TrendAnalysis | null {
  const matching = readings
    .filter((reading) => reading.parameter === parameter)
    .slice(0, 8)
    .filter((reading, _, all) => Date.parse(all[0].recordedAt) - Date.parse(reading.recordedAt) <= WINDOW_MS)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  if (matching.length < 3) return null;

  const first = matching[0];
  const last = matching[matching.length - 1];
  const spanMs = Date.parse(last.recordedAt) - Date.parse(first.recordedAt);
  if (spanMs <= 0) return null;

  const spanDays = Math.max(spanMs / DAY_MS, 1 / 24);
  const ratePerDay = (last.value - first.value) / spanDays;
  const threshold = steadyRateThresholds[parameter];
  const direction: TrendDirection =
    ratePerDay > threshold ? 'rising' :
    ratePerDay < -threshold ? 'falling' :
    'steady';

  let outOfRangeCount = 0;
  let persistence = 0;
  if (target) {
    outOfRangeCount = matching.filter((reading) => getRangeStatusForTarget(reading, target) !== 'in_range').length;
    for (let index = matching.length - 1; index >= 0; index -= 1) {
      if (getRangeStatusForTarget(matching[index], target) === 'in_range') break;
      persistence += 1;
    }
  }

  const definition = parameterCatalog[parameter];
  const rateText = Math.abs(ratePerDay).toFixed(definition.decimals);
  const directionText = direction === 'steady' ? 'holding relatively steady' : `${direction} about ${rateText} ${definition.unit}/day`;
  const persistenceText = persistence >= 2
    ? ` The latest ${persistence} readings are outside the configured target.`
    : '';

  return {
    parameter,
    readings: matching,
    direction,
    ratePerDay,
    spanDays,
    persistence,
    outOfRangeCount,
    summary: `${definition.label} is ${directionText} across ${matching.length} recent readings.${persistenceText}`,
  };
}
