'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Flame,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Droplets,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Scale,
  HeartPulse,
  Lock,
  MessageSquare,
  Utensils,
  Activity,
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
import {
  AiPlanCustomizerBar,
  AiChatbotPanel,
  BiometricAiPayload,
  AiGeneratedProgram,
} from '@/components/AiConsultationWidget';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
type FitnessGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';
type WorkspaceTab = 'overview' | 'meal' | 'workout' | 'chat';

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
  budgetTier: 'hemat' | 'seimbang' | 'fleksibel';
  sleepHours: number;
}

interface BiometricMetrics {
  bmi: number;
  bmiCategory: string;
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

const ACTIVITY_MULTIPLIERS: Record<
  ActivityLevel,
  { label: string; factor: number }
> = {
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
  if (bmi < 18.5) {
    bmiCategory = 'Berat Kurang (Underweight)';
  } else if (bmi >= 23 && bmi <= 24.9) {
    bmiCategory = 'Berisiko Lebih (Overweight Asia)';
  } else if (bmi >= 25) {
    bmiCategory = 'Obesitas (Asia-Pasifik)';
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

export default function ResultPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userInput, setUserInput] = useState<UserInput>(DEFAULT_INPUT);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  const [tier, setTier] = useState<UserTier>('guest');
  const [authUser, setAuthUser] = useState<GoogleAccountProfile | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingSubscriptionAfterLogin, setPendingSubscriptionAfterLogin] =
    useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [customPreference, setCustomPreference] = useState('');
  const [aiProgram, setAiProgram] = useState<AiGeneratedProgram | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const metrics = useMemo(() => calculateMetrics(userInput), [userInput]);

  const googleFirstName = useMemo(() => {
    const rawGoogleName = authUser?.name?.trim();
    if (rawGoogleName) {
      return rawGoogleName.split(/\s+/)[0];
    }

    const rawFormName = userInput.name?.trim();
    if (
      rawFormName &&
      !rawFormName.toLowerCase().includes('jack') &&
      !rawFormName.toLowerCase().includes('dummy')
    ) {
      return rawFormName.split(/\s+/)[0];
    }

    return 'PERSONAL';
  }, [authUser, userInput.name]);

  const composition = useMemo(() => {
    const heightM = userInput.heightCm / 100;
    const minIdealKg = +(18.5 * heightM * heightM).toFixed(1);
    const maxIdealKg = +(22.9 * heightM * heightM).toFixed(1);
    const midIdealKg = +((minIdealKg + maxIdealKg) / 2).toFixed(1);
    const weightDiffKg = +(userInput.weightKg - midIdealKg).toFixed(1);

    const fatMassKg = +((userInput.weightKg * metrics.bodyFat) / 100).toFixed(
      1
    );
    const leanMassKg = +(userInput.weightKg - fatMassKg).toFixed(1);
    const waterLiters = +(userInput.weightKg * 0.035).toFixed(1);

    return {
      minIdealKg,
      maxIdealKg,
      midIdealKg,
      weightDiffKg,
      fatMassKg,
      leanMassKg,
      waterLiters,
    };
  }, [userInput, metrics]);

  const biometricAiPayload: BiometricAiPayload = useMemo(
    () => ({
      ...userInput,
      name: googleFirstName,
      bmi: metrics.bmi,
      bodyFat: metrics.bodyFat,
      whr: metrics.whr,
      bmr: metrics.bmr,
      tdee: metrics.tdee,
      targetCalories: metrics.targetCalories,
      proteinGrams: metrics.proteinGrams,
      carbGrams: metrics.carbGrams,
      fatGrams: metrics.fatGrams,
    }),
    [userInput, metrics]
  );

