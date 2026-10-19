'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Scale,
  Flame,
  Lock,
  CheckCircle2,
  User,
  Activity,
  Wallet,
} from 'lucide-react';
import {
  UserTier,
  GoogleAccountProfile,
  HistoryRecord,
  AccessPolicy,
  AuthTierController,
  HistoryRepository,
} from '@/lib/authTierService';
import {
  AccountStatusBar,
  GoogleLoginModal,
  SubscriptionPaymentModal,
  HistoryModal,
} from '@/components/AuthPaymentModals';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
type FitnessGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';
type BudgetTier = 'hemat' | 'seimbang' | 'fleksibel';
type ActiveSection = 'body' | 'activity' | 'lifestyle';

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
  activityLevel: 'moderate',
  goal: 'fat_loss',
  budgetTier: 'hemat',
  sleepHours: 7,
};

const ACTIVITY_OPTIONS: {
  id: ActivityLevel;
  label: string;
  desc: string;
  factor: number;
}[] = [
  {
    id: 'sedentary',
    label: 'Sedenter (Minim Gerak)',
    desc: 'Banyak duduk di kelas/kantor, langkah harian < 4.000',
    factor: 1.2,
  },
  {
    id: 'light',
    label: 'Aktif Ringan',
    desc: 'Olahraga ringan 1–3 hari/minggu atau jalan kaki rutin',
    factor: 1.375,
  },
  {
    id: 'moderate',
    label: 'Aktif Moderat',
    desc: 'Latihan terstruktur 3–5 hari/minggu',
    factor: 1.55,
  },
  {
    id: 'active',
    label: 'Sangat Aktif',
    desc: 'Latihan fisik intensif 6–7 hari/minggu',
    factor: 1.725,
  },
];

const GOAL_OPTIONS: {
  id: FitnessGoal;
  label: string;
  desc: string;
  delta: number;
}[] = [
  {
    id: 'fat_loss',
    label: 'Turun Lemak (Defisit Aman)',
    desc: 'Pangkas lemak perut dengan tetap menjaga massa otot & batas BMR',
    delta: -400,
  },
  {
    id: 'maintenance',
    label: 'Jaga Komposisi & Bugar',
    desc: 'Pertahankan berat ideal dan optimalkan energi harian',
    delta: 0,
  },
  {
    id: 'muscle_gain',
    label: 'Naik Massa Otot (Lean Bulk)',
    desc: 'Surplus kalori terukur +300 kkal dengan protein tinggi',
    delta: 300,
  },
];

const BUDGET_OPTIONS: {
  id: BudgetTier;
  label: string;
  range: string;
  desc: string;
}[] = [
  {
    id: 'hemat',
    label: 'Hemat (Mahasiswa / Kos)',
    range: 'Rp25.000 – Rp40.000 / hari',
    desc: 'Fokus telur, tempe, tahu, ikan tongkol/kembung, sayur bening',
  },
  {
    id: 'seimbang',
    label: 'Seimbang (Harian Lokal)',
    range: 'Rp45.000 – Rp75.000 / hari',
    desc: 'Kombinasi dada ayam, ikan segar, daging tanpa lemak, buah lokal',
  },
  {
    id: 'fleksibel',
    label: 'Fleksibel (Variasi Penuh)',
    range: '> Rp75.000 / hari',
    desc: 'Pilihan protein laut/sapi premium, oat, susu tinggi protein',
  },
];

const SECTION_SHOWCASE: Record<
  ActiveSection,
  { image: string; badge: string; title: string }
