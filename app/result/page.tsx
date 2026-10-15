'use client';

import { InlineTitleIcon } from '@/components/InlineTitleIcon';
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Activity,
  Flame,
  Utensils,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Droplets,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RefreshCw,
  BookOpen,
  Calendar,
  Scale,
  HeartPulse,
} from 'lucide-react';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
type FitnessGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';

interface UserInput {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  budgetTier: string;
  sleepHours: number;
}

interface BiometricMetrics {
  bmi: number;
  bmiCategory: string;
  bmiColor: string;
  whr: number;
  whrStatus: string;
  bodyFat: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  bmrGuardTriggered: boolean;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
}

const DEFAULT_INPUT: UserInput = {
  name: 'Akmal',
  gender: 'male',
  age: 22,
  heightCm: 171,
  weightKg: 74,
  waistCm: 86,
  hipCm: 96,
  neckCm: 38,
  activityLevel: 'moderate',
  goal: 'fat_loss',
  budgetTier: 'hemat',
  sleepHours: 7,
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; factor: number }> = {
  sedentary: { label: 'Sedenter (Minim Gerak)', factor: 1.2 },
  light: { label: 'Aktif Ringan', factor: 1.375 },
  moderate: { label: 'Aktif Moderat', factor: 1.55 },
  active: { label: 'Sangat Aktif', factor: 1.725 },
};

const GOAL_META: Record<FitnessGoal, { label: string; delta: number }> = {
  fat_loss: { label: 'Turun Lemak (Defisit Aman)', delta: -400 },
  maintenance: { label: 'Jaga Komposisi & Bugar', delta: 0 },
  muscle_gain: { label: 'Naik Massa Otot (Lean Bulk)', delta: 300 },
};

function calculateMetrics(input: UserInput): BiometricMetrics {
  const heightM = Math.max(input.heightCm, 100) / 100;
  const bmi = +(input.weightKg / (heightM * heightM)).toFixed(1);

  let bmiCategory = 'Normal Ideal';
  let bmiColor = 'text-[#38D46A]';
  if (bmi < 18.5) {
    bmiCategory = 'Berat Kurang (Underweight)';
    bmiColor = 'text-sky-300';
  } else if (bmi >= 23 && bmi <= 24.9) {
    bmiCategory = 'Berisiko Lebih (Overweight Asia)';
    bmiColor = 'text-amber-300';
  } else if (bmi >= 25) {
    bmiCategory = 'Obesitas (Asia-Pasifik)';
    bmiColor = 'text-rose-400';
  }

  const whr = +(input.waistCm / Math.max(input.hipCm, 50)).toFixed(2);
  const whrLimit = input.gender === 'male' ? 0.9 : 0.85;
  const whrStatus =
    whr < whrLimit ? 'Risiko Viseral Rendah' : 'Waspada Lemak Viseral';

  let rawBodyFat = 20;
  if (input.gender === 'male') {
    const diff = Math.max(input.waistCm - input.neckCm, 25);
    rawBodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(diff) +
          0.15456 * Math.log10(Math.max(input.heightCm, 120))) -
      450;
  } else {
    const sumDiff = Math.max(input.waistCm + input.hipCm - input.neckCm, 45);
    rawBodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(sumDiff) +
          0.221 * Math.log10(Math.max(input.heightCm, 120))) -
      450;
  }
  const bodyFat = +Math.min(Math.max(rawBodyFat, 5), 55).toFixed(1);

  const baseBmr =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.age +
    (input.gender === 'male' ? 5 : -161);
  const bmr = Math.round(Math.max(baseBmr, 1000));

  const factor = ACTIVITY_MULTIPLIERS[input.activityLevel]?.factor ?? 1.375;
  const tdee = Math.round(bmr * factor);
  const delta = GOAL_META[input.goal]?.delta ?? 0;
  const rawTarget = tdee + delta;

  const bmrGuardTriggered = rawTarget < bmr;
  const targetCalories = Math.max(rawTarget, bmr);

  const proteinGrams = Math.round(
    input.weightKg * (input.goal === 'muscle_gain' ? 2.0 : 1.8)
  );
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const carbGrams = Math.max(
    Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4),
    80
  );

  return {
    bmi,
    bmiCategory,
    bmiColor,
    whr,
    whrStatus,
    bodyFat,
    bmr,
    tdee,
    targetCalories,
    bmrGuardTriggered,
    proteinGrams,
    fatGrams,
    carbGrams,
  };
}

interface DayMealPlan {
  day: string;
  costEstimate: string;
  meals: {
    time: string;
    title: string;
    portionDesc: string;
    kcalShare: number;
  }[];
}

