export type BiologicalSex = 'male' | 'female';

export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export type FitnessGoal = 'lose' | 'maintain' | 'gain';

export type BMICategoryAsiaPacific =
  | 'Kekurangan Berat Badan'
  | 'Normal (Ideal)'
  | 'Kelebihan Berat Badan'
  | 'Obesitas';

export type WHRCategory = 'Risiko Rendah' | 'Risiko Sedang' | 'Risiko Tinggi';

export interface IdealWeightRange {
  minKg: number;
  maxKg: number;
  midpointKg: number;
}

export interface BodyFatRange {
  estimatePct: number;
  minPct: number;
  maxPct: number;
  category: string;
}

export interface CalorieTargetResult {
  targetCalories: number;
  rawTargetCalories: number;
  wasClampedToFloor: boolean;
  minimumSafeCalories: number;
  explanation: string;
}

export interface MacroDistribution {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface AnthropometricInput {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  neckCm?: number | null;
  activityFactor: ActivityFactor;
  goal: FitnessGoal;
  dailyBudgetIdr?: number;
}

export interface FullCalculationResult {
  bmi: number;
  bmiCategory: BMICategoryAsiaPacific;
  bmiStandardUsed: 'Asia-Pasifik (WHO WPRO)';
  idealWeight: IdealWeightRange;
  whr: number;
  whrCategory: WHRCategory;
  bodyFat: BodyFatRange | null;
  bmr: number;
  tdee: number;
  calorieTarget: CalorieTargetResult;
  macros: MacroDistribution;
}

export interface SafetyScreeningInput {
  hasExplicitPDPafConsent: boolean;
  ageYears: number;
  isPregnantOrBreastfeeding: boolean;
  hasEatingDisorderHistory: boolean;
  hasDiabetes: boolean;
  hasChronicDisease: boolean;
}

export interface SafetyScreeningResult {
  canGenerateAutoPlan: boolean;
  requiresProfessionalReferral: boolean;
  blockedReasons: string[];
  disclaimerText: string;
}