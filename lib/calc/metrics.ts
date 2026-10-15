import type {
  ActivityFactor,
  AnthropometricInput,
  BiologicalSex,
  BMICategoryAsiaPacific,
  BodyFatRange,
  CalorieTargetResult,
  FitnessGoal,
  FullCalculationResult,
  IdealWeightRange,
  MacroDistribution,
  WHRCategory,
} from './types';

function roundTo(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 1. Indeks Massa Tubuh (BMI)
 * Rumus: berat (kg) / (tinggi (m))^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm < 100 || heightCm > 250) {
    throw new Error('Tinggi badan harus berada di antara 100 hingga 250 cm.');
  }
  if (weightKg < 25 || weightKg > 300) {
    throw new Error('Berat badan harus berada di antara 25 hingga 300 kg.');
  }
  const heightM = heightCm / 100;
  return roundTo(weightKg / (heightM * heightM), 1);
}

/**
 * Kategori BMI Standar Asia-Pasifik (WHO WPRO):
 * - < 18.5: Kekurangan Berat Badan
 * - 18.5 - 22.9: Normal (Ideal)
 * - 23.0 - 24.9: Kelebihan Berat Badan
 * - >= 25.0: Obesitas
 */
export function getBMICategoryAsiaPacific(bmi: number): BMICategoryAsiaPacific {
  if (bmi < 18.5) return 'Kekurangan Berat Badan';
  if (bmi <= 22.9) return 'Normal (Ideal)';
  if (bmi <= 24.9) return 'Kelebihan Berat Badan';
  return 'Obesitas';
}

/**
 * 2. Rentang Berat Badan Ideal (berdasarkan BMI sehat Asia-Pasifik 18.5 - 22.9)
 */
export function calculateIdealWeightRange(heightCm: number): IdealWeightRange {
  if (heightCm < 100 || heightCm > 250) {
    throw new Error('Tinggi badan harus berada di antara 100 hingga 250 cm.');
  }
  const heightM = heightCm / 100;
  const heightSq = heightM * heightM;
  const minKg = roundTo(18.5 * heightSq, 1);
  const maxKg = roundTo(22.9 * heightSq, 1);
  const midpointKg = roundTo((minKg + maxKg) / 2, 1);

  return { minKg, maxKg, midpointKg };
}

/**
 * 3. Rasio Lingkar Pinggang terhadap Pinggul (Waist-to-Hip Ratio / WHR)
 * Rumus: pinggang (cm) / pinggul (cm)
 */
export function calculateWHR(waistCm: number, hipCm: number): number {
  if (waistCm < 40 || waistCm > 200) {
    throw new Error('Lingkar pinggang harus berada di antara 40 hingga 200 cm.');
  }
  if (hipCm < 50 || hipCm > 200) {
    throw new Error('Lingkar pinggul harus berada di antara 50 hingga 200 cm.');
  }
  return roundTo(waistCm / hipCm, 2);
}

export function getWHRCategory(whr: number, sex: BiologicalSex): WHRCategory {
  if (sex === 'male') {
    if (whr < 0.9) return 'Risiko Rendah';
    if (whr <= 0.99) return 'Risiko Sedang';
    return 'Risiko Tinggi';
  }
  if (whr < 0.8) return 'Risiko Rendah';
  if (whr <= 0.84) return 'Risiko Sedang';
  return 'Risiko Tinggi';
}

/**
 * 4. Persentase Lemak Tubuh Metode US Navy (menggunakan log10 dalam satuan cm)
 * Pria: 495 / (1.0324 - 0.19077 * log10(pinggang - leher) + 0.15456 * log10(tinggi)) - 450
 * Wanita: 495 / (1.29579 - 0.35004 * log10(pinggang + pinggul - leher) + 0.22100 * log10(tinggi)) - 450
 */
