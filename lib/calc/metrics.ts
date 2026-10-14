import {
  ActivityFactor,
  BMICategory,
  BodyFatResult,
  CalorieTargetResult,
  FitnessGoal,
  Gender,
  WHRRiskLevel,
} from './types';

function assertPositiveNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Input ${fieldName} harus berupa angka positif yang valid.`);
  }
}

/**
 * 1. BMI = kg / (m^2)
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: BMICategory;
} {
  assertPositiveNumber(weightKg, 'berat badan (kg)');
  assertPositiveNumber(heightCm, 'tinggi badan (cm)');

  const heightMeters = heightCm / 100;
  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category: BMICategory = 'Normal (Ideal)';
  if (rawBmi < 18.5) {
    category = 'Kekurangan Berat Badan';
  } else if (rawBmi >= 25 && rawBmi < 30) {
    category = 'Kelebihan Berat Badan';
  } else if (rawBmi >= 30) {
    category = 'Obesitas';
  }

  return { bmi, category };
}

/**
 * 2. WHR = pinggang / pinggul
 * Risiko meningkat: pria > 0.90, wanita > 0.85 (acuan WHO)
 */
export function calculateWHR(
  waistCm: number,
  hipCm: number,
  gender: Gender
): {
  whr: number;
  riskLevel: WHRRiskLevel;
} {
  assertPositiveNumber(waistCm, 'lingkar pinggang (cm)');
  assertPositiveNumber(hipCm, 'lingkar pinggul (cm)');

  const rawWhr = waistCm / hipCm;
  const whr = Math.round(rawWhr * 100) / 100;

  const threshold = gender === 'pria' ? 0.9 : 0.85;
  const riskLevel: WHRRiskLevel =
    rawWhr > threshold ? 'Risiko Meningkat' : 'Risiko Rendah';

  return { whr, riskLevel };
}

/**
 * 3. Lemak tubuh US Navy (log10, cm), butuh lingkar leher:
 * - pria: 86.010*log10(pinggang - leher) - 70.041*log10(tinggi) + 36.76
 * - wanita: 163.205*log10(pinggang + pinggul - leher) - 97.684*log10(tinggi) - 78.387
 * Jika leher tidak diisi: tampilkan "tidak tersedia", jangan menebak.
 * Tampilkan sebagai rentang (+/- 3-4 poin), bukan angka pasti.
 */
export function calculateUSNavyBodyFat(params: {
  gender: Gender;
  heightCm: number;
  waistCm: number;
  hipCm: number;
  neckCm?: number | null;
  rangeMarginPoints?: 3 | 3.5 | 4;
}): BodyFatResult {
  const {
    gender,
    heightCm,
    waistCm,
    hipCm,
    neckCm,
    rangeMarginPoints = 3.5,
  } = params;

  if (neckCm === undefined || neckCm === null || neckCm <= 0) {
    return {
      available: false,
      label: 'tidak tersedia',
      minPercentage: null,
      maxPercentage: null,
    };
  }

  assertPositiveNumber(heightCm, 'tinggi badan (cm)');
  assertPositiveNumber(waistCm, 'lingkar pinggang (cm)');
  assertPositiveNumber(hipCm, 'lingkar pinggul (cm)');

  let estimate: number;

  if (gender === 'pria') {
    const diff = waistCm - neckCm;
    if (diff <= 0) {
      return {
        available: false,
        label: 'tidak tersedia',
        minPercentage: null,
        maxPercentage: null,
      };
    }
    estimate =
      86.01 * Math.log10(diff) - 70.041 * Math.log10(heightCm) + 36.76;
  } else {
    const sumDiff = waistCm + hipCm - neckCm;
    if (sumDiff <= 0) {
      return {
        available: false,
        label: 'tidak tersedia',
        minPercentage: null,
        maxPercentage: null,
      };
    }
    estimate =
      163.205 * Math.log10(sumDiff) -
      97.684 * Math.log10(heightCm) -
      78.387;
  }

  const minPercentage = Math.max(
    2,
    Math.round((estimate - rangeMarginPoints) * 10) / 10
  );
  const maxPercentage = Math.round((estimate + rangeMarginPoints) * 10) / 10;

  return {
    available: true,
    label: `${minPercentage}% - ${maxPercentage}%`,
    minPercentage,
    maxPercentage,
  };
}

/**
 * 4. BMR Mifflin-St Jeor:
 * 10*kg + 6.25*cm - 5*usia + 5 (pria) atau - 161 (wanita)
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender
): number {
  assertPositiveNumber(weightKg, 'berat badan (kg)');
  assertPositiveNumber(heightCm, 'tinggi badan (cm)');
  assertPositiveNumber(ageYears, 'usia (tahun)');

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const rawBmr = gender === 'pria' ? base + 5 : base - 161;

  return Math.round(rawBmr);
}

/**
 * 5. TDEE = BMR x faktor aktivitas: 1.2 / 1.375 / 1.55 / 1.725 / 1.9
 */
export function calculateTDEE(
  bmr: number,
  activityFactor: ActivityFactor
): number {
  assertPositiveNumber(bmr, 'BMR');
  return Math.round(bmr * activityFactor);
}

/**
 * 6. Perhitungan Target Kalori Aman sesuai Aturan Keselamatan:
 * - Tidak boleh di bawah BMR
 * - Tidak boleh di bawah 1200 (wanita) / 1500 (pria)
 * - Defisit maksimal sekitar 20% TDEE
 * - Penurunan berat badan maksimal 0.5-1 kg/minggu
 */
export function calculateSafeCalorieTarget(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  activityFactor: ActivityFactor;
  goal?: FitnessGoal;
}): CalorieTargetResult {
  const {
    weightKg,
    heightCm,
    ageYears,
    gender,
    activityFactor,
    goal = 'pertahankan_bb',
  } = params;

  const bmr = calculateBMR(weightKg, heightCm, ageYears, gender);
  const tdee = calculateTDEE(bmr, activityFactor);

  const genderAbsoluteFloor = gender === 'pria' ? 1500 : 1200;
  const safeMinimumCalories = Math.max(bmr, genderAbsoluteFloor);

  let rawTarget = tdee;
  if (goal === 'turun_bb') {
    // Defisit maksimal 20% dari TDEE
    rawTarget = Math.round(tdee * 0.8);
  } else if (goal === 'naik_bb') {
    // Surplus moderat +10% dari TDEE (menunggu konfirmasi user jika ingin diubah)
    rawTarget = Math.round(tdee * 1.1);
  }

  const wasClampedToSafetyFloor = rawTarget < safeMinimumCalories;
  const recommendedCalories = Math.max(rawTarget, safeMinimumCalories);

  return {
    bmr,
    tdee,
    safeMinimumCalories,
    recommendedCalories,
    maxWeeklyWeightLossKg:
      goal === 'turun_bb' ? { min: 0.5, max: 1.0 } : null,
    wasClampedToSafetyFloor,
  };
}