function generateMealPlans(
  tierRaw: string,
  targetCalories: number
): DayMealPlan[] {
  const tier = tierRaw.trim().toLowerCase();

  const bKcal = Math.round(targetCalories * 0.28);
  const lKcal = Math.round(targetCalories * 0.35);
  const dKcal = Math.round(targetCalories * 0.25);
  const sKcal = Math.max(targetCalories - bKcal - lKcal - dKcal, 120);

  if (tier === 'hemat') {
    return [
      {
        day: 'Senin',
        costEstimate: 'Rp32.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Nasi Putih Hangat + 2 Telur Dadar Tanpa Tepung + Timun',
            portionDesc: '1 centong nasi, 2 butir telur ayam, irisan timun & tomat segar',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Ikan Tongkol Bumbu Kuning + Sayur Bening Bayam & Tempe',
            portionDesc: '1,5 centong nasi, 1 potong tongkol, 2 potong tempe bacem/panggang',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Pisang Kepok Rebus & Kacang Tanah Sangrai',
            portionDesc: '2 buah pisang kepok + 1 genggam kecil kacang',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Capcay Kuah Tahu Sutera & Telur Rebus',
            portionDesc: '1 centong nasi, 2 potong tahu, 1 telur rebus, tumis sawi wortel',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Selasa',
        costEstimate: 'Rp34.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Oatmeal / Bubur Kacang Hijau Kurang Gula + 1 Telur Rebus',
            portionDesc: '1 mangkuk sedang kacang hijau + santan tipis + 1 butir telur',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Ayam Ungkep Bakar/Panggang + Tumis Kangkung Tempe',
            portionDesc: '1,5 centong nasi, 1 potong dada/paha atas ayam tanpa kulit, 1 potong tempe',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Potongan Buah Pepaya Segar & Susu Kedelai Tawar',
            portionDesc: '1 porsi pepaya potong + 1 gelas sari kedelai',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Nasi + Pepes Tahu Kemangi + Telur Ceplok Air',
            portionDesc: '1 centong nasi, 1 bungkus besar pepes tahu, 1 telur ceplok minim minyak',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Rabu',
        costEstimate: 'Rp30.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Ubi Cilembu / Singkong Rebus + 2 Telur Setengah Matang',
            portionDesc: '200g ubi rebus sumber karbohidrat kompleks + 2 butir telur',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Ikan Kembung Bakar Sambal Tomat + Sayur Asem',
            portionDesc: '1,5 centong nasi, 1 ekor ikan kembung sedang, 1 mangkuk sayur asem',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Tahu Kukus Isi Sayur & Teh Hijau Tawar',
            portionDesc: '3 buah tahu kukus tanpa gorengan tepung',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Nasi + Orek Tempe Basah Cabe Hijau + Bening Oyong',
            portionDesc: '1 centong nasi, 100g tempe potong dadu, sayur oyong wortel',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Kamis',
        costEstimate: 'Rp35.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Nasi Pecel Sayur Bumbu Kacang Sedikit + Telur & Tempe',
            portionDesc: '1 centong nasi, sayur rebus lengkap, 1 telur rebus, 1 tempe',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Soto Ayam Bening (Tanpa Santan) + Perkedel Kentang Panggang',
            portionDesc: '1,5 centong nasi, suwiran dada ayam melimpah, tauge & kol',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Jagung Manis Rebus Pipil',
            portionDesc: '1 bonggol jagung manis rebus hangat',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Nasi + Ikan Tongkol Suwir Kemangi + Rebusan Labu Siam',
            portionDesc: '1 centong nasi, 100g tongkol suwir pedas segar, lalapan labu siam',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Jumat',
        costEstimate: 'Rp33.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Roti Gandum / Tawar + 2 Telur Orak-Arik + Pisang Ambon',
            portionDesc: '2 lembar roti, 2 telur orak-arik, 1 buah pisang',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Ikan Bandeng Presto/Kuah Kuning + Tumis Tauge Tahu',
            portionDesc: '1,5 centong nasi, 1 potong bandeng tengah, tumis tauge tahu putih',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Edamame / Kedelai Rebus',
            portionDesc: '1 mangkuk kecil kedelai rebus tinggi protein nabati',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Sup Ayam Kentang Wortel Buncis + Tempe Panggang',
            portionDesc: 'Potongan dada ayam dan kentang di dalam sup bening hangat',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Sabtu',
        costEstimate: 'Rp36.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Nasi Kuning / Uduk Porsi Terukur + Telur Balado & Tempe Orek',
            portionDesc: '1 centong nasi, 1 telur bulat, 2 sdm tempe orek, irisan timun',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Gado-Gado Siram Lontong + Telur Rebus + Tahu Tempe',
            portionDesc: 'Lontong 1 porsi, sayuran rebus penuh, bumbu kacang dipisah secukupnya',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Semangka & Melon Potong Segar',
            portionDesc: '2 potong besar buah tinggi elektrolit dan air',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Nasi + Ayam Panggang Kecap + Bening Sawi Putih',
            portionDesc: '1 centong nasi, 1 potong dada ayam, kuah bening sawi tahu',
            kcalShare: dKcal,
          },
        ],
      },
      {
        day: 'Minggu',
        costEstimate: 'Rp34.000',
        meals: [
          {
            time: 'Sarapan (07.00)',
            title: 'Bubur Manado (Tinutuan) Labu & Sayur Hijau + Ikan Cakalang/Telur',
            portionDesc: '1 mangkuk bubur kaya serat sayur + suwiran ikan/telur rebus',
            kcalShare: bKcal,
          },
          {
            time: 'Makan Siang (12.30)',
            title: 'Nasi + Ikan Bakar Rica/Kecap + Sayur Kelor / Bayam Jagung',
            portionDesc: '1,5 centong nasi, 1 ekor ikan bakar sedang, semangkuk sayur kelor/bayam',
            kcalShare: lKcal,
          },
          {
            time: 'Camilan Sore (16.00)',
            title: 'Pisang Rebus & Kopi Hitam / Teh Tanpa Gula',
            portionDesc: '2 potong pisang rebus hangat',
            kcalShare: sKcal,
          },
          {
            time: 'Makan Malam (19.00)',
            title: 'Nasi + Tahu Tempe Bacem Panggang + Telur Dadar Daun Bawang',
            portionDesc: '1 centong nasi, 2 potong tempe/tahu, 1 telur dadar tebal',
            kcalShare: dKcal,
          },
        ],
      },
    ];
  }

  // Tier Seimbang & Fleksibel
  const isFlexible = tier.includes('fleksibel');
  return [
    {
      day: 'Senin',
      costEstimate: isFlexible ? 'Rp85.000' : 'Rp55.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Oatmeal Pisang + 2 Telur Rebus + Susu Rendah Lemak',
          portionDesc: '50g rolled oats, 1 pisang ambon, 2 telur utuh, 200ml susu tinggi protein',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi Merah/Putih + Dada Ayam Grill + Tumis Brokoli Wortel & Tempe',
          portionDesc: '150g dada ayam tanpa kulit, 1 centong nasi merah, 1 potong tempe',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Greek Yogurt / Susu Protein & Potongan Buah Naga',
          portionDesc: '1 cup yogurt plain + setengah buah naga merah',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Ikan Kembung / Kakap Kuah Asam Segar + Nasi + Sayur Bening',
          portionDesc: '150g fillet/ekor ikan laut segar, 1 centong nasi, lalapan rebus',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Selasa',
      costEstimate: isFlexible ? 'Rp90.000' : 'Rp58.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Roti Gandum Utuh + Omelet Jamur Bayam + Alpukat',
          portionDesc: '2 lembar roti gandum, 2 telur omelet sayur, 1/2 buah alpukat mentega',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Empal Daging Sapi Tanpa Lemak (Panggang) + Sayur Asem',
          portionDesc: '120g daging sapi has dalam, 1,5 centong nasi, semangkuk sayur asem',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Kacang Almond / Edamame Rebus & Apel Segar',
          portionDesc: '1 mangkuk edamame + 1 buah apel malang/fuji',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Sup Tahu Sutera & Dada Ayam Cincang + Kentang Rebus',
          portionDesc: '120g dada ayam cincang, 1 blok tahu sutera, 150g kentang rebus',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Rabu',
      costEstimate: isFlexible ? 'Rp82.000' : 'Rp52.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Ubi Panggang Madu + 2 Telur Ceplok Air + Pepaya',
          portionDesc: '200g ubi cilembu panggang, 2 butir telur, 1 porsi pepaya',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Ikan Tuna / Tongkol Steak Sambal Matah + Kangkung Bawang Putih',
          portionDesc: '150g daging ikan tuna/tongkol tebal, 1,5 centong nasi, tumis kangkung',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Puding Chia Seed Susu Kedelai & Pisang',
          portionDesc: '2 sdm chia seed + 200ml susu kedelai rendah gula',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Pepes Ayam Kemangi Tanpa Kulit + Nasi Merah + Lalapan',
          portionDesc: '150g dada ayam pepes bumbu rempah, 1 centong nasi merah',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Kamis',
      costEstimate: isFlexible ? 'Rp88.000' : 'Rp56.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Smoothie Bowl Pisang Bayam + Telur Rebus + Granola Lokal',
          portionDesc: 'Pisang beku blender, susu protein, 2 telur rebus pendamping',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Soto Daging Sapi Kuah Bening + Tempe Panggang',
          portionDesc: '120g potongan daging sapi tanpa lemak, 1,5 centong nasi, 2 potong tempe',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Jagung Manis Rebus & Susu High-Protein',
          portionDesc: '1 jagung rebus + 200ml susu',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Capcay Seafood (Udang & Cumi Segar) + Nasi Hangat',
          portionDesc: '120g udang & cumi kupas, aneka sayur segar, 1 centong nasi',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Jumat',
      costEstimate: isFlexible ? 'Rp86.000' : 'Rp54.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Nasi Merah + Telur Dadar Daun Kelor/Bayam + Tahu Kukus',
          portionDesc: '1 centong nasi merah, 2 telur ayam kampung/negeri, 2 potong tahu',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Ayam Bakar Taliwang/Rempah (Dada) + Plecing Kangkung',
          portionDesc: '150g dada ayam bakar minim minyak, plecing kangkung tauge',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Buah Pir / Jambu Kristal & Kacang Panggang',
          portionDesc: '1 buah jambu kristal besar + 20g kacang panggang',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Ikan Kuah Kuning (Palumara / Pindang) + Kentang / Nasi',
          portionDesc: '1 ekor ikan segar kuah kunyit rempah, 1 centong nasi',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Sabtu',
      costEstimate: isFlexible ? 'Rp92.000' : 'Rp60.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Pancake Oat Pisang Telur + Toping Buah Segar',
          portionDesc: '60g oat, 2 butir telur, 1 pisang, potongan stroberi/pepaya',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Sate Ayam Daging Dada (10 Tusuk) + Acar & Sop Bening',
          portionDesc: '10 tusuk sate dada ayam murni tanpa kulit, bumbu kacang terukur',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Air Kelapa Muda Murni & Edamame',
          portionDesc: '1 gelas air kelapa tanpa sirup + semangkuk edamame',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Tumis Sapi Lada Hitam Paprika + Nasi Merah',
          portionDesc: '120g iris daging sapi has dalam, paprika & bawang bombay, 1 centong nasi',
          kcalShare: dKcal,
        },
      ],
    },
    {
      day: 'Minggu',
      costEstimate: isFlexible ? 'Rp90.000' : 'Rp57.000',
      meals: [
        {
          time: 'Sarapan (07.00)',
          title: 'Bubur Manado Komplit + Ikan Cakalang Panggang + Telur Rebus',
          portionDesc: 'Semangkuk bubur labu sayur + 100g cakalang suwir tanpa goreng',
          kcalShare: bKcal,
        },
        {
          time: 'Makan Siang (12.30)',
          title: 'Nasi + Ikan Baronang / Kakap Bakar + Sayur Bening Daun Katuk/Bayam',
          portionDesc: '1 porsi besar ikan bakar segar, sambal dabu-dabu tomat, 1,5 centong nasi',
          kcalShare: lKcal,
        },
        {
          time: 'Camilan Sore (16.00)',
          title: 'Alpukat Kocok Susu Skim Tanpa Kental Manis',
          portionDesc: '1 buah alpukat matang + susu rendah lemak dingin',
          kcalShare: sKcal,
        },
        {
          time: 'Makan Malam (19.00)',
          title: 'Salad Ayam Panggang Lokal / Gado-Gado Pengantin Protein Tinggi',
          portionDesc: '120g dada ayam suwir, telur rebus, sayuran segar, kentang rebus',
          kcalShare: dKcal,
        },
      ],
    },
  ];
}

