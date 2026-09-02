import type { PhotoRecord } from '@/domain/models';

export type PhotoComparability = {
  level: 'strong' | 'moderate' | 'weak';
  matched: number;
  total: number;
  reasons: string[];
};

export function assessPhotoComparability(a: PhotoRecord, b: PhotoRecord): PhotoComparability {
  const checks = [
    {
      matched: a.linkedLivestockId === b.linkedLivestockId,
      reason: a.linkedLivestockId === b.linkedLivestockId ? 'Same linked subject' : 'Different linked subjects',
    },
    {
      matched: Boolean(a.viewpoint && b.viewpoint && a.viewpoint === b.viewpoint),
      reason: a.viewpoint && b.viewpoint && a.viewpoint === b.viewpoint
        ? `Same viewpoint: ${a.viewpoint}`
        : 'Viewpoint differs or is not recorded',
    },
    {
      matched: Boolean(a.lightingProfile && b.lightingProfile && a.lightingProfile === b.lightingProfile),
      reason: a.lightingProfile && b.lightingProfile && a.lightingProfile === b.lightingProfile
        ? `Same lighting: ${a.lightingProfile}`
        : 'Lighting differs or is not recorded',
    },
    {
      matched: a.guidedCapture && b.guidedCapture,
      reason: a.guidedCapture && b.guidedCapture ? 'Both photos used guided capture' : 'One or both photos were not guided',
    },
  ];

  const matched = checks.filter((check) => check.matched).length;
  const level = matched >= 4 ? 'strong' : matched >= 2 ? 'moderate' : 'weak';

  return {
    level,
    matched,
    total: checks.length,
    reasons: checks.map((check) => check.reason),
  };
}