> = {
  body: {
    image: '/images/nuvica-service-body.webp',
    badge: 'Langkah 01 • Antropometri Tubuh',
    title: 'Ukur Komposisi & Berat Idealmu',
  },
  activity: {
    image: '/images/nuvica-service-workout.webp',
    badge: 'Langkah 02 • Aktivitas & Tujuan',
    title: 'Sesuaikan Ritme Gerak Harian',
  },
  lifestyle: {
    image: '/images/nuvica-service-meal.webp',
    badge: 'Langkah 03 • Gizi Lokal & Istirahat',
    title: 'Kurasi Menu Sesuai Budgetmu',
  },
};

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState<NutriFitInputData>(DEFAULT_FORM);
  const [activeSection, setActiveSection] = useState<ActiveSection>('body');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [tier, setTier] = useState<UserTier>('guest');
  const [authUser, setAuthUser] = useState<GoogleAccountProfile | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingSubscriptionAfterLogin, setPendingSubscriptionAfterLogin] =
    useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const syncAuthSession = useCallback(() => {
    const session = AuthTierController.getSession();
    setTier(session.tier);
    setAuthUser(session.user);
    if (session.user && AccessPolicy.canRecordHistory(session.tier)) {
      setHistoryRecords(HistoryRepository.getRecords(session.user.email));
    } else {
      setHistoryRecords([]);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('nutrifit_assessment_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.input) {
          setForm((prev) => ({ ...prev, ...parsed.input }));
        }
      }
    } catch {
      // Gunakan DEFAULT_FORM
    }

    syncAuthSession();
    return AuthTierController.subscribe(syncAuthSession);
  }, [syncAuthSession]);

  const updateField = <K extends keyof NutriFitInputData>(
    key: K,
    value: NutriFitInputData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: 'male_cut' | 'female_fit') => {
    if (preset === 'male_cut') {
      setForm({
        name: authUser?.name || 'Akmal',
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
        name: authUser?.name || 'Nadia',
        gender: 'female',
        age: 21,
        heightCm: 160,
        weightKg: 54,
        waistCm: 68,
        hipCm: 90,
        neckCm: 32,
        activityLevel: 'light',
        goal: 'maintenance',
        budgetTier: 'seimbang',
        sleepHours: 7.5,
      });
    }
  };

  const preview = useMemo(() => {
    const heightM = Math.max(form.heightCm, 100) / 100;
    const bmi = +(form.weightKg / (heightM * heightM)).toFixed(1);
    const minIdealKg = +(18.5 * heightM * heightM).toFixed(1);
    const maxIdealKg = +(22.9 * heightM * heightM).toFixed(1);
    const midIdealKg = +((minIdealKg + maxIdealKg) / 2).toFixed(1);

    const whr = +(form.waistCm / Math.max(form.hipCm, 50)).toFixed(2);

    let rawBodyFat = 20;
    if (form.gender === 'male') {
      const diff = Math.max(form.waistCm - form.neckCm, 25);
      rawBodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(diff) +
            0.15456 * Math.log10(Math.max(form.heightCm, 120))) -
        450;
    } else {
      const sumDiff = Math.max(form.waistCm + form.hipCm - form.neckCm, 45);
      rawBodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(sumDiff) +
            0.221 * Math.log10(Math.max(form.heightCm, 120))) -
        450;
    }
    const bodyFat = +Math.min(Math.max(rawBodyFat, 5), 55).toFixed(1);

    const baseBmr =
      10 * form.weightKg +
      6.25 * form.heightCm -
      5 * form.age +
      (form.gender === 'male' ? 5 : -161);
    const bmr = Math.round(Math.max(baseBmr, 1000));

    const activityFactor =
      ACTIVITY_OPTIONS.find((a) => a.id === form.activityLevel)?.factor ??
      1.375;
    const tdee = Math.round(bmr * activityFactor);

    const goalDelta =
      GOAL_OPTIONS.find((g) => g.id === form.goal)?.delta ?? 0;
    const rawTarget = tdee + goalDelta;
    const targetCalories = Math.max(rawTarget, bmr);

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
      minIdealKg,
      maxIdealKg,
      midIdealKg,
      whr,
      bodyFat,
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      fatGrams,
      carbGrams,
    };
  }, [form]);

  const handleTriggerSubscribeFlow = () => {
    if (tier === 'guest' || !authUser) {
      setPendingSubscriptionAfterLogin(true);
      setIsLoginModalOpen(true);
      return;
    }
    if (tier === 'free_registered') {
      setIsPaymentModalOpen(true);
    }
  };

  // Parameter picture?: string opsional dan diteruskan ke AuthTierController
  const handleGoogleLoginSuccess = (
    name: string,
    email: string,
    picture?: string
  ) => {
    const result = AuthTierController.loginWithGoogle(name, email, picture);
    if (!form.name.trim()) {
      setForm((prev) => ({ ...prev, name }));
    }
    setIsLoginModalOpen(false);
    syncAuthSession();

    if (pendingSubscriptionAfterLogin) {
      setPendingSubscriptionAfterLogin(false);
      if (result.tier !== 'premium') {
        setIsPaymentModalOpen(true);
      }
    }
  };

  const handleConfirmPayment = (paymentMethod: string) => {
    AuthTierController.activatePremiumSubscription(paymentMethod);
    setIsPaymentModalOpen(false);
    syncAuthSession();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      input: {
        ...form,
        name: form.name.trim() || authUser?.name || 'Personal',
      },
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('nutrifit_assessment_v1', JSON.stringify(payload));
      localStorage.setItem('nutrifit_user_input', JSON.stringify(payload.input));

      const currentSession = AuthTierController.getSession();
      if (
        currentSession.user &&
        AccessPolicy.canRecordHistory(currentSession.tier)
      ) {
        HistoryRepository.saveRecord(
          currentSession.tier,
          currentSession.user.email,
          {
            input: payload.input,
            summary: {
              idealWeightMinKg: preview.minIdealKg,
              idealWeightMaxKg: preview.maxIdealKg,
              targetCalories: preview.targetCalories,
              proteinGrams: preview.proteinGrams,
              bmi: preview.bmi,
              bodyFat: preview.bodyFat,
            },
          }
        );
      }
    } catch {
      // Abaikan jika localStorage penuh
    }

    router.push('/result');
  };

  const showcase = SECTION_SHOWCASE[activeSection];
  const isFullAccess = AccessPolicy.canViewFullResult(tier);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#EEF5FC] pb-20 text-[#0B2545]">
        <div className="mx-auto max-w-7xl animate-pulse px-4 pt-12 sm:px-6 lg:px-8">
          <div className="h-9 w-40 rounded-full bg-white/80" />
          <div className="mt-6 h-12 w-2/3 rounded-2xl bg-white/80" />
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="h-[520px] rounded-[2rem] bg-white/80 lg:col-span-7" />
            <div className="h-[520px] rounded-[2rem] bg-white/80 lg:col-span-5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEF5FC] pb-24 text-[#0B2545]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#A8CDF0] via-[#CFE4F9] to-[#EEF5FC] pt-6 pb-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AccountStatusBar
            tier={tier}
            user={authUser}
            historyCount={historyRecords.length}
            onClickLogin={() => {
              setPendingSubscriptionAfterLogin(false);
              setIsLoginModalOpen(true);
            }}
            onClickSubscribe={handleTriggerSubscribeFlow}
            onClickOpenHistory={() => setIsHistoryModalOpen(true)}
            onClickLogout={() => AuthTierController.logout()}
            onClickDowngradeDemo={() =>
              AuthTierController.cancelPremiumForDemo()
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84] transition group-hover:bg-[#38D46A] group-hover:text-[#0B2545]">
                <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
              </span>
              Kembali ke Beranda
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1E293B]">
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
                className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#0B4B84] shadow-sm transition hover:bg-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#38D46A]" />
              Asesmen Biometrik Personal
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl lg:text-5xl">
              <span className="block">MASUKKAN DATA</span>
              <span className="mt-1 flex items-center gap-2">
                <Image
                  src="/images/nuvica-inline-title.webp"
                  alt=""
                  width={52}
                  height={52}
                  className="h-11 w-11 bg-transparent object-contain mix-blend-multiply [mask-image:radial-gradient(circle,black_60%,transparent_78%)] sm:h-13 sm:w-13"
                />
                <span className="text-[#0B4B84]">BIOMETRIK</span>
                <span>ANDA</span>
              </span>
            </h1>
            <p className="mt-3 text-sm font-medium text-[#1E293B] sm:text-base">
              {tier === 'guest'
                ? 'Status Pengunjung (Guest): Anda dapat mencoba sistem secara langsung, namun hasil dibatasi pada Berat Ideal serta Kalori & Protein Harian (riwayat tidak tercatat).'
                : tier === 'free_registered'
                ? `Status Pengguna Biasa (${authUser?.email}): Riwayat penggunaan otomatis tercatat di akun Anda. Upgrade ke Premium untuk membuka hasil lengkap & AI.`
                : `Status Pengguna Premium (${authUser?.email}): Akses penuh seluruh analisis biometrik, generator program AI, dan riwayat tercatat lengkap.`}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          suppressHydrationWarning
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
        >
          <div className="space-y-6 lg:col-span-7">
            <div
              onFocusCapture={() => setActiveSection('body')}
              onClick={() => setActiveSection('body')}
              className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Langkah 01
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0B2545]">
                    Profil & Ukuran Antropometri Tubuh
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0B2545] uppercase">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Akmal"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#EEF5FC]/60 px-4 py-3 text-sm font-bold text-[#0B2545] focus:border-[#0B4B84] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#0B2545] uppercase">
                      Jenis Kelamin Biologis
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      {(['male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateField('gender', g)}
                          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-extrabold transition ${
                            form.gender === g
                              ? 'border-[#05203C] bg-[#05203C] text-white shadow-sm'
                              : 'border-slate-200 bg-[#EEF5FC]/60 text-[#0B2545] hover:bg-[#EEF5FC]'
                          }`}
                        >
                          {g === 'male' ? 'Pria' : 'Wanita'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/60 p-4">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span>Usia</span>
                      <span className="text-[#0B4B84]">{form.age} thn</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={75}
                      value={form.age}
                      onChange={(e) => updateField('age', Number(e.target.value))}
                      className="mt-3 w-full accent-[#0B4B84]"
                    />
                    <input
                      type="number"
                      min={15}
                      max={75}
                      value={form.age}
                      onChange={(e) => updateField('age', Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-extrabold"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/60 p-4">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span>Tinggi Badan</span>
                      <span className="text-[#0B4B84]">{form.heightCm} cm</span>
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
                        updateField('heightCm', Number(e.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-extrabold"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/60 p-4">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span>Berat Badan</span>
                      <span className="text-[#0B4B84]">{form.weightKg} kg</span>
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
                        updateField('weightKg', Number(e.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-extrabold"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/55 p-4">
                  <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                    Lingkar Tubuh (cm) — Untuk Analisis WHR & US Navy Body Fat
                  </span>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-bold text-[#0B2545]">
                        Lingkar Pinggang (cm)
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={160}
                        value={form.waistCm}
                        onChange={(e) =>
                          updateField('waistCm', Number(e.target.value))
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2 text-xs font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#0B2545]">
                        Lingkar Pinggul (cm)
                      </label>
                      <input
                        type="number"
                        min={60}
                        max={170}
                        value={form.hipCm}
                        onChange={(e) =>
                          updateField('hipCm', Number(e.target.value))
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2 text-xs font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#0B2545]">
                        Lingkar Leher (cm)
                      </label>
                      <input
                        type="number"
                        min={25}
                        max={60}
                        value={form.neckCm}
                        onChange={(e) =>
                          updateField('neckCm', Number(e.target.value))
                        }
                        className="mt-1.5 w-full rounded-xl border border-white bg-white px-3.5 py-2 text-xs font-extrabold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              onFocusCapture={() => setActiveSection('activity')}
              onClick={() => setActiveSection('activity')}
              className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Langkah 02
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0B2545]">
                    Tingkat Aktivitas & Target Utama
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ACTIVITY_OPTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => updateField('activityLevel', act.id)}
                    className={`flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition ${
                      form.activityLevel === act.id
                        ? 'border-[#05203C] bg-[#05203C] text-white shadow-md'
                        : 'border-slate-200 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-[#EEF5FC]'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{act.label}</span>
                    <span
                      className={`mt-1 text-[11px] ${
                        form.activityLevel === act.id
                          ? 'text-[#E0F2FE]'
                          : 'text-[#1E293B]'
                      }`}
                    >
                      {act.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => updateField('goal', g.id)}
                    className={`flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition ${
                      form.goal === g.id
                        ? 'border-[#0B4B84] bg-[#0B4B84] text-white shadow-md'
                        : 'border-slate-200 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-[#EEF5FC]'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{g.label}</span>
                    <span
                      className={`mt-1 text-[11px] ${
                        form.goal === g.id ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
                      }`}
                    >
                      {g.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div
              onFocusCapture={() => setActiveSection('lifestyle')}
              onClick={() => setActiveSection('lifestyle')}
              className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Langkah 03
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0B2545]">
                    Anggaran Makan Harian & Durasi Istirahat
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => updateField('budgetTier', b.id)}
                    className={`flex flex-col justify-between rounded-[1.5rem] border p-4 text-left transition ${
                      form.budgetTier === b.id
                        ? 'border-[#05203C] bg-[#05203C] text-white shadow-md'
                        : 'border-slate-200 bg-[#EEF5FC]/55 text-[#0B2545] hover:bg-[#EEF5FC]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold">{b.label}</span>
                      <div className="mt-0.5 text-[11px] font-bold text-[#38D46A]">
                        {b.range}
                      </div>
                    </div>
                    <span
                      className={`mt-2 text-[11px] ${
                        form.budgetTier === b.id
                          ? 'text-[#E0F2FE]'
                          : 'text-[#1E293B]'
                      }`}
                    >
                      {b.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-[#EEF5FC]/60 p-4">
                <div className="flex justify-between text-xs font-extrabold">
                  <span>Rata-rata Tidur Malam</span>
                  <span className="text-[#0B4B84]">
                    {form.sleepHours} jam / malam
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
                  className="mt-2.5 w-full accent-[#0B4B84]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#05203C] px-7 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#0B2545] disabled:opacity-60"
              >
                <span>
                  {isSubmitting
                    ? 'Menyiapkan Hasil Analisis...'
                    : 'Lihat Hasil Analisis Biometrik'}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
            <article className="relative h-[220px] overflow-hidden rounded-[2rem] border border-[#1E4E79]/50 bg-[#05203C] p-6 text-white shadow-md">
              <Image
                src={showcase.image}
                alt={showcase.title}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041A33] via-[#041A33]/75 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <span className="w-fit rounded-full bg-[#38D46A] px-3 py-1 text-[11px] font-extrabold text-[#0B2545]">
                  {showcase.badge}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold">{showcase.title}</h3>
                  <p className="mt-1 text-xs text-[#E0F2FE]">
                    Pratinjau otomatis menyesuaikan level akses akun Anda.
                  </p>
                </div>
              </div>
            </article>

            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                  Pratinjau Hasil Instan
                </span>
                <span className="rounded-full bg-[#EEF5FC] px-3 py-0.5 text-[11px] font-extrabold text-[#0B4B84]">
                  {isFullAccess ? 'Akses Penuh (Premium)' : 'Hasil Terbatas'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                      1. Berat Badan Ideal
                    </span>
                    <Scale className="h-4 w-4 text-[#0B4B84]" />
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                    {preview.minIdealKg} – {preview.maxIdealKg} kg
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#1E293B]">
                    Titik tengah ideal: <strong>{preview.midIdealKg} kg</strong>
                  </p>
                </div>

                <div className="rounded-2xl bg-[#05203C] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#38D46A] uppercase">
                      2. Kalori & Protein Harian
                    </span>
                    <Flame className="h-4 w-4 text-[#38D46A]" />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-[#E0F2FE]">
                        Asupan Kalori
                      </span>
                      <div className="text-xl font-extrabold text-white">
                        {preview.targetCalories.toLocaleString('id-ID')} kkal
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#E0F2FE]">
                        Protein Harian
                      </span>
                      <div className="text-xl font-extrabold text-[#38D46A]">
                        {preview.proteinGrams} gram
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isFullAccess ? (
                <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 text-xs">
                  <div className="rounded-xl bg-[#EEF5FC] p-3">
                    <span className="font-bold text-[#0B4B84]">
                      BMI Asia-Pasifik
                    </span>
                    <div className="mt-0.5 text-base font-extrabold text-[#0B2545]">
                      {preview.bmi} kg/m²
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#EEF5FC] p-3">
                    <span className="font-bold text-[#0B4B84]">
                      % Lemak & WHR
                    </span>
                    <div className="mt-0.5 text-base font-extrabold text-[#0B2545]">
                      {preview.bodyFat}% • {preview.whr}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#EEF5FC] p-3">
                    <span className="font-bold text-[#0B4B84]">Karbohidrat</span>
                    <div className="mt-0.5 text-base font-extrabold text-[#0B2545]">
                      {preview.carbGrams}g / hari
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#EEF5FC] p-3">
                    <span className="font-bold text-[#0B4B84]">
                      Lemak Esensial
                    </span>
                    <div className="mt-0.5 text-base font-extrabold text-[#0B2545]">
                      {preview.fatGrams}g / hari
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#0B4B84]/35 bg-[#EEF5FC]/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2545]">
                    <Lock className="h-4 w-4 text-[#0B4B84]" />
                    Hasil Lengkap Terkunci (
                    {tier === 'guest' ? 'Guest' : 'Free Registered'})
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                    BMI Asia-Pasifik, % Lemak Tubuh US Navy, Rasio WHR, serta
                    Program AI 7 Hari hanya terbuka bagi{' '}
                    <strong>Pengguna Premium</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerSubscribeFlow}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#38D46A] px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm transition hover:brightness-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {tier === 'guest'
                      ? 'Login Google & Berlangganan Premium'
                      : 'Upgrade ke Premium Sekarang'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </section>

      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        pendingSubscriptionIntent={pendingSubscriptionAfterLogin}
        defaultName={form.name || 'Washiatul Akmal'}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingSubscriptionAfterLogin(false);
        }}
        onSuccessLogin={handleGoogleLoginSuccess}
      />

      <SubscriptionPaymentModal
        isOpen={isPaymentModalOpen}
        user={authUser}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        tier={tier}
        user={authUser}
        records={historyRecords}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectRecord={(rec) => setForm(rec.input as NutriFitInputData)}
        onClearHistory={() => {
          HistoryRepository.clearRecords(authUser?.email);
          setHistoryRecords([]);
        }}
        onTriggerLogin={() => {
          setPendingSubscriptionAfterLogin(false);
          setIsLoginModalOpen(true);
        }}
      />
    </main>
  );
}