import { SafetyScreeningInput, SafetyScreeningResult } from './types';

export const MANDATORY_MEDICAL_DISCLAIMER =
  'PERHATIAN: Seluruh hasil perhitungan dan rekomendasi ini merupakan estimasi edukasi kebugaran semata, BUKAN diagnosis medis, serta tidak menggantikan saran, pemeriksaan, atau pendampingan langsung dari dokter maupun ahli gizi tersertifikasi.';

export const PROFESSIONAL_REFERRAL_MESSAGE =
  'Berdasarkan profil kondisi kesehatan Anda, sistem tidak memberikan rencana kalori atau diet otomatis demi keselamatan Anda. Silakan berkonsultasi langsung dengan dokter atau ahli gizi klinis (RD) untuk pendampingan yang aman.';

/**
 * Mengevaluasi kelayakan pengguna untuk menerima rencana otomatis sesuai aturan keselamatan & UU PDP.
 * Fungsi murni tanpa efek samping.
 */
export function evaluateSafetyScreening(
  input: SafetyScreeningInput
): SafetyScreeningResult {
  const blockedReasons: string[] = [];

  if (!input.hasExplicitPDPafConsent) {
    blockedReasons.push(
      'Persetujuan pemrosesan data pribadi kesehatan (UU PDP) wajib disetujui sebelum melanjutkan.'
    );
  }

  if (input.ageYears < 18) {
    blockedReasons.push(
      'Pengguna berusia di bawah 18 tahun masih dalam masa pertumbuhan dan memerlukan panduan gizi khusus.'
    );
  }

  if (input.isPregnantOrBreastfeeding) {
    blockedReasons.push(
      'Kondisi kehamilan atau menyusui memerlukan perhitungan nutrisi klinis dari tenaga medis.'
    );
  }

  if (input.hasEatingDisorderHistory) {
    blockedReasons.push(
      'Riwayat gangguan makan memerlukan pendampingan profesional kesehatan mental dan gizi.'
    );
  }

  if (input.hasDiabetes) {
    blockedReasons.push(
      'Kondisi diabetes memerlukan pengaturan glikemik dan nutrisi medis secara terukur oleh dokter/ahli gizi.'
    );
  }

  if (input.hasChronicDisease) {
    blockedReasons.push(
      'Kondisi penyakit kronis memerlukan pengawasan langsung dari tenaga kesehatan profesional.'
    );
  }

  const requiresProfessionalReferral =
    input.ageYears < 18 ||
    input.isPregnantOrBreastfeeding ||
    input.hasEatingDisorderHistory ||
    input.hasDiabetes ||
    input.hasChronicDisease;

  return {
    canGenerateAutoPlan: blockedReasons.length === 0,
    requiresProfessionalReferral,
    blockedReasons,
    disclaimerText: MANDATORY_MEDICAL_DISCLAIMER,
  };
}