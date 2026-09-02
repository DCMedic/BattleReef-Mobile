import { parameterCatalog, type NewAquarium, type NewReading } from '@/domain/models';

export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateAquarium(input: NewAquarium): ValidationResult {
  const name = input.name.trim();

  if (name.length < 2) {
    return { valid: false, message: 'Aquarium name must contain at least 2 characters.' };
  }

  if (name.length > 60) {
    return { valid: false, message: 'Aquarium name cannot exceed 60 characters.' };
  }

  if (!Number.isFinite(input.volumeGallons) || input.volumeGallons <= 0) {
    return { valid: false, message: 'System volume must be greater than zero.' };
  }

  if (input.volumeGallons > 1_000_000) {
    return { valid: false, message: 'System volume is outside the supported range.' };
  }

  return { valid: true };
}

export function validateReading(input: NewReading): ValidationResult {
  const definition = parameterCatalog[input.parameter];

  if (!Number.isFinite(input.value)) {
    return { valid: false, message: 'Enter a valid numeric reading.' };
  }

  if (input.value < definition.hardMin || input.value > definition.hardMax) {
    return {
      valid: false,
      message: `${definition.label} must be between ${definition.hardMin} and ${definition.hardMax} ${definition.unit}.`,
    };
  }

  if ((input.note?.length ?? 0) > 240) {
    return { valid: false, message: 'Notes cannot exceed 240 characters.' };
  }

  if (input.recordedAt && Number.isNaN(Date.parse(input.recordedAt))) {
    return { valid: false, message: 'Reading time is invalid.' };
  }

  return { valid: true };
}
