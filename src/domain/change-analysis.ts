import { parameterCatalog, type HusbandryEvent, type MaintenanceTask, type ParameterKey, type ParameterReading } from '@/domain/models';

export type ChangeContextItem = {
  kind: 'husbandry' | 'maintenance';
  label: string;
  at: string;
  detail: string;
};

export type ChangeAnalysis = {
  parameter: ParameterKey;
  current: ParameterReading;
  previous: ParameterReading;
  delta: number;
  percentChange: number | null;
  material: boolean;
  direction: 'up' | 'down' | 'flat';
  summary: string;
  context: ChangeContextItem[];
};

const materialThresholds: Record<ParameterKey, number> = {
  temperature: 1,
  ph: 0.15,
  salinity: 1,
  alkalinity: 0.5,
  ammonia: 0.1,
  nitrate: 5,
  phosphate: 0.05,
  calcium: 25,
  magnesium: 50,
};

const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function formatEvent(event: HusbandryEvent): ChangeContextItem {
  const labels = {
    water_change: 'Water change',
    feeding: 'Feeding',
    dosing: 'Dosing',
    observation: 'Observation',
  } as const;

  const detail = [
    event.subject,
    event.amount !== null ? `${event.amount}${event.unit ? ` ${event.unit}` : ''}` : null,
    event.note,
  ].filter(Boolean).join(' · ');

  return {
    kind: 'husbandry',
    label: labels[event.kind],
    at: event.occurredAt,
    detail: detail || 'Logged activity',
  };
}

export function analyzeLatestChange(
  parameter: ParameterKey,
  readings: ParameterReading[],
  husbandryEvents: HusbandryEvent[],
  tasks: MaintenanceTask[],
): ChangeAnalysis | null {
  const matching = readings.filter((reading) => reading.parameter === parameter);
  const current = matching[0];
  const previous = matching[1];

  if (!current || !previous) return null;

  const delta = current.value - previous.value;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const percentChange = previous.value === 0 ? null : (delta / Math.abs(previous.value)) * 100;
  const material = Math.abs(delta) >= materialThresholds[parameter];

  const currentTime = Date.parse(current.recordedAt);
  const previousTime = Date.parse(previous.recordedAt);
  const windowStart = Math.max(previousTime, currentTime - LOOKBACK_MS);

  const context = [
    ...husbandryEvents
      .filter((event) => {
        const at = Date.parse(event.occurredAt);
        return at > windowStart && at <= currentTime;
      })
      .map(formatEvent),
    ...tasks
      .filter((task) => task.completedAt)
      .filter((task) => {
        const at = Date.parse(task.completedAt!);
        return at > windowStart && at <= currentTime;
      })
      .map<ChangeContextItem>((task) => ({
        kind: 'maintenance',
        label: 'Maintenance completed',
        at: task.completedAt!,
        detail: task.title,
      })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  const definition = parameterCatalog[parameter];
  const amountText = `${Math.abs(delta).toFixed(definition.decimals)} ${definition.unit}`;
  const summary = material
    ? `${definition.label} moved ${direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'without a net change'} by ${amountText} since the previous reading.`
    : `${definition.label} changed by ${amountText}, below BattleReef's current material-change threshold.`;

  return {
    parameter,
    current,
    previous,
    delta,
    percentChange,
    material,
    direction,
    summary,
    context,
  };
}

export function findMaterialChanges(
  readings: ParameterReading[],
  husbandryEvents: HusbandryEvent[],
  tasks: MaintenanceTask[],
): ChangeAnalysis[] {
  const parameters = Array.from(new Set(readings.map((reading) => reading.parameter)));
  return parameters
    .map((parameter) => analyzeLatestChange(parameter, readings, husbandryEvents, tasks))
    .filter((analysis): analysis is ChangeAnalysis => Boolean(analysis?.material))
    .sort((a, b) => b.current.recordedAt.localeCompare(a.current.recordedAt));
}
