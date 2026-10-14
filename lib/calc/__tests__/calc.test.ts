import { describe, expect, it } from 'vitest';
import {
  calculateBMI,
  calculateBMR,
  calculateSafeCalorieTarget,
  calculateTDEE,
  calculateUSNavyBodyFat,
  calculateWHR,
  evaluateSafetyScreening,
} from '../index';

describe('Modul Perhitungan Baku NutriFit AI (lib/calc)', () => {
  describe('calculateBMI', () => {
    it('menghitung BMI dan kategori dengan benar (kg / m^2)', () => {
      // 70 kg / (1.75 m)^2 = 22.857 -> 22.9
      const result = calculateBMI(70, 175);
      expect(result.bmi).toBe(22.9);
      expect(result.category).toBe('Normal (Ideal)');
    });

    it('mendeteksi kategori Obesitas jika BMI >= 30', () => {
      const result = calculateBMI(95, 170);
      expect(result.bmi).toBe(32.9);
      expect(result.category).toBe('Obesitas');
    });
  });

  describe('calculateWHR', () => {
    it('menggunakan ambang batas WHO untuk pria (> 0.90 risiko meningkat)', () => {
      expect(calculateWHR(85, 95, 'pria').riskLevel).toBe('Risiko Rendah');
      expect(calculateWHR(92, 95, 'pria').riskLevel).toBe('Risiko Meningkat');
    });

    it('menggunakan ambang batas WHO untuk wanita (> 0.85 risiko meningkat)', () => {
      expect(calculateWHR(75, 92, 'wanita').riskLevel).toBe('Risiko Rendah');
      expect(calculateWHR(82, 92, 'wanita').riskLevel).toBe('Risiko Meningkat');
    });
  });

  describe('calculateUSNavyBodyFat', () => {
    it('mengembalikan "tidak tersedia" jika lingkar leher tidak diisi', () => {
      const result = calculateUSNavyBodyFat({
        gender: 'pria',
        heightCm: 175,
        waistCm: 85,
        hipCm: 95,
        neckCm: undefined,
      });

      expect(result.available).toBe(false);
      expect(result.label).toBe('tidak tersedia');
      expect(result.minPercentage).toBeNull();
      expect(result.maxPercentage).toBeNull();
    });

    it('menghitung lemak tubuh pria sebagai rentang (+/- poin), bukan angka tunggal', () => {
      const result = calculateUSNavyBodyFat({
        gender: 'pria',
        heightCm: 175,
        waistCm: 85,
        hipCm: 95,
        neckCm: 38,
        rangeMarginPoints: 3.5,
      });

      expect(result.available).toBe(true);
      expect(result.minPercentage).not.toBeNull();
      expect(result.maxPercentage).not.toBeNull();
      expect(
        Number((result.maxPercentage! - result.minPercentage!).toFixed(1))
      ).toBe(7.0);
      expect(result.label).toContain('% - ');
    });

    it('menghitung lemak tubuh wanita sebagai rentang (+/- poin)', () => {
      const result = calculateUSNavyBodyFat({
        gender: 'wanita',
        heightCm: 162,
        waistCm: 74,
        hipCm: 96,
        neckCm: 33,
        rangeMarginPoints: 3.5,
      });

      expect(result.available).toBe(true);
      expect(result.label).toContain('% - ');
    });
  });

  describe('calculateBMR & calculateTDEE (Mifflin-St Jeor)', () => {
    it('menghitung BMR pria dan wanita dengan rumus Mifflin-St Jeor', () => {
      // Pria: 10(70) + 6.25(175) - 5(24) + 5 = 700 + 1093.75 - 120 + 5 = 1678.75 -> 1679
      expect(calculateBMR(70, 175, 24, 'pria')).toBe(1679);

      // Wanita: 10(55) + 6.25(160) - 5(22) - 161 = 550 + 1000 - 110 - 161 = 1279
      expect(calculateBMR(55, 160, 22, 'wanita')).toBe(1279);
    });

    it('menghitung TDEE sesuai faktor aktivitas', () => {
      const bmr = 1679;
      expect(calculateTDEE(bmr, 1.55)).toBe(Math.round(1679 * 1.55));
    });
  });

  describe('calculateSafeCalorieTarget (Guardrails Kalori)', () => {
    it('menjaga target kalori tidak pernah di bawah BMR atau 1500 (pria) / 1200 (wanita)', () => {
      // Contoh wanita dengan BMR kecil dan aktivitas sedentary (1.2)
      // BMR: 10(45) + 6.25(150) - 5(25) - 161 = 450 + 937.5 - 125 - 161 = 1101.5 -> 1102
      // TDEE: 1102 * 1.2 = 1322
      // 80% TDEE = 1058 (di bawah batas aman wanita 1200 dan BMR 1102)
      const result = calculateSafeCalorieTarget({
        weightKg: 45,
        heightCm: 150,
        ageYears: 25,
        gender: 'wanita',
        activityFactor: 1.2,
        goal: 'turun_bb',
      });

      expect(result.safeMinimumCalories).toBe(1200);
      expect(result.recommendedCalories).toBe(1200);
      expect(result.wasClampedToSafetyFloor).toBe(true);
    });

    it('menjaga target kalori tidak di bawah BMR meskipun BMR > 1500 pada pria sedentary', () => {
      // Pria dengan aktivitas 1.2: TDEE * 0.8 = 0.96 * BMR (selalu < BMR), maka harus di-clamp ke BMR
      const result = calculateSafeCalorieTarget({
        weightKg: 80,
        heightCm: 180,
        ageYears: 25,
        gender: 'pria',
        activityFactor: 1.2,
        goal: 'turun_bb',
      });

      expect(result.recommendedCalories).toBe(result.bmr);
      expect(result.wasClampedToSafetyFloor).toBe(true);
    });
  });

  describe('evaluateSafetyScreening', () => {
    it('memblokir rencana otomatis jika usia < 18 atau memiliki kondisi medis/tanpa persetujuan PDP', () => {
      const under18 = evaluateSafetyScreening({
        ageYears: 17,
        isPregnantOrBreastfeeding: false,
        hasEatingDisorderHistory: false,
        hasDiabetes: false,
        hasChronicDisease: false,
        hasExplicitPDPafConsent: true,
      });

      expect(under18.canGenerateAutoPlan).toBe(false);
      expect(under18.requiresProfessionalReferral).toBe(true);
    });

    it('mengizinkan rencana otomatis hanya jika seluruh syarat aman dan persetujuan PDP dicentang', () => {
      const safeUser = evaluateSafetyScreening({
        ageYears: 22,
        isPregnantOrBreastfeeding: false,
        hasEatingDisorderHistory: false,
        hasDiabetes: false,
        hasChronicDisease: false,
        hasExplicitPDPafConsent: true,
      });

      expect(safeUser.canGenerateAutoPlan).toBe(true);
      expect(safeUser.requiresProfessionalReferral).toBe(false);
    });
  });
});