interface DayWorkout {
  day: string;
  focus: string;
  duration: string;
  intensity: string;
  isRest?: boolean;
  exercises: string[];
}

function generateWorkoutSchedule(
  goal: FitnessGoal,
  activity: ActivityLevel
): DayWorkout[] {
  const stepTarget =
    activity === 'sedentary'
      ? '6.500 langkah'
      : activity === 'light'
      ? '8.000 langkah'
      : '9.500 langkah';

  if (goal === 'fat_loss') {
    return [
      {
        day: 'Senin',
        focus: 'Full Body Circuit & Pembakaran Metabolik',
        duration: '35–40 Menit',
        intensity: 'Moderat',
        exercises: [
          'Bodyweight Squat — 3 set × 15 repetisi (jeda 45 detik)',
          'Incline / Regular Push-Up — 3 set × 10–12 repetisi',
          'Reverse Lunges — 3 set × 12 repetisi per kaki',
          'Plank Core Hold — 3 set × 40 detik',
          `Target NEAT: Jalan kaki santai total ${stepTarget}`,
        ],
      },
      {
        day: 'Selasa',
        focus: 'Kardio Zona 2 (Jalan Cepat / Jogging / Sepeda)',
        duration: '30–40 Menit',
        intensity: 'Ringan–Moderat',
        exercises: [
          'Pemanasan mobilitas sendi panggul & engkel — 5 menit',
          'Jalan cepat berirama / brisk walk atau sepeda statis — 30 menit konstan',
          'Peregangan betis & hamstring — 5 menit',
        ],
      },
      {
        day: 'Rabu',
        focus: 'Upper Body & Core Stability (Kamar Kos / Rumah)',
        duration: '35 Menit',
        intensity: 'Moderat',
        exercises: [
          'Push-Up Variasi (Knee / Regular) — 4 set × 10 repetisi',
          'Chair Tricep Dips — 3 set × 12 repetisi',
          'Superman Back Extension — 3 set × 15 repetisi',
          'Mountain Climbers Tempo Terkontrol — 3 set × 30 detik',
        ],
      },
      {
        day: 'Kamis',
        focus: 'Pemulihan Aktif & Mobilitas Tulang Belakang',
        duration: '20 Menit',
        intensity: 'Pemulihan',
        isRest: true,
        exercises: [
          'Cat-Cow & Thoracic Spine Stretch — 10 menit',
          `Jalan kaki sore santai menjaga ritme ${stepTarget}`,
          'Tidur 30 menit lebih awal untuk menekan hormon kortisol',
        ],
      },
      {
        day: 'Jumat',
        focus: 'Lower Body Strength & Glutes Activation',
        duration: '40 Menit',
        intensity: 'Moderat–Tinggi',
        exercises: [
          'Sumo Squat — 4 set × 15 repetisi',
          'Glute Bridge Hold — 3 set × 15 repetisi (tahan 2 detik di puncak)',
          'Step-Up ke Bangku Kokoh / Tangga — 3 set × 12 repetisi per kaki',
          'Wall Sit Isometric — 3 set × 40 detik',
        ],
      },
      {
        day: 'Sabtu',
        focus: 'Interval Kardio Ringan & Aktivitas Luar Ruang',
        duration: '40 Menit',
        intensity: 'Moderat',
        exercises: [
          'Interval 2 menit jalan cepat + 1 menit jogging ringan (ulangi 8–10 siklus)',
          'Dead Bug Core Exercise — 3 set × 12 repetisi',
          'Peregangan seluruh tubuh — 10 menit',
        ],
      },
      {
        day: 'Minggu',
        focus: 'Istirahat Penuh & Persiapan Meal Prep Mingguan',
        duration: 'Fleksibel',
        intensity: 'Istirahat',
        isRest: true,
        exercises: [
          'Pemulihan otot penuh tanpa beban latihan berat',
          'Belanja bahan pangan lokal segar (tempe, telur, ikan, sayur) untuk sepekan',
        ],
      },
    ];
  }

  if (goal === 'muscle_gain') {
    return [
      {
        day: 'Senin',
        focus: 'Upper Body Push (Dada, Bahu, Tricep)',
        duration: '45 Menit',
        intensity: 'Tinggi (Progressive Overload)',
        exercises: [
          'Standard / Decline Push-Up atau Dumbbell Press — 4 set × 10–12 repetisi',
          'Pike Push-Up / Overhead Shoulder Press — 4 set × 10 repetisi',
          'Lateral Raise (Dumbbell / Botol Air 1.5L) — 3 set × 15 repetisi',
          'Bench / Chair Dips — 3 set × 12 repetisi',
        ],
      },
      {
        day: 'Selasa',
        focus: 'Lower Body Hypertrophy (Quadriceps & Calves)',
        duration: '45 Menit',
        intensity: 'Tinggi',
        exercises: [
          'Bulgarian Split Squat — 4 set × 10 repetisi per kaki',
          'Goblet Squat (dengan beban ransel/dumbbell) — 4 set × 12 repetisi',
          'Single-Leg Calf Raise — 4 set × 15 repetisi',
          'Hollow Body Core Hold — 3 set × 40 detik',
        ],
      },
      {
        day: 'Rabu',
        focus: 'Active Recovery & Langkah Harian Terukur',
        duration: '25 Menit',
        intensity: 'Pemulihan',
        isRest: true,
        exercises: [
          'Foam rolling / peregangan dinamis bahu dan panggul — 15 menit',
          `Jalan santai menjaga sirkulasi darah (${stepTarget})`,
        ],
      },
      {
        day: 'Kamis',
        focus: 'Upper Body Pull & Postur Punggung',
        duration: '45 Menit',
        intensity: 'Tinggi',
        exercises: [
          'Pull-Up / Australian Inverted Row di Bawah Meja Kokoh — 4 set × 8–10 repetisi',
          'One-Arm Dumbbell / Backpack Row — 4 set × 12 repetisi',
          'Prone Y-T-W Shoulder Raise — 3 set × 12 repetisi',
          'Bicep Curl — 3 set × 12 repetisi',
        ],
      },
      {
        day: 'Jumat',
        focus: 'Posterior Chain (Hamstring, Glutes, Lower Back)',
        duration: '45 Menit',
        intensity: 'Tinggi',
        exercises: [
          'Romanian Deadlift (Dumbbell / Beban) — 4 set × 12 repetisi',
          'Single-Leg Hip Thrust — 4 set × 12 repetisi per sisi',
          'Walking Lunges — 3 set × 20 langkah total',
          'Side Plank — 3 set × 35 detik per sisi',
        ],
      },
      {
        day: 'Sabtu',
        focus: 'Full Body Conditioning & Arm Finisher',
        duration: '35 Menit',
        intensity: 'Moderat',
        exercises: [
          'Diamond Push-Up — 3 set × 10 repetisi',
          'Chin-Up / Hammer Curl — 3 set × 12 repetisi',
          ' Squat Jump Terkontrol — 3 set × 10 repetisi',
        ],
      },
      {
        day: 'Minggu',
        focus: 'Istirahat Total & Superkompensasi Otot',
        duration: 'Istirahat',
        intensity: 'Pemulihan Penuh',
        isRest: true,
        exercises: [
          'Tidur malam minimal 7,5–8 jam untuk sintesis protein otot optimal',
          'Pastikan target protein harian terpenuhi penuh',
        ],
      },
    ];
  }

  // Maintenance / Bugar Seimbang
  return [
    {
      day: 'Senin',
      focus: 'Kekuatan Fungsional Seluruh Tubuh A',
      duration: '35 Menit',
      intensity: 'Moderat',
      exercises: [
        'Bodyweight Squat — 3 set × 15 repetisi',
        'Push-Up — 3 set × 12 repetisi',
        'Glute Bridge — 3 set × 15 repetisi',
        'Plank — 3 set × 45 detik',
      ],
    },
    {
      day: 'Selasa',
      focus: 'Kardio Aerobik & Stamina Jantung',
      duration: '30 Menit',
      intensity: 'Moderat',
      exercises: [
        'Jogging ringan / bersepeda / berenang — 30 menit',
        `Target akumulasi langkah harian: ${stepTarget}`,
      ],
    },
    {
      day: 'Rabu',
      focus: 'Mobilitas Sendi & Core Balance',
      duration: '25 Menit',
      intensity: 'Ringan',
      exercises: [
        'Bird-Dog & Dead Bug — 3 set × 12 repetisi',
        'World’s Greatest Stretch — 5 repetisi per sisi',
        'Jalan kaki santai sore 20 menit',
      ],
    },
    {
      day: 'Kamis',
      focus: 'Kekuatan Fungsional Seluruh Tubuh B',
      duration: '35 Menit',
      intensity: 'Moderat',
      exercises: [
        'Forward / Reverse Lunges — 3 set × 12 repetisi per kaki',
        'Pike Push-Up — 3 set × 10 repetisi',
        'Superman Back Hold — 3 set × 15 repetisi',
        'Side Plank — 3 set × 30 detik',
      ],
    },
    {
      day: 'Jumat',
      focus: 'Pemulihan Aktif & Peregangan',
      duration: '20 Menit',
      intensity: 'Pemulihan',
      isRest: true,
      exercises: [
        'Peregangan otot leher, bahu, dan pinggang setelah duduk lama',
        `Pertahankan langkah harian ${stepTarget}`,
      ],
    },
    {
      day: 'Sabtu',
      focus: 'Olahraga Rekreasional / Outdoor Favorit',
      duration: '45 Menit',
      intensity: 'Moderat',
      exercises: [
        'Bulu tangkis, futsal santai, lari pagi taman, atau jalan cepat bersama teman',
        'Hidrasi ekstra 500ml selama beraktivitas',
      ],
    },
    {
      day: 'Minggu',
      focus: 'Istirahat & Relaksasi Akhir Pekan',
      duration: 'Istirahat',
      intensity: 'Pemulihan',
      isRest: true,
      exercises: [
        'Istirahat berkualitas dan persiapan menu sehat minggu berikutnya',
      ],
    },
  ];
}

