'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Activity,
  Ruler,
  Flame,
  Utensils,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Info,
  RotateCcw,
} from 'lucide-react';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
type FitnessGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';
type BudgetTier = 'hemat' | 'seimbang' | ' fleksibel';
type ActiveSection = 'body' | 'activity' | 'nutrition';

export interface NutriFitInputData {
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
  budgetTier: BudgetTier;
  sleepHours: number;
}

const DEFAULT_FORM: NutriFitInputData = {
  name: '',
  gender: 'male',
  age: 22,
  heightCm: 170,
  weightKg: 68,
  waistCm: 80,
  hipCm: 94,
  neckCm: 37,
  activityLevel: 'light',
  goal: 'fat_loss',
  budgetTier: 'hemat',
  sleepHours: 7,
};

const ACTIVITY_OPTIONS: {
  id: ActivityLevel;
  label: string;
  multiplier: number;
  desc: string;
}[] = [
  {
    id: 'sedentary',
    label: 'Sedenter (Minim Gerak)',
    multiplier: 1.2,
    desc: 'Banyak duduk di depan layar, langkah harian < 4.000 langkah.',
  },
  {
    id: 'light',
    label: 'Aktif Ringan',
    multiplier: 1.375,
    desc: 'Olahraga ringan 1–3 hari/minggu atau jalan kaki 5.000–7.000 langkah.',
  },
  {
    id: 'moderate',
    label: 'Aktif Moderat',
    multiplier: 1.55,
    desc: 'Latihan terstruktur 3–5 hari/minggu dan aktif bergerak harian.',
  },
  {
    id: 'active',
    label: 'Sangat Aktif',
    multiplier: 1.725,
    desc: 'Latihan intensif 6–7 hari/minggu atau aktivitas fisik berat.',
  },
];

const GOAL_OPTIONS: {
  id: FitnessGoal;
  label: string;
  deltaKcal: number;
  badge: string;
  desc: string;
}[] = [
  {
    id: 'fat_loss',
    label: 'Turun Lemak (Defisit Aman)',
    deltaKcal: -400,
    badge: '-400 kkal dari TDEE',
    desc: 'Memangkas lemak viseral dengan tetap mengunci batas aman di atas BMR.',
  },
  {
    id: 'maintenance',
    label: 'Jaga Komposisi & Bugar',
    deltaKcal: 0,
    badge: 'Seimbang TDEE',
    desc: 'Mempertahankan berat ideal, meningkatkan stamina, dan memperbaiki pola makan.',
  },
  {
    id: 'muscle_gain',
    label: 'Naik Massa Otot (Lean Bulk)',
    deltaKcal: 300,
    badge: '+300 kkal dari TDEE',
    desc: 'Surplus kalori terukur dengan protein tinggi untuk pembentukan otot.',
  },
];

const BUDGET_OPTIONS: {
  id: BudgetTier;
  label: string;
  range: string;
  examples: string;
}[] = [
  {
    id: 'hemat',
    label: 'Hemat Anak Kos / Mahasiswa',
    range: 'Rp25.000 – Rp40.000 / hari',
    examples: 'Tempe, tahu, telur ayam, ikan tongkol, sayur kangkung/bayam, pisang.',
  },
  {
    id: 'seimbang',
    label: 'Seimbang Harian',
    range: 'Rp45.000 – Rp75.000 / hari',
    examples: 'Dada ayam, ikan kembung, telur, tahu/tempe, beras merah/putih, buah lokal.',
  },
  {
    id: ' fleksibel',
    label: 'Fleksibel / Variatif',
    range: '> Rp75.000 / hari',
    examples: 'Daging sapi tanpa lemak, fillet ikan laut, dada ayam, susu tinggi protein.',
  },
];

const SECTION_SHOWCASE: Record<
  ActiveSection,
  { image: string; badge: string; title: string; subtitle: string }
