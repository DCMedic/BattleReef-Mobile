import { getEffectiveTargetRange, getRangeStatusForTarget, type TargetRange } from '@/domain/context';
import { parameterCatalog, type Aquarium, type ParameterKey, type ParameterReading, type TargetOverride } from '@/domain/models';
import { analyzeTrend, type TrendAnalysis } from '@/domain/trend-analysis';

export type AdvisorySeverity = 'info' | 'watch' | 'attention';

export type Advisory = {
  parameter: ParameterKey;
  severity: AdvisorySeverity;
  title: string;
  summary: string;
  evidence: string[];
  target: TargetRange;
  latest: ParameterReading;
  trend: TrendAnalysis | null;
};

function movingFartherFromRange(
  status: ReturnType<typeof getRangeStatusForTarget>,
  trend: TrendAnalysis | null,
) {
  if (!trend) return false;
  return (status === 'low' && trend.direction === 'falling') ||
    (status === 'high' && trend.direction === 'rising');
}

function movingTowardRange(
  status: ReturnType<typeof getRangeStatusForTarget>,
  trend: TrendAnalysis | null,
) {
  if (!trend) return false;
  return (status === 'low' && trend.direction === 'rising') ||
    (status === 'high' && trend.direction === 'falling');
}

export function buildAdvisory(
  aquarium: Aquarium,
  parameter: ParameterKey,
  readings: ParameterReading[],
  overrides: TargetOverride[],
): Advisory | null {
  const latest = readings.find((reading) => reading.parameter === parameter);
  if (!latest) return null;

  const target = getEffectiveTargetRange(aquarium.id, aquarium.type, parameter, overrides);
  if (!target) return null;

  const status = getRangeStatusForTarget(latest, target);
  if (status === 'in_range' || status === 'unconfigured') return null;

  const trend = analyzeTrend(parameter, readings, target);
  const farther = movingFartherFromRange(status, trend);
  const toward = movingTowardRange(status, trend);
  const persistence = trend?.persistence ?? 1;
  const definition = parameterCatalog[parameter];
  const side = status === 'low' ? 'below' : 'above';

  let severity: AdvisorySeverity = 'info';
  if (persistence >= 3 || farther) severity = 'watch';
  if (persistence >= 3 && farther) severity = 'attention';
  if (toward && persistence < 3) severity = 'info';

  const evidence = [
    `Latest: ${latest.value} ${latest.unit}, ${side} target ${target.min}–${target.max} ${latest.unit}.`,
  ];

  if (trend) {
    evidence.push(`Recent trend: ${trend.direction} across ${trend.readings.length} readings.`);
    if (trend.persistence >= 2) {
      evidence.push(`${trend.persistence} consecutive readings are outside the configured target.`);
    }
  }

  const movement =
    farther ? 'and the recent trend is moving farther from the target range' :
    toward ? 'while the recent trend is moving back toward the target range' :
    'with no clear directional trend yet';

  return {
    parameter,
    severity,
    title: `${definition.label} is ${side} target`,
    summary: `${definition.label} remains ${side} your configured target ${movement}. Review recent husbandry context and confirm the next reading before making a major change.`,
    evidence,
    target,
    latest,
    trend,
  };
}

export function buildAdvisories(
  aquarium: Aquarium,
  readings: ParameterReading[],
  overrides: TargetOverride[],
) {
  const parameters = Array.from(new Set(readings.map((reading) => reading.parameter)));
  const rank: Record<AdvisorySeverity, number> = { attention: 3, watch: 2, info: 1 };

  return parameters
    .map((parameter) => buildAdvisory(aquarium, parameter, readings, overrides))
    .filter((advisory): advisory is Advisory => Boolean(advisory))
    .sort((a, b) => rank[b.severity] - rank[a.severity] || b.latest.recordedAt.localeCompare(a.latest.recordedAt));
}