export function calculateUSNavyBodyFat(params: {
  sex: BiologicalSex;
  heightCm: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
}): number {
  const { sex, heightCm, waistCm, hipCm, neckCm } = params;

  if (neckCm < 20 || neckCm > 70) {
    throw new Error('Lingkar leher harus berada di antara 20 hingga 70 cm.');
  }

  let bodyFat: number;
  if (sex === 'male') {
    const diff = waistCm - neckCm;
    if (diff <= 0) {
      throw new Error('Lingkar pinggang harus lebih besar daripada lingkar leher.');
    }
    const denominator =
      1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm);
    bodyFat = 495 / denominator - 450;
  } else {
    const sumDiff = waistCm + hipCm - neckCm;
    if (sumDiff <= 0) {
      throw new Error(
        'Jumlah lingkar pinggang dan pinggul harus lebih besar daripada lingkar leher.'
      );
    }
    const denominator =
      1.29579 -
      0.35004 * Math.log10(sumDiff) +
      0.221 * Math.log10(heightCm);
    bodyFat = 495 / denominator - 450;
  }

  const clamped = Math.max(3, Math.min(70, bodyFat));
  return roundTo(clamped, 1);
}

export function calculateBodyFatRange(params: {
  sex: BiologicalSex;
  heightCm: number;
  waistCm: number;
  hipCm: number;
  neckCm?: number | null;
}): BodyFatRange | null {
  if (params.neckCm === undefined || params.neckCm === null) {
    return null;
  }

  const estimatePct = calculateUSNavyBodyFat({
    sex: params.sex,
    heightCm: params.heightCm,
    waistCm: params.waistCm,
    hipCm: params.hipCm,
    neckCm: params.neckCm,
  });

  // Margin estimasi antropometri lapangan ±2.0%
  const minPct = roundTo(Math.max(3, estimatePct - 2.0), 1);
  const maxPct = roundTo(Math.min(70, estimatePct + 2.0), 1);

  let category = 'Bugar / Normal';
  if (params.sex === 'male') {
    if (estimatePct < 6) category = 'Lemak Esensial';
    else if (estimatePct <= 24) category = 'Bugar / Normal';
    else category = 'Di Atas Rata-rata';
  } else {
    if (estimatePct < 14) category = 'Lemak Esensial';
    else if (estimatePct <= 31) category = 'Bugar / Normal';
    else category = 'Di Atas Rata-rata';
  }

  return { estimatePct, minPct, maxPct, category };
}

/**
 * 5. Basal Metabolic Rate (BMR) - Rumus Mifflin-St Jeor
 * Pria: (10 * berat) + (6.25 * tinggi) - (5 * usia) + 5
 * Wanita: (10 * berat) + (6.25 * tinggi) - (5 * usia) - 161
 */
