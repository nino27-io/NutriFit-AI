export type Gender = 'pria' | 'wanita';

export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export type FitnessGoal = 'turun_bb' | 'pertahankan_bb' | 'naik_bb';

export type BMICategory =
  | 'Kekurangan Berat Badan'
  | 'Normal (Ideal)'
  | 'Kelebihan Berat Badan'
  | 'Obesitas';

export type WHRRiskLevel = 'Risiko Rendah' | 'Risiko Meningkat';

export interface AnthropometricInput {
  ageYears: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  waistCm: number;
  hipCm: number;
  neckCm?: number | null;
  activityFactor: ActivityFactor;
  goal?: FitnessGoal;
}

export interface SafetyScreeningInput {
  ageYears: number;
  isPregnantOrBreastfeeding: boolean;
  hasEatingDisorderHistory: boolean;
  hasDiabetes: boolean;
  hasChronicDisease: boolean;
  hasExplicitPDPafConsent: boolean;
}

export interface SafetyScreeningResult {
  canGenerateAutoPlan: boolean;
  requiresProfessionalReferral: boolean;
  blockedReasons: string[];
  disclaimerText: string;
}

export interface BodyFatResult {
  available: boolean;
  label: string;
  minPercentage: number | null;
  maxPercentage: number | null;
}

export interface CalorieTargetResult {
  bmr: number;
  tdee: number;
  safeMinimumCalories: number;
  recommendedCalories: number;
  maxWeeklyWeightLossKg: { min: number; max: number } | null;
  wasClampedToSafetyFloor: boolean;
}