export default function ResultPage() {
  const [userInput, setUserInput] = useState<UserInput>(DEFAULT_INPUT);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'meal' | 'workout'>('all');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedV1 = localStorage.getItem('nutrifit_assessment_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        if (parsed?.input) {
          setUserInput({ ...DEFAULT_INPUT, ...parsed.input });
          setIsLoaded(true);
          return;
        }
      }
      const savedRaw = localStorage.getItem('nutrifit_user_input');
      if (savedRaw) {
        const parsedRaw = JSON.parse(savedRaw);
        setUserInput({ ...DEFAULT_INPUT, ...parsedRaw });
      }
    } catch {
      // Gunakan DEFAULT_INPUT jika gagal membaca localStorage
    }
    setIsLoaded(true);
  }, []);

  const metrics = useMemo(() => calculateMetrics(userInput), [userInput]);

  // Kalkulasi lanjutan komposisi tubuh
  const composition = useMemo(() => {
    const heightM = userInput.heightCm / 100;
    // Rentang berat ideal WHO Asia-Pasifik (BMI 18.5 - 22.9)
    const minIdealKg = +(18.5 * heightM * heightM).toFixed(1);
    const maxIdealKg = +(22.9 * heightM * heightM).toFixed(1);

    const fatMassKg = +((userInput.weightKg * metrics.bodyFat) / 100).toFixed(1);
    const leanMassKg = +(userInput.weightKg - fatMassKg).toFixed(1);
    const waterLiters = +(userInput.weightKg * 0.035).toFixed(1);

    return {
      minIdealKg,
      maxIdealKg,
      fatMassKg,
      leanMassKg,
      waterLiters,
    };
  }, [userInput, metrics]);

  const weeklyMeals = useMemo(
    () => generateMealPlans(userInput.budgetTier, metrics.targetCalories),
    [userInput.budgetTier, metrics.targetCalories]
  );

  const weeklyWorkouts = useMemo(
    () => generateWorkoutSchedule(userInput.goal, userInput.activityLevel),
    [userInput.goal, userInput.activityLevel]
  );

  const recommendedArticles = useMemo(() => {
    return [
      {
        title: 'Panduan Piring Gizi Seimbang dengan Bahan Pangan Lokal',
        category: 'Gizi Seimbang',
        image: '/images/artikel-piring-lokal.webp',
        reason: `Cocok untuk membagi target ${metrics.targetCalories.toLocaleString('id-ID')} kkal ke dalam porsi makan harian.`,
      },
      {
        title:
          metrics.whr >= (userInput.gender === 'male' ? 0.9 : 0.85)
            ? 'Mengapa Ukuran Celana Lebih Jujur Dibanding Timbangan Biasa?'
            : 'Bahaya Diet Terlalu Ketat di Bawah Kebutuhan BMR',
        category:
          metrics.whr >= (userInput.gender === 'male' ? 0.9 : 0.85)
            ? 'Komposisi Tubuh'
            : 'Manajemen Kalori',
        image:
          metrics.whr >= (userInput.gender === 'male' ? 0.9 : 0.85)
            ? '/images/artikel-ukur-pinggang.webp'
            : '/images/artikel-energi-seimbang.webp',
        reason:
          metrics.whr >= (userInput.gender === 'male' ? 0.9 : 0.85)
            ? `Rasio WHR kamu saat ini ${metrics.whr}. Pelajari strategi memangkas lemak viseral secara aman.`
            : `Target kalorimu dijaga tetap di atas BMR (${metrics.bmr.toLocaleString('id-ID')} kkal) agar metabolisme tetap optimal.`,
      },
      {
        title:
          userInput.sleepHours < 7
            ? 'Tidur Cukup: Rahasia Menjaga Metabolisme dan Hormon Lapar'
            : 'Kekuatan 7.000 Langkah Harian: Membakar Kalori Tanpa Sadar',
        category: userInput.sleepHours < 7 ? 'Pemulihan' : 'Aktivitas Harian',
        image:
          userInput.sleepHours < 7
            ? '/images/artikel-tidur-pulih.webp'
            : '/images/artikel-jalan-kaki.webp',
        reason:
          userInput.sleepHours < 7
            ? `Durasi tidurmu (${userInput.sleepHours} jam) perlu ditingkatkan ke 7–8 jam untuk menekan hormon lapar ghrelin.`
            : 'Optimalkan pembakaran kalori non-olahraga (NEAT) sepanjang aktivitas harianmu.',
      },
    ];
  }, [metrics, userInput]);

  const activeMealDay = weeklyMeals[selectedDayIdx] ?? weeklyMeals[0];

  return (
    <main className="min-h-screen bg-[#EEF5FC] pb-24 text-[#0B2545]">
      {/* HEADER BANNER SENADA HERO DASHBOARD NUVICA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#A8CDF0] via-[#CFE4F9] to-[#EEF5FC] pt-6 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Baris Navigasi Atas */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/input"
                className="group inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:text-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84] transition group-hover:bg-[#38D46A] group-hover:text-[#0B2545]">
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
                </span>
                Ubah Data Input
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-bold text-[#1E293B] transition hover:bg-white sm:text-sm"
              >
                Ke Dashboard Utama
              </Link>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm transition hover:bg-white sm:text-sm"
              >
                <Printer className="h-4 w-4 text-[#0B4B84]" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>

          {/* Judul Utama Laporan */}
          <div className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#38D46A]" />
                Laporan Biometrik & Rekomendasi Personal
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl lg:text-5xl">
                CETAK BIRU KEBUGARAN{' '}
                <span className="inline-flex items-center gap-2 align-middle">
                  <InlineTitleIcon className="h-11 w-11 sm:h-13 sm:w-13" />
                  <span className="text-[#0B4B84] uppercase">
                    {userInput.name ? userInput.name : 'PERSONAL'}
                  </span>
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#1E293B] sm:text-base">
                Disusun berdasarkan standar antropometri{' '}
                <strong>WHO Asia-Pasifik</strong>, metode komposisi tubuh{' '}
                <strong>US Navy</strong>, serta persamaan energi{' '}
                <strong>Mifflin-St Jeor</strong> dengan proteksi batas aman BMR.
              </p>
            </div>

            {/* Badge Ringkasan Profil Singkat */}
            <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-white bg-white/85 p-3.5 shadow-sm backdrop-blur-md">
              <span className="rounded-xl bg-[#EEF5FC] px-3 py-1.5 text-xs font-extrabold text-[#0B2545]">
                {userInput.gender === 'male' ? 'Pria' : 'Wanita'}, {userInput.age} thn
              </span>
              <span className="rounded-xl bg-[#EEF5FC] px-3 py-1.5 text-xs font-extrabold text-[#0B2545]">
                {userInput.heightCm} cm • {userInput.weightKg} kg
              </span>
              <span className="rounded-xl bg-[#05203C] px-3 py-1.5 text-xs font-extrabold text-[#38D46A]">
                {GOAL_META[userInput.goal]?.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BAGIAN 1: 4 KARTU RINGKASAN EKSEKUTIF FULL-BLEED (Gaya ServiceCard Dashboard) */}
      <section className="mx-auto -mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kartu 1: BMI Asia-Pasifik */}
          <article className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/nuvica-service-body.webp"
                alt="Indeks Massa Tubuh Asia-Pasifik"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#0B2545]/90 px-3 py-1 text-[11px] font-extrabold text-white">
                WHO Asia-Pasifik
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                <Scale className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-28">
              <span className="text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase">
                Indeks Massa Tubuh
              </span>
              <div className="mt-0.5 flex items-baseline gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0B2545]">
                  {metrics.bmi}
                </h2>
                <span className="text-xs font-extrabold text-[#0B4B84]">
                  kg/m²
                </span>
              </div>
              <p className="mt-1 text-xs font-extrabold text-[#0B2545]">
                Status: {metrics.bmiCategory}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                Rentang berat ideal tinggimu:{' '}
                <strong>
                  {composition.minIdealKg} – {composition.maxIdealKg} kg
                </strong>
              </p>
            </div>
          </article>

          {/* Kartu 2: Komposisi Lemak US Navy & WHR */}
          <article className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/artikel-ukur-pinggang.webp"
                alt="Komposisi Lemak Tubuh & WHR"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#0B2545]/90 px-3 py-1 text-[11px] font-extrabold text-white">
                US Navy & WHR
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                <HeartPulse className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-28">
              <span className="text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase">
                Estimasi Lemak Tubuh
              </span>
              <div className="mt-0.5 flex items-baseline gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0B2545]">
                  {metrics.bodyFat}%
                </h2>
                <span className="text-xs font-extrabold text-[#0B4B84]">
                  ({composition.fatMassKg} kg lemak)
                </span>
              </div>
              <p className="mt-1 text-xs font-extrabold text-[#0B2545]">
                WHR {metrics.whr} • {metrics.whrStatus}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                Massa bebas lemak (otot & tulang):{' '}
                <strong>{composition.leanMassKg} kg</strong>
              </p>
            </div>
          </article>

          {/* Kartu 3: Energi BMR & TDEE */}
          <article className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/artikel-energi-seimbang.webp"
                alt="Metabolisme Basal BMR dan TDEE"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#0B2545]/90 px-3 py-1 text-[11px] font-extrabold text-white">
                Mifflin-St Jeor
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                <Flame className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-28">
              <span className="text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase">
                Total Energi Harian (TDEE)
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0B2545]">
                  {metrics.tdee.toLocaleString('id-ID')}
                </h2>
                <span className="text-xs font-extrabold text-[#0B4B84]">
                  kkal/hari
                </span>
              </div>
              <p className="mt-1 text-xs font-extrabold text-[#0B2545]">
                Batas Minimum BMR: {metrics.bmr.toLocaleString('id-ID')} kkal
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                Level:{' '}
                <strong>
                  {ACTIVITY_MULTIPLIERS[userInput.activityLevel]?.label}
                </strong>
              </p>
            </div>
          </article>

          {/* Kartu 4 (Featured Dark Blue): Target Kalori & Makro */}
          <article className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[#1E4E79]/60 bg-[#05203C] p-6 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/nuvica-service-report.webp"
                alt="Target Kalori dan Makronutrien"
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041A33] via-[#041A33]/80 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#38D46A] px-3 py-1 text-[11px] font-extrabold text-[#0B2545]">
                Target Harian Aman
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B2545] shadow-md">
                <ShieldCheck className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-24">
              <span className="text-xs font-extrabold tracking-wide text-[#38D46A] uppercase">
                Rekomendasi Asupan Kalori
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <h2 className="text-3xl font-extrabold tracking-tight text-white">
                  {metrics.targetCalories.toLocaleString('id-ID')}
                </h2>
                <span className="text-xs font-bold text-[#E0F2FE]">
                  kkal/hari
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-[#E0F2FE]">
                P: {metrics.proteinGrams}g • K: {metrics.carbGrams}g • L:{' '}
                {metrics.fatGrams}g
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#38D46A]">
                {metrics.bmrGuardTriggered
                  ? 'Guardrail Aktif: Dikunci aman setara BMR'
                  : 'Terverifikasi aman di atas batas BMR'}
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* BAGIAN 2: DETAIL ANALISIS KOMPOSISI, HIDRASI & PEMULIHAN */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Panel Kiri: Indikator Visual Biometrik & Makronutrien */}
          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                  Evaluasi Klinis & Antropometri
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-[#0B2545]">
                  Peta Komposisi Tubuh & Makronutrien
                </h2>
              </div>
              <span className="rounded-full bg-[#EEF5FC] px-3.5 py-1 text-xs font-extrabold text-[#0B4B84]">
                Lingkar Pinggang {userInput.waistCm} cm
              </span>
            </div>

            {/* Bar Komposisi Massa Otot vs Lemak */}
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2545]">
                  <span>Proporsi Massa Bebas Lemak vs Massa Lemak</span>
                  <span>
                    {+(100 - metrics.bodyFat).toFixed(1)}% Otot & Organ •{' '}
                    {metrics.bodyFat}% Lemak
                  </span>
                </div>
                <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full bg-[#EEF5FC]">
                  <div
                    style={{ width: `${Math.min(100 - metrics.bodyFat, 92)}%` }}
                    className="bg-[#0B4B84] transition-all duration-500"
                    title="Massa Bebas Lemak"
                  />
                  <div
                    style={{ width: `${Math.max(metrics.bodyFat, 8)}%` }}
                    className="bg-[#38D46A] transition-all duration-500"
                    title="Massa Lemak"
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-[#1E293B]">
                  <span>
                    Massa Bebas Lemak: <strong>{composition.leanMassKg} kg</strong>
                  </span>
                  <span>
                    Estimasi Massa Lemak: <strong>{composition.fatMassKg} kg</strong>
                  </span>
                </div>
              </div>

              {/* Kartu Rincian 3 Makronutrien */}
              <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                  <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                    Protein Harian
                  </span>
                  <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                    {metrics.proteinGrams} gram
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                    {(metrics.proteinGrams * 4).toLocaleString('id-ID')} kkal •
                    Menjaga & memperbaiki jaringan otot
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                  <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                    Karbohidrat Kompleks
                  </span>
                  <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                    {metrics.carbGrams} gram
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                    {(metrics.carbGrams * 4).toLocaleString('id-ID')} kkal •
                    Sumber bahan bakar utama latihan & otak
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                  <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                    Lemak Esensial
                  </span>
                  <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                    {metrics.fatGrams} gram
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                    {(metrics.fatGrams * 9).toLocaleString('id-ID')} kkal •
                    Keseimbangan hormon & penyerapan vitamin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Kanan: Hidrasi, Kualitas Tidur & Catatan Medis BMR */}
          <div className="space-y-4 lg:col-span-5">
            {/* Hidrasi & Tidur */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                  <Droplets className="h-5 w-5 stroke-[2.2]" />
                </div>
                <span className="mt-3 block text-xs font-extrabold text-[#0B4B84] uppercase">
                  Target Hidrasi Air
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                  {composition.waterLiters} Liter
                  <small className="text-xs font-bold text-[#1E293B]">
                    {' '}
                    / hari
                  </small>
                </div>
                <p className="mt-1 text-xs font-medium text-[#1E293B]">
                  Setara ±{Math.round((composition.waterLiters * 1000) / 250)}{' '}
                  gelas belimbing (35 ml × {userInput.weightKg} kg berat tubuh).
                </p>
              </div>

              <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                  <Moon className="h-5 w-5 stroke-[2.2]" />
                </div>
                <span className="mt-3 block text-xs font-extrabold text-[#0B4B84] uppercase">
                  Evaluasi Tidur Malam
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                  {userInput.sleepHours} Jam
                  <small className="text-xs font-bold text-[#1E293B]">
                    {' '}
                    / malam
                  </small>
                </div>
                <p className="mt-1 text-xs font-medium text-[#1E293B]">
                  {userInput.sleepHours >= 7
                    ? 'Optimal! Mendukung pemulihan hormon leptin & otot.'
                    : 'Kurang dari 7 jam. Tingkatkan agar nafsu makan terkontrol.'}
                </p>
              </div>
            </div>

            {/* Kotak Proteksi Keamanan BMR */}
            <div className="rounded-[2rem] border border-[#1E4E79]/40 bg-[#05203C] p-6 text-white shadow-md">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                  {metrics.bmrGuardTriggered ? (
                    <AlertTriangle className="h-5 w-5 stroke-[2.4]" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 stroke-[2.4]" />
                  )}
                </span>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#38D46A] uppercase">
                    Status Keamanan Metabolisme (BMR Guard)
                  </span>
                  <h3 className="mt-0.5 text-base font-extrabold text-white">
                    {metrics.bmrGuardTriggered
                      ? 'Proteksi Aktif: Kalori Dikunci di Batas BMR'
                      : 'Rencana Kalori Aman di Atas BMR'}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#E0F2FE]">
                    Kebutuhan energi dasar organ vitalmu (BMR) adalah{' '}
                    <strong>{metrics.bmr.toLocaleString('id-ID')} kkal</strong>.
                    Target harianmu ditetapkan pada{' '}
                    <strong>
                      {metrics.targetCalories.toLocaleString('id-ID')} kkal
                    </strong>{' '}
                    agar tubuh membakar cadangan lemak tanpa menyusutkan massa
                    otot atau memicu kelelahan kronis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER NAVIGASI RENCANA AKSI 7 HARI */}
      <section className="no-print mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white bg-white/85 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
              <Calendar className="h-5 w-5 stroke-[2.3]" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#0B2545] sm:text-lg">
                Kurikulum Aksi 7 Hari (Nutrisi & Latihan)
              </h2>
              <p className="text-xs font-medium text-[#1E293B]">
                Pilih tampilan modul rencana mingguan di bawah ini
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'Tampilkan Semua' },
                { id: 'meal', label: 'Menu Pangan Lokal 7 Hari' },
                { id: 'workout', label: 'Program Latihan 7 Hari' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  activeTab === tab.id
                    ? 'bg-[#05203C] text-white shadow-sm'
                    : 'bg-[#EEF5FC] text-[#0B2545] hover:bg-[#DCEBF8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BAGIAN 3: RENCANA MENU PANGAN LOKAL 7 HARI */}
      {(activeTab === 'all' || activeTab === 'meal') && (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 sm:block">
                  <Image
                    src="/images/nuvica-service-meal.webp"
                    alt="Menu Pangan Lokal"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Modul Nutrisi Harian • Tier Anggaran:{' '}
                    {userInput.budgetTier.trim().toUpperCase()}
                  </span>
                  <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#0B2545]">
                    Rencana Menu Pangan Lokal 7 Hari
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#1E293B] sm:text-sm">
                    Disusun menggunakan bahan lokal yang mudah didapat di pasar
                    atau warung sekitar dengan estimasi biaya{' '}
                    <strong>{activeMealDay.costEstimate}/hari</strong>.
                  </p>
                </div>
              </div>

              {/* Pemilih Hari (Senin - Minggu) */}
              <div className="flex flex-wrap gap-1.5">
                {weeklyMeals.map((item, idx) => {
                  const active = idx === selectedDayIdx;
                  return (
                    <button
                      key={item.day}
                      type="button"
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition ${
                        active
                          ? 'bg-[#0B4B84] text-white shadow-sm'
                          : 'bg-[#EEF5FC] text-[#0B2545] hover:bg-[#DCEBF8]'
                      }`}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid 4 Waktu Makan pada Hari Terpilih */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {activeMealDay.meals.map((meal, index) => (
                <div
                  key={meal.time}
                  className={`flex flex-col justify-between rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                    index === 1
                      ? 'border-[#1E4E79] bg-[#05203C] text-white'
                      : 'border-slate-100 bg-[#EEF5FC]/65 text-[#0B2545]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-extrabold ${
                          index === 1 ? 'text-[#38D46A]' : 'text-[#0B4B84]'
                        }`}
                      >
                        {meal.time}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                          index === 1
                            ? 'bg-[#38D46A] text-[#0B2545]'
                            : 'bg-white text-[#0B4B84]'
                        }`}
                      >
                        ±{meal.kcalShare} kkal
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-extrabold leading-snug">
                      {meal.title}
                    </h3>
                  </div>

                  <p
                    className={`mt-4 border-t pt-3 text-xs leading-relaxed ${
                      index === 1
                        ? 'border-white/15 text-[#E0F2FE]'
                        : 'border-slate-200/70 text-[#1E293B]'
                    }`}
                  >
                    {meal.portionDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BAGIAN 4: PROGRAM LATIHAN 7 HARI */}
      {(activeTab === 'all' || activeTab === 'workout') && (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 sm:block">
                  <Image
                    src="/images/nuvica-service-workout.webp"
                    alt="Program Latihan 7 Hari"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Kurikulum Fisik Mingguan • {GOAL_META[userInput.goal]?.label}
                  </span>
                  <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#0B2545]">
                    Jadwal Latihan & Pemulihan 7 Hari
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#1E293B] sm:text-sm">
                    Dirancang agar dapat dilakukan secara mandiri di rumah/kamar
                    kos maupun pusat kebugaran tanpa membebani sendi.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#EEF5FC] px-4 py-2 text-xs font-extrabold text-[#0B4B84] sm:self-center">
                <Dumbbell className="h-4 w-4" />
                Progresif & Terukur
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklyWorkouts.map((w) => (
                <div
                  key={w.day}
                  className={`flex flex-col justify-between rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                    w.isRest
                      ? 'border-slate-200/80 bg-[#EEF5FC]/45 text-[#0B2545]'
                      : 'border-slate-100 bg-[#EEF5FC]/85 text-[#0B2545]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#0B2545] px-3 py-1 text-xs font-extrabold text-white">
                        {w.day}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                          w.isRest
                            ? 'bg-white text-[#1E293B]'
                            : 'bg-[#38D46A] text-[#0B2545]'
                        }`}
                      >
                        {w.duration} • {w.intensity}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-extrabold text-[#0B2545]">
                      {w.focus}
                    </h3>

                    <ul className="mt-3 space-y-2">
                      {w.exercises.map((ex, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs font-medium leading-relaxed text-[#1E293B]"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B4B84]" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BAGIAN 5: REKOMENDASI BACAAN TERKAIT (MENGGUNAKAN ASET ARTIKEL .WEBP) */}
      <section className="no-print mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
              Edukasi Terkurasi
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0B2545] sm:text-2xl">
              Panduan yang Paling Relevan Untukmu
            </h2>
          </div>
          <Link
            href="/#sumber-belajar"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0B4B84] hover:underline sm:text-sm"
          >
            <BookOpen className="h-4 w-4" />
            Lihat Semua Artikel
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {recommendedArticles.map((art) => (
            <Link
              key={art.title}
              href="/#sumber-belajar"
              className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-[#0B2545]/90 px-3 py-1 text-[11px] font-extrabold text-white">
                  {art.category}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-sm transition-transform group-hover:rotate-12">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.4]" />
                </span>
              </div>

              <div className="relative z-10 mt-24">
                <h3 className="text-base font-extrabold leading-snug text-[#0B2545]">
                  {art.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#1E293B]">
                  {art.reason}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}