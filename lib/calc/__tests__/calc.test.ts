import { describe, expect, it } from 'vitest';
import {
  calculateAllMetrics,
  calculateBMI,
  calculateBMR,
  calculateBodyFatRange,
  calculateIdealWeightRange,
  calculateMacros,
  calculateSafeCalorieTarget,
  calculateTDEE,
  calculateUSNavyBodyFat,
  calculateWHR,
  getBMICategoryAsiaPacific,
  getWHRCategory,
} from '../index';

describe('Logika Perhitungan Deterministik NutriFit AI (lib/calc)', () => {
  it('menghitung BMI dan kategori Asia-Pasifik dengan tepat', () => {
    // Contoh Manual 1: Berat 62 kg, Tinggi 165 cm (1.65 m)
    // Tinggi^2 = 1.65 * 1.65 = 2.7225
    // BMI = 62 / 2.7225 = 22.773 -> dibulatkan 1 desimal = 22.8 (Normal / Ideal)
    expect(calculateBMI(62, 165)).toBe(22.8);
    expect(getBMICategoryAsiaPacific(22.8)).toBe('Normal (Ideal)');

    // Contoh Manual 2: Berat 75 kg, Tinggi 170 cm (1.70 m)
    // Tinggi^2 = 1.70 * 1.70 = 2.89
    // BMI = 75 / 2.89 = 25.951 -> dibulatkan 1 desimal = 26.0 (Obesitas menurut Asia-Pasifik >= 25.0)
    expect(calculateBMI(75, 170)).toBe(26.0);
    expect(getBMICategoryAsiaPacific(26.0)).toBe('Obesitas');
  });

  it('menghitung rentang berat badan ideal Asia-Pasifik (BMI 18.5 - 22.9)', () => {
    // Contoh Manual 1: Tinggi 165 cm (1.65 m -> m^2 = 2.7225)
    // Min = 18.5 * 2.7225 = 50.366 -> 50.4 kg
    // Max = 22.9 * 2.7225 = 62.345 -> 62.3 kg
    const ideal165 = calculateIdealWeightRange(165);
    expect(ideal165.minKg).toBe(50.4);
    expect(ideal165.maxKg).toBe(62.3);

    // Contoh Manual 2: Tinggi 170 cm (1.70 m -> m^2 = 2.89)
    // Min = 18.5 * 2.89 = 53.465 -> 53.5 kg
    // Max = 22.9 * 2.89 = 66.181 -> 66.2 kg
    const ideal170 = calculateIdealWeightRange(170);
    expect(ideal170.minKg).toBe(53.5);
    expect(ideal170.maxKg).toBe(66.2);
  });

  it('menghitung WHR dan kategorinya berdasarkan jenis kelamin', () => {
    // Contoh Manual 1 (Pria): Pinggang 80 cm, Pinggul 95 cm
    // WHR = 80 / 95 = 0.8421 -> 0.84 (< 0.90 = Risiko Rendah)
    const whrMale = calculateWHR(80, 95);
    expect(whrMale).toBe(0.84);
    expect(getWHRCategory(whrMale, 'male')).toBe('Risiko Rendah');

    // Contoh Manual 2 (Wanita): Pinggang 82 cm, Pinggul 94 cm
    // WHR = 82 / 94 = 0.8723 -> 0.87 (>= 0.85 pada wanita = Risiko Tinggi)
    const whrFemale = calculateWHR(82, 94);
    expect(whrFemale).toBe(0.87);
    expect(getWHRCategory(whrFemale, 'female')).toBe('Risiko Tinggi');
  });

  it('menghitung estimasi lemak tubuh US Navy dan rentangnya', () => {
    // Contoh Manual 1 (Pria): Tinggi 175 cm, Pinggang 85 cm, Pinggul 96 cm, Leher 38 cm
    // pinggang - leher = 47 cm -> log10(47) = 1.672097858
    // log10(175) = 2.243038049
    // penyebut = 1.0324 - 0.19077*(1.672097858) + 0.15456*(2.243038049) = 1.0601
    // BF = (495 / 1.0601) - 450 = 466.937 - 450 = 16.9%
    const bfMale = calculateUSNavyBodyFat({
      sex: 'male',
      heightCm: 175,
      waistCm: 85,
      hipCm: 96,
      neckCm: 38,
    });
    expect(bfMale).toBe(16.9);

    // Contoh Manual 2 (Wanita): Tinggi 160 cm, Pinggang 72 cm, Pinggul 95 cm, Leher 33 cm
    // pinggang + pinggul - leher = 72 + 95 - 33 = 134 cm -> log10(134) = 2.127104798
    // log10(160) = 2.204119983
    // penyebut = 1.29579 - 0.35004*(2.127104798) + 0.221*(2.204119983) = 1.038329
    // BF = (495 / 1.038329) - 450 = 476.727 - 450 = 26.7%
    const bfFemale = calculateUSNavyBodyFat({
      sex: 'female',
      heightCm: 160,
      waistCm: 72,
      hipCm: 95,
      neckCm: 33,
    });
    expect(bfFemale).toBe(26.7);

    // Jika leher kosong, calculateBodyFatRange mengembalikan null
    expect(
      calculateBodyFatRange({
        sex: 'male',
        heightCm: 175,
        waistCm: 85,
        hipCm: 96,
        neckCm: null,
      })
    ).toBeNull();
  });

  it('menghitung BMR Mifflin-St Jeor dan TDEE dengan benar', () => {
    // Contoh Manual 1 (Pria): Berat 65 kg, Tinggi 170 cm, Usia 21 tahun
    // BMR = (10 * 65) + (6.25 * 170) - (5 * 21) + 5 = 650 + 1062.5 - 105 + 5 = 1612.5 -> 1613 kkal
    // TDEE (faktor 1.55) = 1613 * 1.55 = 2500.15 -> 2500 kkal
    const bmrMale = calculateBMR({
      sex: 'male',
      weightKg: 65,
      heightCm: 170,
      ageYears: 21,
    });
    expect(bmrMale).toBe(1613);
    expect(calculateTDEE(bmrMale, 1.55)).toBe(2500);

    // Contoh Manual 2 (Wanita): Berat 55 kg, Tinggi 160 cm, Usia 22 tahun
    // BMR = (10 * 55) + (6.25 * 160) - (5 * 22) - 161 = 550 + 1000 - 110 - 161 = 1279 kkal
    // TDEE (faktor 1.375) = 1279 * 1.375 = 1758.625 -> 1759 kkal
    const bmrFemale = calculateBMR({
      sex: 'female',
      weightKg: 55,
      heightCm: 160,
      ageYears: 22,
    });
    expect(bmrFemale).toBe(1279);
    expect(calculateTDEE(bmrFemale, 1.375)).toBe(1759);
  });

  it('menerapkan guardrail batas bawah kalori (tidak di bawah BMR atau 1200/1500)', () => {
    // Contoh Manual 1: Pria dengan BMR 1613, TDEE 2500, tujuan 'lose' (defisit 20%)
    // Raw target = 2500 * 0.8 = 2000 kkal (di atas BMR 1613 dan di atas 1500 -> aman, tidak di-clamp)
    const targetNormal = calculateSafeCalorieTarget({
      sex: 'male',
      bmr: 1613,
      tdee: 2500,
      goal: 'lose',
    });
    expect(targetNormal.targetCalories).toBe(2000);
    expect(targetNormal.wasClampedToFloor).toBe(false);

    // Contoh Manual 2: Wanita dengan BMR 1250, TDEE 1500 (sedentary 1.2), tujuan 'lose'
    // Raw target = 1500 * 0.8 = 1200 kkal. Karena BMR = 1250 (> 1200), batas aman minimum adalah 1250 kkal.
    const targetClamped = calculateSafeCalorieTarget({
      sex: 'female',
      bmr: 1250,
      tdee: 1500,
      goal: 'lose',
    });
    expect(targetClamped.targetCalories).toBe(1250);
    expect(targetClamped.wasClampedToFloor).toBe(true);
  });

  it('menghitung distribusi makronutrien dan seluruh metrik terintegrasi', () => {
    // Contoh Manual 1: Target 2000 kkal, tujuan 'maintain' (25% P, 50% C, 25% F)
    // Protein = (2000 * 0.25) / 4 = 125g
    // Karbo = (2000 * 0.50) / 4 = 250g
    // Lemak = (2000 * 0.25) / 9 = 55.55 -> 56g
    const macrosMaintain = calculateMacros(2000, 'maintain');
    expect(macrosMaintain.proteinG).toBe(125);
    expect(macrosMaintain.carbsG).toBe(250);
    expect(macrosMaintain.fatG).toBe(56);

    // Contoh Manual 2: Target 1800 kkal, tujuan 'lose' (30% P, 45% C, 25% F)
    // Protein = (1800 * 0.30) / 4 = 135g
    // Karbo = (1800 * 0.45) / 4 = 202.5 -> 203g
    // Lemak = (1800 * 0.25) / 9 = 50g
    const macrosLose = calculateMacros(1800, 'lose');
    expect(macrosLose.proteinG).toBe(135);
    expect(macrosLose.carbsG).toBe(203);
    expect(macrosLose.fatG).toBe(50);

    const summary = calculateAllMetrics({
      sex: 'male',
      ageYears: 21,
      heightCm: 165,
      weightKg: 62,
      waistCm: 78,
      hipCm: 92,
      neckCm: 37,
      activityFactor: 1.55,
      goal: 'maintain',
    });
    expect(summary.bmi).toBe(22.8);
    expect(summary.idealWeight.minKg).toBe(50.4);
  });
});