> = {
  body: {
    image: '/images/nuvica-service-body.webp',
    badge: 'Tahap 1 • Antropometri & Lingkar Tubuh',
    title: 'Analisis Komposisi Tubuh Presisi',
    subtitle:
      'Mengukur BMI standar Asia-Pasifik sekaligus memetakan distribusi lemak perut (WHR) dan persentase lemak US Navy.',
  },
  activity: {
    image: '/images/nuvica-service-workout.webp',
    badge: 'Tahap 2 • Aktivitas & Ritme Pemulihan',
    title: 'Kalibrasi Energi & Latihan 7 Hari',
    subtitle:
      'Menyesuaikan pengeluaran energi harian (TDEE) dan durasi tidur untuk menyusun jadwal latihan yang realistis.',
  },
  nutrition: {
    image: '/images/nuvica-service-meal.webp',
    badge: 'Tahap 3 • Target Kalori & Pangan Lokal',
    title: 'Rencana Gizi Aman di Atas BMR',
    subtitle:
      'Menghitung makronutrien harian dengan proteksi BMR dan menyusun rekomendasi menu lokal sesuai anggaranmu.',
  },
};

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState<NutriFitInputData>(DEFAULT_FORM);
  const [activeSection, setActiveSection] = useState<ActiveSection>('body');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof NutriFitInputData>(
    key: K,
    value: NutriFitInputData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetType: 'male_cut' | 'female_fit') => {
    if (presetType === 'male_cut') {
      setForm({
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
      });
    } else {
      setForm({
        name: 'Nadia',
        gender: 'female',
        age: 21,
        heightCm: 160,
        weightKg: 56,
        waistCm: 71,
        hipCm: 92,
        neckCm: 32,
        activityLevel: 'light',
        goal: 'maintenance',
        budgetTier: 'seimbang',
        sleepHours: 7.5,
      });
    }
  };

  // Kalkulasi Biometrik Real-Time
  const metrics = useMemo(() => {
    const heightM = Math.max(form.heightCm, 100) / 100;
    const bmi = +(form.weightKg / (heightM * heightM)).toFixed(1);

    // Kategori BMI WHO Asia-Pasifik
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

    // Rasio Lingkar Pinggang-Pinggul (WHR)
    const whr = +(form.waistCm / Math.max(form.hipCm, 50)).toFixed(2);
    const whrLimit = form.gender === 'male' ? 0.9 : 0.85;
    const whrStatus =
      whr < whrLimit ? 'Risiko Viseral Rendah' : 'Waspada Lemak Viseral';

    // Estimasi Lemak Tubuh Metode US Navy
    let bodyFat = 20;
    if (form.gender === 'male') {
      const diff = Math.max(form.waistCm - form.neckCm, 25);
      bodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(diff) +
            0.15456 * Math.log10(Math.max(form.heightCm, 120))) -
        450;
    } else {
      const sumDiff = Math.max(form.waistCm + form.hipCm - form.neckCm, 45);
      bodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(sumDiff) +
            0.221 * Math.log10(Math.max(form.heightCm, 120))) -
        450;
    }
    const safeBodyFat = +Math.min(Math.max(bodyFat, 5), 55).toFixed(1);

    // BMR Mifflin-St Jeor
    const baseBmr =
      10 * form.weightKg +
      6.25 * form.heightCm -
      5 * form.age +
      (form.gender === 'male' ? 5 : -161);
    const bmr = Math.round(Math.max(baseBmr, 1000));

    const activityMultiplier =
      ACTIVITY_OPTIONS.find((a) => a.id === form.activityLevel)?.multiplier ??
      1.375;
    const tdee = Math.round(bmr * activityMultiplier);

    const goalDelta =
      GOAL_OPTIONS.find((g) => g.id === form.goal)?.deltaKcal ?? 0;
    const rawTarget = tdee + goalDelta;

    // Guardrail Keamanan: Target Kalori TIDAK BOLEH di bawah BMR
    const bmrGuardTriggered = rawTarget < bmr;
    const targetCalories = Math.max(rawTarget, bmr);

    // Pembagian Makronutrien
    const proteinGrams = Math.round(
      form.weightKg * (form.goal === 'muscle_gain' ? 2.0 : 1.8)
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
      bodyFat: safeBodyFat,
      bmr,
      tdee,
      targetCalories,
      bmrGuardTriggered,
      proteinGrams,
      fatGrams,
      carbGrams,
    };
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      input: form,
      metrics,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem('nutrifit_assessment_v1', JSON.stringify(payload));
      localStorage.setItem('nutrifit_user_input', JSON.stringify(form));
    } catch {
      // Fallback jika storage penuh
    }

    router.push('/result');
  };

  const showcase = SECTION_SHOWCASE[activeSection];

  return (
    <main className="min-h-screen bg-[#EEF5FC] pb-20 text-[#0B2545]">
      {/* Bagian Header / Banner Atas Senada Hero Dashboard Nuvica */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#A8CDF0] via-[#CFE4F9] to-[#EEF5FC] pt-6 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Navigasi Atas */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-sm font-bold text-[#0B2545] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84] transition group-hover:bg-[#38D46A] group-hover:text-[#0B2545]">
                <ArrowLeft className="h-4 w-4 stroke-[2.4]" />
              </span>
              Kembali ke Dashboard
            </Link>

            {/* Tombol Preset Cepat untuk Pengujian */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0B2545]/75">
                Isi Cepat Contoh:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('male_cut')}
                className="rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-[#0B2545] shadow-sm transition hover:bg-white"
              >
                Pria (Defisit Lemak)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('female_fit')}
                className="rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-[#0B2545] shadow-sm transition hover:bg-white"
              >
                Wanita (Jaga Bugar)
              </button>
              <button
                type="button"
                onClick={() => setForm(DEFAULT_FORM)}
                title="Reset Formulir"
                className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#1E293B] transition hover:bg-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Judul Utama dengan Ikon 3D Inline Khas Dashboard */}
          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#38D46A]" />
              Kalibrasi Biometrik & Nutrisi Personal
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl lg:text-5xl">
              INPUT DATA TUBUH &{' '}
              <span className="inline-flex items-center gap-2 align-middle">
                <Image
                  src="/images/nuvica-inline-title.webp"
                  alt=""
                  width={48}
                  height={48}
                  className="inline-block h-10 w-10 rounded-2xl object-cover shadow-md sm:h-12 sm:w-12"
                />
                <span className="text-[#0B4B84]">TARGET BUGAR</span>
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#1E293B] sm:text-base">
              Lengkapi parameter antropometri dan kebiasaan harianmu. Sistem akan
              memetakan komposisi tubuh secara instan dan menyusun rencana kalori
              serta latihan yang aman di atas batas metabolisme dasar (BMR).
            </p>
          </div>
        </div>
      </section>

      {/* Kontainer Utama 2 Kolom */}
      <section className="mx-auto -mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
        >
          {/* KOLOM KIRI (7 Kolom): Formulir Multi-Seksi */}
          <div className="space-y-6 lg:col-span-7">
            {/* SEKSI 1: Antropometri & Lingkar Tubuh */}
            <div
              onFocusCapture={() => setActiveSection('body')}
              onClick={() => setActiveSection('body')}
              className={`rounded-[2rem] border p-6 transition-all duration-300 sm:p-8 ${
                activeSection === 'body'
                  ? 'border-white bg-white shadow-lg ring-2 ring-[#0B4B84]/15'
                  : 'border-white/80 bg-white/85 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-sm">
                    <Ruler className="h-5 w-5 stroke-[2.4]" />
                  </span>
                  <div>
                    <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                      Bagian 01
                    </span>
                    <h2 className="text-xl font-extrabold tracking-tight text-[#0B2545]">
                      Profil & Ukuran Lingkar Tubuh
                    </h2>
                  </div>
                </div>
                <span className="hidden rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-bold text-[#0B4B84] sm:inline-block">
                  BMI Asia & US Navy
                </span>
              </div>

              <div className="mt-6 space-y-6">
                {/* Nama & Jenis Kelamin */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold tracking-wide text-[#0B2545] uppercase">
                      Nama Panggilan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Akmal"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#EEF5FC]/60 px-4 py-3 text-sm font-bold text-[#0B2545] placeholder:font-normal placeholder:text-slate-400 focus:border-[#0B4B84] focus:bg-white focus:ring-2 focus:ring-[#38D46A]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold tracking-wide text-[#0B2545] uppercase">
                      Jenis Kelamin Biologis
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {(
                        [
                          { id: 'male', label: 'Pria' },
                          { id: 'female', label: 'Wanita' },
                        ] as const
                      ).map((g) => {
                        const selected = form.gender === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => updateField('gender', g.id)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold transition-all ${
                              selected
                                ? 'border-[#1E4E79] bg-[#05203C] text-white shadow-md'
                                : 'border-slate-200 bg-[#EEF5FC]/60 text-[#0B2545] hover:bg-white'
                            }`}
                          >
                            {selected && (
                              <CheckCircle2 className="h-4 w-4 text-[#38D46A]" />
                            )}
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Usia, Tinggi, Berat */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Usia */}
                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/55 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B]">
                        Usia
                      </label>
                      <span className="text-base font-extrabold text-[#0B4B84]">
                        {form.age} <small className="text-xs">thn</small>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={75}
                      value={form.age}
                      onChange={(e) =>
                        updateField('age', Number(e.target.value))
                      }
                      className="mt-3 w-full accent-[#0B4B84]"
                    />
                    <input
                      type="number"
                      min={15}
                      max={75}
                      value={form.age}
                      onChange={(e) =>
                        updateField('age', Number(e.target.value) || 15)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-extrabold text-[#0B2545]"
                    />
                  </div>

                  {/* Tinggi Badan */}
                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/55 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B]">
                        Tinggi Badan
                      </label>
                      <span className="text-base font-extrabold text-[#0B4B84]">
                        {form.heightCm} <small className="text-xs">cm</small>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={135}
                      max={210}
                      value={form.heightCm}
                      onChange={(e) =>
                        updateField('heightCm', Number(e.target.value))
                      }
                      className="mt-3 w-full accent-[#0B4B84]"
                    />
                    <input
                      type="number"
                      min={135}
                      max={210}
                      value={form.heightCm}
                      onChange={(e) =>
                        updateField('heightCm', Number(e.target.value) || 135)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-extrabold text-[#0B2545]"
                    />
                  </div>

                  {/* Berat Badan */}
                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/55 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B]">
                        Berat Badan
                      </label>
                      <span className="text-base font-extrabold text-[#0B4B84]">
                        {form.weightKg} <small className="text-xs">kg</small>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={35}
                      max={160}
                      step={0.5}
                      value={form.weightKg}
                      onChange={(e) =>
                        updateField('weightKg', Number(e.target.value))
                      }
                      className="mt-3 w-full accent-[#0B4B84]"
                    />
                    <input
                      type="number"
                      min={35}
                      max={160}
                      step={0.5}
                      value={form.weightKg}
                      onChange={(e) =>
                        updateField('weightKg', Number(e.target.value) || 35)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-extrabold text-[#0B2545]"
                    />
                  </div>
                </div>

                {/* Lingkar Pinggang, Pinggul, Leher */}
                <div className="rounded-2xl border border-[#0B4B84]/15 bg-[#EEF5FC]/80 p-4 sm:p-5">
                  <div className="flex items-start gap-2.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0B4B84]" />
                    <p className="text-xs font-medium leading-relaxed text-[#1E293B]">
                      <strong>Mengapa lingkar tubuh diukur?</strong> Timbangan
                      saja tidak bisa membedakan massa otot dan lemak perut.
                      Ukuran pinggang, pinggul, dan leher digunakan untuk
                      menghitung <strong>WHR</strong> dan{' '}
                      <strong>% Lemak Tubuh US Navy</strong> secara akurat.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-extrabold text-[#0B2545]">
                        Lingkar Pinggang (cm)
                      </label>
                      <span className="text-[11px] text-[#1E293B]/75">
                        Sejajar pusar
                      </span>
                      <input
                        type="number"
                        min={50}
                        max={160}
                        value={form.waistCm}
                        onChange={(e) =>
                          updateField('waistCm', Number(e.target.value) || 50)
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm font-extrabold text-[#0B2545] shadow-sm focus:border-[#0B4B84] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#0B2545]">
                        Lingkar Pinggul (cm)
                      </label>
                      <span className="text-[11px] text-[#1E293B]/75">
                        Bagian terlebar pinggul
                      </span>
                      <input
                        type="number"
                        min={60}
                        max={170}
                        value={form.hipCm}
                        onChange={(e) =>
                          updateField('hipCm', Number(e.target.value) || 60)
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm font-extrabold text-[#0B2545] shadow-sm focus:border-[#0B4B84] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#0B2545]">
                        Lingkar Leher (cm)
                      </label>
                      <span className="text-[11px] text-[#1E293B]/75">
                        Tepat di bawah jakun
                      </span>
                      <input
                        type="number"
                        min={25}
                        max={60}
                        value={form.neckCm}
                        onChange={(e) =>
                          updateField('neckCm', Number(e.target.value) || 25)
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm font-extrabold text-[#0B2545] shadow-sm focus:border-[#0B4B84] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEKSI 2: Tingkat Aktivitas & Waktu Tidur */}
            <div
              onFocusCapture={() => setActiveSection('activity')}
              onClick={() => setActiveSection('activity')}
              className={`rounded-[2rem] border p-6 transition-all duration-300 sm:p-8 ${
                activeSection === 'activity'
                  ? 'border-white bg-white shadow-lg ring-2 ring-[#0B4B84]/15'
                  : 'border-white/80 bg-white/85 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-sm">
                    <Activity className="h-5 w-5 stroke-[2.4]" />
                  </span>
                  <div>
                    <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                      Bagian 02
                    </span>
                    <h2 className="text-xl font-extrabold tracking-tight text-[#0B2545]">
                      Aktivitas Fisik & Kualitas Pemulihan
                    </h2>
                  </div>
                </div>
                <span className="hidden rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-bold text-[#0B4B84] sm:inline-block">
                  Kalkulasi TDEE
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {ACTIVITY_OPTIONS.map((item) => {
                  const selected = form.activityLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField('activityLevel', item.id)}
                      className={`group flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-[#1E4E79] bg-[#05203C] text-white shadow-md'
                          : 'border-slate-200/80 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold">
                          {item.label}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            selected
                              ? 'bg-[#38D46A] text-[#0B2545]'
                              : 'bg-white text-[#0B4B84]'
                          }`}
                        >
                          ×{item.multiplier}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-xs leading-relaxed ${
                          selected ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Durasi Tidur Harian */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-[#EEF5FC]/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-[#0B2545]">
                      Rata-Rata Durasi Tidur Malam
                    </label>
                    <p className="text-xs text-[#1E293B]">
                      Tidur &lt; 6 jam meningkatkan hormon ghrelin (pemicu lapar)
                      dan menghambat pemulihan otot.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-white px-3.5 py-1.5 text-sm font-extrabold text-[#0B4B84] shadow-sm">
                    {form.sleepHours} Jam / malam
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={10}
                  step={0.5}
                  value={form.sleepHours}
                  onChange={(e) =>
                    updateField('sleepHours', Number(e.target.value))
                  }
                  className="mt-3 w-full accent-[#0B4B84]"
                />
              </div>
            </div>

            {/* SEKSI 3: Target Kebugaran & Preferensi Budget Menu Lokal */}
            <div
              onFocusCapture={() => setActiveSection('nutrition')}
              onClick={() => setActiveSection('nutrition')}
              className={`rounded-[2rem] border p-6 transition-all duration-300 sm:p-8 ${
                activeSection === 'nutrition'
                  ? 'border-white bg-white shadow-lg ring-2 ring-[#0B4B84]/15'
                  : 'border-white/80 bg-white/85 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-sm">
                    <Utensils className="h-5 w-5 stroke-[2.4]" />
                  </span>
                  <div>
                    <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                      Bagian 03
                    </span>
                    <h2 className="text-xl font-extrabold tracking-tight text-[#0B2545]">
                      Target Kalori & Anggaran Pangan Lokal
                    </h2>
                  </div>
                </div>
                <span className="hidden rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-bold text-[#0B4B84] sm:inline-block">
                  Proteksi BMR Aktif
                </span>
              </div>

              {/* Pilihan Target Kebugaran */}
              <div className="mt-6">
                <label className="block text-xs font-extrabold tracking-wide text-[#0B2545] uppercase">
                  Pilih Fokus Tujuan Utama
                </label>
                <div className="mt-3 grid grid-cols-1 gap-3.5">
                  {GOAL_OPTIONS.map((g) => {
                    const selected = form.goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => updateField('goal', g.id)}
                        className={`flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition-all sm:flex-row sm:items-center ${
                          selected
                            ? 'border-[#1E4E79] bg-[#05203C] text-white shadow-md'
                            : 'border-slate-200/80 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-white'
                        }`}
                      >
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            {selected && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38D46A]" />
                            )}
                            <span className="text-sm font-extrabold">
                              {g.label}
                            </span>
                          </div>
                          <p
                            className={`mt-1 text-xs leading-relaxed ${
                              selected ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
                            }`}
                          >
                            {g.desc}
                          </p>
                        </div>
                        <span
                          className={`mt-2 inline-block shrink-0 self-start rounded-full px-3 py-1 text-xs font-extrabold sm:mt-0 sm:self-center ${
                            selected
                              ? 'bg-[#38D46A] text-[#0B2545]'
                              : 'bg-white text-[#0B4B84]'
                          }`}
                        >
                          {g.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Budget Menu Lokal */}
              <div className="mt-6">
                <label className="block text-xs font-extrabold tracking-wide text-[#0B2545] uppercase">
                  Preferensi Anggaran Menu Harian (Bahan Lokal)
                </label>
                <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  {BUDGET_OPTIONS.map((b) => {
                    const selected = form.budgetTier === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => updateField('budgetTier', b.id)}
                        className={`flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition-all ${
                          selected
                            ? 'border-[#1E4E79] bg-[#05203C] text-white shadow-md'
                            : 'border-slate-200/80 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-white'
                        }`}
                      >
                        <div>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                              selected
                                ? 'bg-[#38D46A] text-[#0B2545]'
                                : 'bg-white text-[#0B4B84]'
                            }`}
                          >
                            {b.range}
                          </span>
                          <h3 className="mt-2 text-sm font-extrabold">
                            {b.label}
                          </h3>
                        </div>
                        <p
                          className={`mt-2 text-[11px] leading-relaxed ${
                            selected ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
                          }`}
                        >
                          {b.examples}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Submit Utama */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E293B]">
                  <ShieldCheck className="h-4 w-4 text-[#38D46A]" />
                  Data dihitung instan di perangkatmu tanpa antrean server.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#0B4B84] px-7 py-4 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#083A68] hover:shadow-xl sm:w-auto"
                >
                  <span>
                    {isSubmitting
                      ? 'Menyusun Laporan Lengkap...'
                      : 'Hasilkan Analisis & Rencana 7 Hari'}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] transition-transform duration-300 group-hover:rotate-12">
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (5 Kolom): Kartu Visual 3D Dinamis & Live Biometric Preview */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:col-span-5">
            {/* Kartu Showcase 3D Glass Full-Bleed Senada ServiceCard Dashboard */}
            <article className="group relative flex min-h-[270px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-md">
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={showcase.image}
                  alt={showcase.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-[#0B2545]/90 px-3.5 py-1 text-[11px] font-extrabold text-white shadow-sm backdrop-blur-md">
                  {showcase.badge}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                  <Flame className="h-5 w-5 stroke-[2.3]" />
                </span>
              </div>

              <div className="relative z-10 mt-28">
                <h3 className="text-xl font-extrabold leading-tight tracking-tight text-[#0B2545]">
                  {showcase.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#1E293B]">
                  {showcase.subtitle}
                </p>
              </div>
            </article>

            {/* Kartu Pratinjau Biometrik Real-Time (Gaya Kartu ke-4 Biru Gelap) */}
            <div className="relative overflow-hidden rounded-[2rem] border border-[#1E4E79]/60 bg-[#05203C] p-6 text-white shadow-xl sm:p-7">
              {/* Gambar Latar Halus dari nuvica-service-report.webp */}
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <Image
                  src="/images/nuvica-service-report.webp"
                  alt=""
                  fill
                  className="object-cover object-right-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041A33] via-[#041A33]/90 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div>
                    <span className="text-[11px] font-extrabold tracking-wider text-[#38D46A] uppercase">
                      Pratinjau Biometrik Instan
                    </span>
                    <h3 className="text-lg font-extrabold tracking-tight text-white">
                      {form.name
                        ? `Ringkasan Tubuh ${form.name}`
                        : 'Ringkasan Kalkulasi Saat Ini'}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#E0F2FE]">
                    Live AI
                  </span>
                </div>

                {/* Grid 4 Indikator Utama */}
                <div className="mt-5 grid grid-cols-2 gap-3.5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                    <span className="text-[11px] font-medium text-[#E0F2FE]">
                      BMI (Asia-Pasifik)
                    </span>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      {metrics.bmi}
                    </div>
                    <span
                      className={`mt-0.5 block text-[11px] font-bold ${metrics.bmiColor}`}
                    >
                      {metrics.bmiCategory}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                    <span className="text-[11px] font-medium text-[#E0F2FE]">
                      Estimasi Lemak (Navy)
                    </span>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      {metrics.bodyFat}%
                    </div>
                    <span className="mt-0.5 block text-[11px] font-bold text-[#38D46A]">
                      WHR: {metrics.whr} ({metrics.whrStatus})
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                    <span className="text-[11px] font-medium text-[#E0F2FE]">
                      BMR (Batas Minimum)
                    </span>
                    <div className="mt-1 text-xl font-extrabold text-white">
                      {metrics.bmr.toLocaleString('id-ID')}{' '}
                      <small className="text-xs font-normal text-[#E0F2FE]">
                        kkal
                      </small>
                    </div>
                    <span className="mt-0.5 block text-[11px] text-[#E0F2FE]/80">
                      TDEE: {metrics.tdee.toLocaleString('id-ID')} kkal
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#38D46A]/40 bg-[#38D46A]/15 p-3.5 backdrop-blur-sm">
                    <span className="text-[11px] font-bold text-[#38D46A]">
                      Target Kalori Aman
                    </span>
                    <div className="mt-1 text-xl font-extrabold text-white">
                      {metrics.targetCalories.toLocaleString('id-ID')}{' '}
                      <small className="text-xs font-normal text-[#E0F2FE]">
                        kkal
                      </small>
                    </div>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#E0F2FE]">
                      {metrics.bmrGuardTriggered
                        ? 'Dikunci aman pada batas BMR'
                        : 'Sesuai target & di atas BMR'}
                    </span>
                  </div>
                </div>

                {/* Distribusi Makronutrien Harian */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[#E0F2FE]">
                    <span>Estimasi Target Makronutrien Harian</span>
                    <span className="text-[#38D46A]">Seimbang</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/10 p-2.5">
                      <span className="block text-[11px] text-[#E0F2FE]">
                        Protein
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {metrics.proteinGrams}g
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/10 p-2.5">
                      <span className="block text-[11px] text-[#E0F2FE]">
                        Karbohidrat
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {metrics.carbGrams}g
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/10 p-2.5">
                      <span className="block text-[11px] text-[#E0F2FE]">
                        Lemak Sehat
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {metrics.fatGrams}g
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}