  const fetchAiProgram = useCallback(
    async (payload: BiometricAiPayload, prefOverride?: string) => {
      setIsGeneratingAi(true);
      try {
        const res = await fetch('/api/ai/nutrifit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'generate_plan',
            biometricContext: payload,
            customPreference: prefOverride ?? customPreference,
          }),
        });
        const data = (await res.json()) as AiGeneratedProgram;
        if (data?.weeklyMeals) {
          setAiProgram(data);
        }
      } catch (err) {
        console.error('Gagal mengambil program AI:', err);
      } finally {
        setIsGeneratingAi(false);
      }
    },
    [customPreference]
  );

  const syncHistoryAndSession = useCallback((currentInput: UserInput) => {
    const session = AuthTierController.getSession();
    setTier(session.tier);
    setAuthUser(session.user);

    if (session.user && AccessPolicy.canRecordHistory(session.tier)) {
      const calc = calculateMetrics(currentInput);
      const hM = currentInput.heightCm / 100;
      const updatedRecords = HistoryRepository.saveRecord(
        session.tier,
        session.user.email,
        {
          input: currentInput,
          summary: {
            idealWeightMinKg: +(18.5 * hM * hM).toFixed(1),
            idealWeightMaxKg: +(22.9 * hM * hM).toFixed(1),
            targetCalories: calc.targetCalories,
            proteinGrams: calc.proteinGrams,
            bmi: calc.bmi,
            bodyFat: calc.bodyFat,
          },
        }
      );
      setHistoryRecords(updatedRecords);
    } else {
      setHistoryRecords([]);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    let loadedInput = DEFAULT_INPUT;
    try {
      const savedV1 = localStorage.getItem('nutrifit_assessment_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        if (parsed?.input) {
          loadedInput = { ...DEFAULT_INPUT, ...parsed.input };
        }
      } else {
        const savedRaw = localStorage.getItem('nutrifit_user_input');
        if (savedRaw) {
          loadedInput = { ...DEFAULT_INPUT, ...JSON.parse(savedRaw) };
        }
      }
    } catch {
      // Gunakan DEFAULT_INPUT
    }
    setUserInput(loadedInput);
    syncHistoryAndSession(loadedInput);

    return AuthTierController.subscribe(() => {
      syncHistoryAndSession(loadedInput);
    });
  }, [syncHistoryAndSession]);

  const isFullAccess = AccessPolicy.canViewFullResult(tier);

  useEffect(() => {
    if (isMounted && isFullAccess) {
      fetchAiProgram(biometricAiPayload);
    }
  }, [isMounted, isFullAccess, biometricAiPayload, fetchAiProgram]);

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
    setIsLoginModalOpen(false);
    syncHistoryAndSession(userInput);

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
    syncHistoryAndSession(userInput);
  };

  const weeklyMeals = aiProgram?.weeklyMeals || [];
  const weeklyWorkouts = aiProgram?.weeklyWorkouts || [];
  const activeMealDay = weeklyMeals[selectedDayIdx] ?? weeklyMeals[0];

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#EEF5FC] pb-20 text-[#0B2545]">
        <div className="mx-auto max-w-7xl animate-pulse px-4 pt-12 sm:px-6 lg:px-8">
          <div className="h-12 w-full rounded-full bg-white/80" />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-64 rounded-[2rem] bg-white/80" />
            <div className="h-64 rounded-[2rem] bg-white/80" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEF5FC] pb-28 text-[#0B2545]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#A8CDF0] via-[#CFE4F9] to-[#EEF5FC] pt-6 pb-12">
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

          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/input"
                className="group inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white sm:text-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84] transition group-hover:bg-[#38D46A] group-hover:text-[#0B2545]">
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.4]" />
                </span>
                Ubah Data Biometrik
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-bold text-[#1E293B] transition hover:bg-white sm:text-sm"
              >
                Beranda Utama
              </Link>
            </div>

            <div className="flex items-center gap-2.5">
              {isFullAccess ? (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm transition hover:bg-white sm:text-sm"
                >
                  <Printer className="h-4 w-4 text-[#0B4B84]" />
                  Cetak Laporan PDF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTriggerSubscribeFlow}
                  className="inline-flex items-center gap-2 rounded-full bg-[#05203C] px-4 py-2 text-xs font-extrabold text-[#38D46A] shadow-sm transition hover:bg-[#0B2545] sm:text-sm"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Buka Program AI & Cetak PDF
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#38D46A]" />
                {isFullAccess
                  ? 'NutriFit AI Clinical & Personal Coach Workspace'
                  : 'Ringkasan Dasar Gratis (Berat Ideal, Kalori & Protein)'}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl lg:text-5xl">
                <span className="block">LAPORAN ANALISIS</span>
                <span className="mt-1 flex items-center gap-2">
                  <Image
                    src="/images/nuvica-inline-title.webp"
                    alt=""
                    width={52}
                    height={52}
                    className="h-11 w-11 bg-transparent object-contain mix-blend-multiply [mask-image:radial-gradient(circle,black_60%,transparent_78%)] sm:h-13 sm:w-13"
                  />
                  <span className="text-[#0B4B84] uppercase">
                    {googleFirstName}
                  </span>
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-white bg-white/85 p-3.5 shadow-sm backdrop-blur-md">
              <span className="rounded-xl bg-[#EEF5FC] px-3 py-1.5 text-xs font-extrabold text-[#0B2545]">
                {userInput.gender === 'male' ? 'Pria' : 'Wanita'},{' '}
                {userInput.age} thn
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

      {/* 2 KARTU UTAMA GRATIS (TERBUKA UNTUK GUEST, FREE REGISTERED, & PREMIUM) */}
      <section className="mx-auto -mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-7 text-[#0B2545] shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/nuvica-service-body.webp"
                alt="Rentang Berat Badan Ideal"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-30 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/60" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#0B2545] px-3.5 py-1 text-xs font-extrabold text-white">
                Indikator Dasar 01 • Akses Terbuka
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                <Scale className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-8">
              <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                Rentang Berat Badan Ideal (Tinggi {userInput.heightCm} cm)
              </span>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                  {composition.minIdealKg} – {composition.maxIdealKg} kg
                </h2>
                <span className="rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-extrabold text-[#0B4B84]">
                  Titik Ideal: {composition.midIdealKg} kg
                </span>
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#1E293B] sm:text-sm">
                Berat Anda saat ini <strong>{userInput.weightKg} kg</strong>.{' '}
                {composition.weightDiffKg > 2
                  ? `Disarankan menurunkan sekitar ${composition.weightDiffKg} kg menuju titik ideal.`
                  : composition.weightDiffKg < -2
                  ? `Disarankan menaikkan sekitar ${Math.abs(
                      composition.weightDiffKg
                    )} kg menuju titik ideal.`
                  : 'Berat badan Anda sudah berada tepat di dalam rentang ideal!'}
              </p>
            </div>
          </article>

          <article className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[#1E4E79]/60 bg-[#05203C] p-7 text-white shadow-md">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/images/nuvica-service-report.webp"
                alt="Target Kalori dan Protein Harian"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-30 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041A33] via-[#041A33]/90 to-[#041A33]/55" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-[#38D46A] px-3.5 py-1 text-xs font-extrabold text-[#0B2545]">
                Indikator Dasar 02 • Akses Terbuka
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0B2545] shadow-md">
                <Flame className="h-5 w-5 stroke-[2.3]" />
              </span>
            </div>

            <div className="relative z-10 mt-8">
              <span className="text-xs font-extrabold tracking-wider text-[#38D46A] uppercase">
                Kebutuhan Energi & Protein Harian
              </span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-[#E0F2FE]">
                    Asupan Kalori Harian
                  </span>
                  <div className="mt-0.5 text-2xl font-extrabold text-white sm:text-3xl">
                    {metrics.targetCalories.toLocaleString('id-ID')}{' '}
                    <small className="text-xs font-bold text-[#38D46A]">
                      kkal
                    </small>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-bold text-[#E0F2FE]">
                    Target Protein Harian
                  </span>
                  <div className="mt-0.5 text-2xl font-extrabold text-white sm:text-3xl">
                    {metrics.proteinGrams}{' '}
                    <small className="text-xs font-bold text-[#38D46A]">
                      gram
                    </small>
                  </div>
                </div>
              </div>
              <p className="mt-2.5 text-xs font-medium text-[#E0F2FE]">
                Dihitung untuk tujuan{' '}
                <strong>{GOAL_META[userInput.goal]?.label}</strong> dengan
                proteksi batas aman BMR.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* PEMBATASAN AKSES (GUEST & FREE REGISTERED) VS WORKSPACE PREMIUM */}
      {!isFullAccess ? (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white bg-white p-6 shadow-lg sm:p-10">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#1E4E79]/30 bg-[#05203C] p-7 text-center text-white shadow-2xl sm:p-9">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#38D46A] px-3.5 py-1 text-xs font-extrabold text-[#0B2545]">
                <Lock className="h-3.5 w-3.5" />
                {tier === 'guest'
                  ? 'Status: Pengunjung (Guest) • Fitur AI & Laporan Lengkap Terkunci'
                  : 'Status: Pengguna Biasa (Free Registered) • Fitur AI & Laporan Lengkap Terkunci'}
              </span>

              <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Buka Program AI Dinamis, Chatbot NutriCoach & Analisis Lengkap
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[#E0F2FE] sm:text-sm">
                {tier === 'guest'
                  ? 'Sebagai Pengunjung (Guest), Anda hanya melihat Berat Ideal serta Kalori & Protein. Tekan tombol di bawah untuk Login Google terlebih dahulu, lalu aktifkan langganan QRIS (mulai Rp4.000/minggu bebas biaya admin).'
                  : `Halo ${authUser?.name}, riwayat Anda sudah tercatat di akun (${authUser?.email}). Aktifkan paket Mingguan (Rp4.000) atau Bulanan (Rp12.000) via QRIS untuk membuka seluruh fitur AI di bawah ini.`}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2.5 text-left text-xs font-semibold text-[#E0F2FE] sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38D46A]" />
                  Generator Menu Lokal & Jadwal Latihan 7 Hari Berbasis AI
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38D46A]" />
                  Chatbot Konsultasi Pribadi (NutriCoach AI 24/7)
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38D46A]" />
                  Detail BMI Asia-Pasifik, WHR, % Lemak US Navy & Peta Otot
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38D46A]" />
                  Kustomisasi Alergi Makanan & Ekspor Laporan PDF A4
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleTriggerSubscribeFlow}
                  className="inline-flex items-center gap-2 rounded-full bg-[#38D46A] px-7 py-3.5 text-xs font-extrabold text-[#0B2545] shadow-lg transition hover:brightness-95 sm:text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  {tier === 'guest'
                    ? 'Login Google & Berlangganan (Mulai Rp4.000)'
                    : 'Pilih Paket QRIS (Mingguan Rp4.000 / Bulanan Rp12.000)'}
                </button>

                {tier === 'guest' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSubscriptionAfterLogin(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-xs font-extrabold text-white transition hover:bg-white/20"
                  >
                    Hanya Login Google (Simpan Riwayat)
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* WORKSPACE PENGGUNA PREMIUM (4 TAB TERSTRUKTUR + AI) */
        <div className="mx-auto mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <AiPlanCustomizerBar
            customPreference={customPreference}
            onChangePreference={setCustomPreference}
            onRegeneratePlan={(prefOverride) =>
              fetchAiProgram(biometricAiPayload, prefOverride)
            }
            isGenerating={isGeneratingAi}
            aiSummaryNote={
              aiProgram?.aiSummaryNote ||
              'Menyusun analisis klinis dan rencana program 7 hari berbasis AI untuk profil biometrik Anda...'
            }
            generatedAt={aiProgram?.generatedAt}
          />

          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    id: 'overview',
                    label: '1. Analisis Biometrik Klinis',
                    icon: Activity,
                  },
                  {
                    id: 'meal',
                    label: '2. Menu AI 7 Hari',
                    icon: Utensils,
                  },
                  {
                    id: 'workout',
                    label: '3. Program Latihan AI',
                    icon: Dumbbell,
                  },
                  {
                    id: 'chat',
                    label: '4. Konsultasi NutriCoach AI',
                    icon: MessageSquare,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition ${
                      active
                        ? 'bg-[#05203C] text-[#38D46A] shadow-sm'
                        : 'bg-[#EEF5FC] text-[#0B2545] hover:bg-[#DCEBF8]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="hidden pr-3 text-xs font-bold text-[#0B4B84] xl:inline">
              Klik tab untuk berpindah modul atau gunakan tombol Chat AI di
              kanan bawah
            </span>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                      WHO Asia-Pasifik
                    </span>
                    <Scale className="h-5 w-5 text-[#0B4B84]" />
                  </div>
                  <div className="mt-6">
                    <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                      Indeks Massa Tubuh (BMI)
                    </span>
                    <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                      {metrics.bmi} <small className="text-xs">kg/m²</small>
                    </div>
                    <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                      Status: {metrics.bmiCategory}
                    </p>
                  </div>
                </article>

                <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                      US Navy & WHR
                    </span>
                    <HeartPulse className="h-5 w-5 text-[#0B4B84]" />
                  </div>
                  <div className="mt-6">
                    <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                      Komposisi Lemak Tubuh
                    </span>
                    <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                      {metrics.bodyFat}%{' '}
                      <small className="text-xs font-bold text-[#0B4B84]">
                        ({composition.fatMassKg} kg)
                      </small>
                    </div>
                    <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                      WHR {metrics.whr} • {metrics.whrStatus}
                    </p>
                  </div>
                </article>

                <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                      Mifflin-St Jeor
                    </span>
                    <ShieldCheck className="h-5 w-5 text-[#0B4B84]" />
                  </div>
                  <div className="mt-6">
                    <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                      Total Energi Harian (TDEE)
                    </span>
                    <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                      {metrics.tdee.toLocaleString('id-ID')}{' '}
                      <small className="text-xs">kkal/hari</small>
                    </div>
                    <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                      Batas BMR Organ Vital:{' '}
                      {metrics.bmr.toLocaleString('id-ID')} kkal
                    </p>
                  </div>
                </article>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                        Distribusi Jaringan & Makronutrien
                      </span>
                      <h2 className="text-xl font-extrabold text-[#0B2545]">
                        Peta Massa Otot vs Lemak & Target Makro
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#EEF5FC] px-3.5 py-1 text-xs font-extrabold text-[#0B4B84]">
                      Pinggang {userInput.waistCm} cm
                    </span>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2545]">
                        <span>Massa Bebas Lemak (Otot) vs Massa Lemak</span>
                        <span>
                          {+(100 - metrics.bodyFat).toFixed(1)}% Otot •{' '}
                          {metrics.bodyFat}% Lemak
                        </span>
                      </div>
                      <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full bg-[#EEF5FC]">
                        <div
                          style={{
                            width: `${Math.min(100 - metrics.bodyFat, 92)}%`,
                          }}
                          className="bg-[#0B4B84]"
                        />
                        <div
                          style={{ width: `${Math.max(metrics.bodyFat, 8)}%` }}
                          className="bg-[#38D46A]"
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-[#1E293B]">
                        <span>
                          Massa Bebas Lemak:{' '}
                          <strong>{composition.leanMassKg} kg</strong>
                        </span>
                        <span>
                          Massa Lemak:{' '}
                          <strong>{composition.fatMassKg} kg</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Protein Harian
                        </span>
                        <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                          {metrics.proteinGrams} gram
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                          {(metrics.proteinGrams * 4).toLocaleString('id-ID')}{' '}
                          kkal (Pembangun otot)
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Karbohidrat
                        </span>
                        <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                          {metrics.carbGrams} gram
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                          {(metrics.carbGrams * 4).toLocaleString('id-ID')} kkal
                          (Energi utama)
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Lemak Sehat
                        </span>
                        <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                          {metrics.fatGrams} gram
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                          {(metrics.fatGrams * 9).toLocaleString('id-ID')} kkal
                          (Regulasi hormon)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                        <Droplets className="h-5 w-5" />
                      </div>
                      <span className="mt-3 block text-xs font-extrabold text-[#0B4B84] uppercase">
                        Target Hidrasi Air
                      </span>
                      <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                        {composition.waterLiters} Liter/hari
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#1E293B]">
                        Setara ±
                        {Math.round((composition.waterLiters * 1000) / 250)}{' '}
                        gelas belimbing.
                      </p>
                    </div>

                    <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                        <Moon className="h-5 w-5" />
                      </div>
                      <span className="mt-3 block text-xs font-extrabold text-[#0B4B84] uppercase">
                        Durasi Tidur Malam
                      </span>
                      <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                        {userInput.sleepHours} Jam/malam
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#1E293B]">
                        {userInput.sleepHours >= 7
                          ? 'Optimal menekan hormon lapar ghrelin.'
                          : 'Disarankan naik ke 7–8 jam/malam.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-[#1E4E79]/40 bg-[#05203C] p-6 text-white shadow-md">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                        {metrics.bmrGuardTriggered ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <span className="text-xs font-extrabold tracking-wider text-[#38D46A] uppercase">
                          Sistem Proteksi BMR Guard
                        </span>
                        <h3 className="mt-0.5 text-base font-extrabold text-white">
                          {metrics.bmrGuardTriggered
                            ? 'Proteksi Aktif: Kalori Dikunci di Batas BMR'
                            : 'Defisit Kalori Terverifikasi Aman di Atas BMR'}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#E0F2FE]">
                          BMR organ vital Anda adalah{' '}
                          <strong>
                            {metrics.bmr.toLocaleString('id-ID')} kkal
                          </strong>{' '}
                          dan target harian dijaga pada{' '}
                          <strong>
                            {metrics.targetCalories.toLocaleString('id-ID')}{' '}
                            kkal
                          </strong>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'meal' ? (
            <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center">
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Kurasi Nutrisi AI • Anggaran:{' '}
                    {userInput.budgetTier.toUpperCase()}
                  </span>
                  <h2 className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                    Rencana Menu Pangan Lokal 7 Hari (
                    {activeMealDay?.costEstimate || 'Rp35.000'}/hari)
                  </h2>
                  {activeMealDay?.dailyTip ? (
                    <p className="mt-1 text-xs font-semibold text-[#0B4B84]">
                      Tips AI Hari {activeMealDay.day}: {activeMealDay.dailyTip}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {weeklyMeals.map((item, idx) => (
                    <button
                      key={item.day}
                      type="button"
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                        idx === selectedDayIdx
                          ? 'bg-[#05203C] text-[#38D46A] shadow-sm'
                          : 'bg-[#EEF5FC] text-[#0B2545] hover:bg-[#DCEBF8]'
                      }`}
                    >
                      {item.day}
                    </button>
                  ))}
                </div>
              </div>

              {isGeneratingAi ? (
                <div className="grid grid-cols-1 gap-4 py-8 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-48 animate-pulse rounded-[1.5rem] bg-[#EEF5FC]"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {activeMealDay?.meals.map((meal, index) => (
                    <div
                      key={meal.time}
                      className={`flex flex-col justify-between rounded-[1.5rem] border p-5 transition ${
                        index === 1
                          ? 'border-[#1E4E79] bg-[#05203C] text-white shadow-md'
                          : 'border-slate-100 bg-[#EEF5FC]/70 text-[#0B2545]'
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
                          <div className="flex items-center gap-1">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                index === 1
                                  ? 'bg-[#38D46A] text-[#0B2545]'
                                  : 'bg-white text-[#0B4B84]'
                              }`}
                            >
                              ±{meal.kcalShare} kkal
                            </span>
                            {meal.proteinGrams ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                  index === 1
                                    ? 'bg-white/15 text-white'
                                    : 'bg-[#0B2545] text-white'
                                }`}
                              >
                                {meal.proteinGrams}g P
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <h3 className="mt-3 text-base font-extrabold leading-snug">
                          {meal.title}
                        </h3>
                      </div>

                      <p
                        className={`mt-4 border-t pt-3 text-xs leading-relaxed ${
                          index === 1
                            ? 'border-white/15 text-[#E0F2FE]'
                            : 'border-slate-200/80 text-[#1E293B]'
                        }`}
                      >
                        {meal.portionDesc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'workout' ? (
            <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Kurikulum Fisik Mingguan Berbasis AI
                  </span>
                  <h2 className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                    Jadwal Latihan & Pemulihan 7 Hari
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-4 py-2 text-xs font-extrabold text-[#0B4B84]">
                  <Calendar className="h-4 w-4" />
                  Disesuaikan Tujuan: {GOAL_META[userInput.goal]?.label}
                </span>
              </div>

              {isGeneratingAi ? (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-48 animate-pulse rounded-[1.5rem] bg-[#EEF5FC]"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {weeklyWorkouts.map((w) => (
                    <div
                      key={w.day}
                      className={`flex flex-col justify-between rounded-[1.5rem] border p-5 ${
                        w.isRest
                          ? 'border-slate-200/80 bg-white'
                          : 'border-slate-100 bg-[#EEF5FC]/85'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[#05203C] px-3 py-1 text-xs font-extrabold text-white">
                            {w.day}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B4B84]">
                              {w.intensity}
                            </span>
                            <span className="rounded-full bg-[#38D46A] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0B2545]">
                              {w.duration}
                            </span>
                          </div>
                        </div>

                        <h3 className="mt-3 text-base font-extrabold text-[#0B2545]">
                          {w.focus}
                        </h3>

                        <ul className="mt-3 space-y-2">
                          {w.exercises.map((ex, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs font-medium text-[#1E293B]"
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
              )}
            </section>
          ) : null}

          <div className={activeTab === 'chat' ? 'block' : 'pt-4'}>
            <AiChatbotPanel biometricContext={biometricAiPayload} />
          </div>
        </div>
      )}

      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        pendingSubscriptionIntent={pendingSubscriptionAfterLogin}
        defaultName={userInput.name}
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
        onSelectRecord={(rec) => setUserInput(rec.input as UserInput)}
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