export function calculateBMR(params: {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { sex, weightKg, heightCm, ageYears } = params;
  if (ageYears < 18 || ageYears > 80) {
    throw new Error('Usia untuk kalkulasi dewasa harus berada di antara 18 hingga 80 tahun.');
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmr = sex === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * 6. Total Daily Energy Expenditure (TDEE)
 * Rumus: BMR * faktor aktivitas
 */
export function calculateTDEE(bmr: number, activityFactor: ActivityFactor): number {
  if (bmr <= 0) {
    throw new Error('BMR harus bernilai positif.');
  }
  return Math.round(bmr * activityFactor);
}

/**
 * 7. Target Kalori Harian dengan Guardrail Keselamatan:
 * - Turun berat ('lose'): defisit 20% dari TDEE (0.80 * TDEE)
 * - Jaga berat ('maintain'): 100% TDEE
 * - Naik berat ('gain'): surplus 12% dari TDEE (rentang 10-15%)
 * - Aturan mutlak: TIDAK BOLEH di bawah BMR, dan TIDAK BOLEH di bawah 1200 kkal (wanita) / 1500 kkal (pria).
 */
export function calculateSafeCalorieTarget(params: {
  sex: BiologicalSex;
  bmr: number;
  tdee: number;
  goal: FitnessGoal;
}): CalorieTargetResult {
  const { sex, bmr, tdee, goal } = params;
  const genderFloor = sex === 'male' ? 1500 : 1200;
  const minimumSafeCalories = Math.max(bmr, genderFloor);

  let rawTargetCalories = tdee;
  if (goal === 'lose') {
    rawTargetCalories = Math.round(tdee * 0.8);
  } else if (goal === 'gain') {
    rawTargetCalories = Math.round(tdee * 1.12);
  }

  const wasClampedToFloor = rawTargetCalories < minimumSafeCalories;
  const targetCalories = wasClampedToFloor
    ? minimumSafeCalories
    : rawTargetCalories;

  let explanation = 'Target kalori setara kebutuhan energi harian (TDEE) untuk menjaga berat badan.';
  if (goal === 'lose') {
    explanation = wasClampedToFloor
      ? 'Target kalori disesuaikan ke batas aman minimum (tidak di bawah BMR/batas keselamatan) agar metabolisme tetap terjaga.'
      : 'Defisit moderat 20% dari TDEE untuk penurunan berat badan bertahap dan aman.';
  } else if (goal === 'gain') {
    explanation = 'Surplus terukur ~12% dari TDEE untuk mendukung penambahan massa tubuh yang sehat.';
  }

  return {
    targetCalories,
    rawTargetCalories,
    wasClampedToFloor,
    minimumSafeCalories,
    explanation,
  };
}

/**
 * 8. Distribusi Makronutrien (Protein 4 kkal/g, Karbohidrat 4 kkal/g, Lemak 9 kkal/g)
 */
export function calculateMacros(
  targetCalories: number,
  goal: FitnessGoal
): MacroDistribution {
  let proteinPct = 25;
  let carbsPct = 50;
  let fatPct = 25;

  if (goal === 'lose') {
    proteinPct = 30;
    carbsPct = 45;
    fatPct = 25;
  } else if (goal === 'gain') {
    proteinPct = 25;
    carbsPct = 55;
    fatPct = 20;
  }

  const proteinG = Math.round((targetCalories * (proteinPct / 100)) / 4);
  const carbsG = Math.round((targetCalories * (carbsPct / 100)) / 4);
  const fatG = Math.round((targetCalories * (fatPct / 100)) / 9);

  return {
    proteinG,
    carbsG,
    fatG,
    proteinPct,
    carbsPct,
    fatPct,
  };
}

/**
 * 9. Pembungkus Kalkulasi Lengkap untuk UI
 */
export function calculateAllMetrics(
  input: AnthropometricInput
): FullCalculationResult {
  const bmi = calculateBMI(input.weightKg, input.heightCm);
  const bmiCategory = getBMICategoryAsiaPacific(bmi);
  const idealWeight = calculateIdealWeightRange(input.heightCm);
  const whr = calculateWHR(input.waistCm, input.hipCm);
  const whrCategory = getWHRCategory(whr, input.sex);
  const bodyFat = calculateBodyFatRange({
    sex: input.sex,
    heightCm: input.heightCm,
    waistCm: input.waistCm,
    hipCm: input.hipCm,
    neckCm: input.neckCm,
  });
  const bmr = calculateBMR({
    sex: input.sex,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    ageYears: input.ageYears,
  });
  const tdee = calculateTDEE(bmr, input.activityFactor);
  const calorieTarget = calculateSafeCalorieTarget({
    sex: input.sex,
    bmr,
    tdee,
    goal: input.goal,
  });
  const macros = calculateMacros(calorieTarget.targetCalories, input.goal);

  return {
    bmi,
    bmiCategory,
    bmiStandardUsed: 'Asia-Pasifik (WHO WPRO)',
    idealWeight,
    whr,
    whrCategory,
    bodyFat,
    bmr,
    tdee,
    calorieTarget,
    macros,
  };
}