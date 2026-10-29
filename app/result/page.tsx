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
  RefreshCw,
  AlertCircle,
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
  RawUserBiometricInput,
  AiGeneratedProgram,
} from '@/components/AiConsultationWidget';

type WorkspaceTab = 'overview' | 'meal' | 'workout' | 'chat';

const GOAL_LABELS: Record<RawUserBiometricInput['goal'], string> = {
  fat_loss: 'Turun Lemak (Defisit Aman)',
  maintenance: 'Jaga Komposisi & Bugar',
  muscle_gain: 'Naik Massa Otot (Lean Bulk)',
};

export default function ResultPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userInput, setUserInput] = useState<RawUserBiometricInput | null>(
    null
  );
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
  const [aiError, setAiError] = useState<string | null>(null);

  // Ambil Nama Pertama dari Akun Google Asli untuk Judul & Sapaan AI
  const googleFirstName = useMemo(() => {
    const rawGoogleName = authUser?.name?.trim();
    if (rawGoogleName) {
      return rawGoogleName.split(/\s+/)[0];
    }
    const rawFormName = userInput?.name?.trim();
    if (
      rawFormName &&
      !rawFormName.toLowerCase().includes('jack') &&
      !rawFormName.toLowerCase().includes('dummy')
    ) {
      return rawFormName.split(/\s+/)[0];
    }
    return 'PERSONAL';
  }, [authUser, userInput?.name]);

  // Input yang dikirim ke AI dengan nama pertama yang sudah bersih
  const effectiveInput: RawUserBiometricInput | null = useMemo(() => {
    if (!userInput) return null;
    return {
      ...userInput,
      name: googleFirstName,
    };
  }, [userInput, googleFirstName]);

  const syncAuthSessionOnly = useCallback(() => {
    const session = AuthTierController.getSession();
    setTier(session.tier);
    setAuthUser(session.user);
    if (session.user && AccessPolicy.canRecordHistory(session.tier)) {
      setHistoryRecords(HistoryRepository.getRecords(session.user.email));
    } else {
      setHistoryRecords([]);
    }
  }, []);

  // Fungsi memanggil AI untuk menghitung seluruh biometrik, rumus, menu & latihan
  const runAiFullAnalysis = useCallback(
    async (
      inputPayload: RawUserBiometricInput,
      prefOverride?: string,
      forceRefresh = false
    ) => {
      const activePref = (prefOverride ?? customPreference).trim();
      const cacheKey = `nutrifit_ai_calc_${JSON.stringify({
        ...inputPayload,
        pref: activePref,
      })}`;

      if (!forceRefresh && typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached) as AiGeneratedProgram;
            if (parsedCache?.biometrics && parsedCache?.weeklyMeals) {
              setAiProgram(parsedCache);
              setAiError(null);
              return;
            }
          } catch {
            // Lanjut panggil API jika cache rusak
          }
        }
      }

      setIsGeneratingAi(true);
      setAiError(null);

      try {
        const res = await fetch('/api/ai/nutrifit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'generate_plan',
            rawInput: inputPayload,
            customPreference: activePref,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.biometrics) {
          throw new Error(
            data?.error || 'Gagal menjalankan perhitungan analisis AI.'
          );
        }

        const programData = data as AiGeneratedProgram;
        setAiProgram(programData);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(programData));
        }

        const session = AuthTierController.getSession();
        if (session.user && AccessPolicy.canRecordHistory(session.tier)) {
          const updated = HistoryRepository.saveRecord(
            session.tier,
            session.user.email,
            {
              input: inputPayload,
              summary: {
                idealWeightMinKg: programData.biometrics.idealWeightMinKg,
                idealWeightMaxKg: programData.biometrics.idealWeightMaxKg,
                targetCalories: programData.biometrics.targetCalories,
                proteinGrams: programData.biometrics.proteinGrams,
                bmi: programData.biometrics.bmi,
                bodyFat: programData.biometrics.bodyFatPercentage,
              },
            }
          );
          setHistoryRecords(updated);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat menghubungi server AI.';
        setAiError(msg);
      } finally {
        setIsGeneratingAi(false);
      }
    },
    [customPreference]
  );

  // Muat input asli pengguna dari localStorage saat halaman dibuka
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedV1 = localStorage.getItem('nutrifit_assessment_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        if (parsed?.input) {
          setUserInput(parsed.input as RawUserBiometricInput);
        }
      } else {
        const savedRaw = localStorage.getItem('nutrifit_user_input');
        if (savedRaw) {
          setUserInput(JSON.parse(savedRaw) as RawUserBiometricInput);
        }
      }
    } catch {
      setUserInput(null);
    }

    syncAuthSessionOnly();
    return AuthTierController.subscribe(syncAuthSessionOnly);
  }, [syncAuthSessionOnly]);

  // Jalankan perhitungan AI begitu effectiveInput tersedia
  useEffect(() => {
    if (isMounted && effectiveInput) {
      runAiFullAnalysis(effectiveInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, effectiveInput]);

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

  const handleGoogleLoginSuccess = (
    name: string,
    email: string,
    picture?: string
  ) => {
    const result = AuthTierController.loginWithGoogle(name, email, picture);
    setIsLoginModalOpen(false);
    syncAuthSessionOnly();

    if (pendingSubscriptionAfterLogin) {
      setPendingSubscriptionAfterLogin(false);
      if (result.tier !== 'premium') {
        setIsPaymentModalOpen(true);
      }
    }
  };

  const handleConfirmPayment = (paymentMethod: string, durationDays?: number) => {
    AuthTierController.activatePremiumSubscription(paymentMethod, durationDays);
    setIsPaymentModalOpen(false);
    syncAuthSessionOnly();
  };

  const isFullAccess = AccessPolicy.canViewFullResult(tier);
  const bio = aiProgram?.biometrics;
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

  // Jika pengguna belum mengisi form di /input sama sekali
  if (!effectiveInput) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EEF5FC] p-6 text-[#0B2545]">
        <div className="max-w-md rounded-[2rem] border border-white bg-white p-8 text-center shadow-xl">
          <Scale className="mx-auto h-12 w-12 text-[#0B4B84]" />
          <h1 className="mt-4 text-2xl font-extrabold">
            Data Biometrik Belum Diisi
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#1E293B]">
            Sistem ini tidak menggunakan data dummy. Silakan masukkan ukuran
            antropometri tubuh Anda terlebih dahulu agar AI dapat menghitung
            hasil analisis secara akurat.
          </p>
          <Link
            href="/input"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#05203C] px-6 py-3 text-xs font-extrabold text-[#38D46A]"
          >
            Isi Data Biometrik Sekarang
          </Link>
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
                <span>Ubah Data Biometrik</span>
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
                  <span>Cetak Laporan PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTriggerSubscribeFlow}
                  className="inline-flex items-center gap-2 rounded-full bg-[#05203C] px-4 py-2 text-xs font-extrabold text-[#38D46A] shadow-sm transition hover:bg-[#0B2545] sm:text-sm"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Buka Program AI & Cetak PDF</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B4B84] uppercase shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#38D46A]" />
                <span>
                  {isFullAccess
                    ? 'NutriFit AI Clinical & Personal Coach Workspace'
                    : 'Hasil Komputasi AI (Berat Ideal, Kalori & Protein)'}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl lg:text-5xl">
                <span className="block">LAPORAN ANALISIS</span>
                <span className="mt-1 flex items-center gap-2">
                  <Image
                    src="/images/nuvica-inline-title.webp"
                    alt="Ikon NutriFit"
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
                {effectiveInput.gender === 'male' ? 'Pria' : 'Wanita'},{' '}
                {effectiveInput.age} thn
              </span>
              <span className="rounded-xl bg-[#EEF5FC] px-3 py-1.5 text-xs font-extrabold text-[#0B2545]">
                {effectiveInput.heightCm} cm • {effectiveInput.weightKg} kg
              </span>
              <span className="rounded-xl bg-[#05203C] px-3 py-1.5 text-xs font-extrabold text-[#38D46A]">
                {GOAL_LABELS[effectiveInput.goal]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATUS LOADING / ERROR KOMPUTASI AI */}
      {isGeneratingAi && !bio ? (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[#0B4B84]" />
            <h2 className="mt-4 text-xl font-extrabold text-[#0B2545]">
              Gemini AI Sedang Menghitung Rumus Biometrik & Menyusun Kurikulum 7
              Hari...
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-[#1E293B]">
              Seluruh parameter (BMI Asia-Pasifik, % Lemak US Navy, BMR
              Mifflin-St Jeor, TDEE, Makronutrien, hingga Menu & Latihan) sedang
              dikalkulasi secara langsung oleh AI dari data ukuran tubuh Anda.
            </p>
          </div>
        </section>
      ) : null}

      {aiError ? (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
              <div>
                <h3 className="text-sm font-extrabold text-rose-900">
                  Komputasi AI Gagal Dijalankan
                </h3>
                <p className="mt-1 text-xs font-medium text-rose-700">
                  {aiError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => runAiFullAnalysis(effectiveInput, undefined, true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-700 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-rose-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Coba Hitung Ulang dengan AI</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* TAMPILKAN HASIL JIKA AI SUDAH SELESAI MENGHITUNG */}
      {bio && aiProgram ? (
        <>
          {/* 2 KARTU UTAMA GRATIS (DIHITUNG MURNI OLEH AI) */}
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
                    Komputasi AI 01 • Akses Terbuka
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] shadow-md">
                    <Scale className="h-5 w-5 stroke-[2.3]" />
                  </span>
                </div>

                <div className="relative z-10 mt-8">
                  <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                    Rentang Berat Badan Ideal (Tinggi {effectiveInput.heightCm}{' '}
                    cm)
                  </span>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                      {bio.idealWeightMinKg} – {bio.idealWeightMaxKg} kg
                    </h2>
                    <span className="rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-extrabold text-[#0B4B84]">
                      Titik Ideal AI: {bio.idealWeightMidKg} kg
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-[#1E293B] sm:text-sm">
                    {bio.weightAdvice}
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
                    Komputasi AI 02 • Akses Terbuka
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0B2545] shadow-md">
                    <Flame className="h-5 w-5 stroke-[2.3]" />
                  </span>
                </div>

                <div className="relative z-10 mt-8">
                  <span className="text-xs font-extrabold tracking-wider text-[#38D46A] uppercase">
                    Kebutuhan Energi & Protein Harian (Hasil AI)
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                      <span className="text-[11px] font-bold text-[#E0F2FE]">
                        Asupan Kalori Harian
                      </span>
                      <div className="mt-0.5 text-2xl font-extrabold text-white sm:text-3xl">
                        {bio.targetCalories.toLocaleString('id-ID')}{' '}
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
                        {bio.proteinGrams}{' '}
                        <small className="text-xs font-bold text-[#38D46A]">
                          gram
                        </small>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs font-medium text-[#E0F2FE]">
                    Dihitung oleh AI untuk tujuan{' '}
                    <strong>{GOAL_LABELS[effectiveInput.goal]}</strong> dengan
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
                    <span>
                      {tier === 'guest'
                        ? 'Status: Pengunjung (Guest) • Fitur AI Lengkap Terkunci'
                        : 'Status: Pengguna Biasa (Free Registered) • Fitur AI Lengkap Terkunci'}
                    </span>
                  </span>

                  <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Buka Rincian Rumus AI, Kurikulum 7 Hari & Chatbot NutriCoach
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#E0F2FE] sm:text-sm">
                    {tier === 'guest'
                      ? 'Sebagai Pengunjung (Guest), Anda hanya melihat Berat Ideal serta Kalori & Protein. Login Google terlebih dahulu, lalu aktifkan langganan QRIS (mulai Rp5.900/minggu bebas biaya admin).'
                      : `Halo ${authUser?.name}, riwayat Anda sudah tercatat di akun (${authUser?.email}). Aktifkan paket Mingguan (Rp5.900) atau Bulanan (Rp16.900) via QRIS untuk membuka seluruh fitur AI di bawah ini.`}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleTriggerSubscribeFlow}
                      className="inline-flex items-center gap-2 rounded-full bg-[#38D46A] px-7 py-3.5 text-xs font-extrabold text-[#0B2545] shadow-lg transition hover:brightness-95 sm:text-sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {tier === 'guest'
                          ? 'Login Google & Berlangganan (Mulai Rp5.900)'
                          : 'Pilih Paket QRIS (Mingguan Rp5.900 / Bulanan Rp16.900)'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="mx-auto mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
              <AiPlanCustomizerBar
                customPreference={customPreference}
                onChangePreference={setCustomPreference}
                onRegeneratePlan={(prefOverride) =>
                  runAiFullAnalysis(effectiveInput, prefOverride, true)
                }
                isGenerating={isGeneratingAi}
                aiSummaryNote={aiProgram.aiSummaryNote}
                generatedAt={aiProgram.generatedAt}
                formulaBreakdown={aiProgram.formulaBreakdown}
                userName={googleFirstName}
              />

              <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white bg-white p-3 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        id: 'overview',
                        label: '1. Analisis Biometrik AI',
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
                    const tabBtnClass = active
                      ? 'inline-flex items-center gap-2 rounded-full bg-[#05203C] px-4 py-2.5 text-xs font-extrabold text-[#38D46A] shadow-sm transition'
                      : 'inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-4 py-2.5 text-xs font-extrabold text-[#0B2545] transition hover:bg-[#DCEBF8]';

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={tabBtnClass}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === 'overview' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                          Komputasi AI • WHO Asia-Pasifik
                        </span>
                        <Scale className="h-5 w-5 text-[#0B4B84]" />
                      </div>
                      <div className="mt-6">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Indeks Massa Tubuh (BMI)
                        </span>
                        <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                          {bio.bmi} <small className="text-xs">kg/m²</small>
                        </div>
                        <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                          Status: {bio.bmiCategory}
                        </p>
                      </div>
                    </article>

                    <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                          Komputasi AI • US Navy & WHR
                        </span>
                        <HeartPulse className="h-5 w-5 text-[#0B4B84]" />
                      </div>
                      <div className="mt-6">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Komposisi Lemak Tubuh
                        </span>
                        <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                          {bio.bodyFatPercentage}%{' '}
                          <small className="text-xs font-bold text-[#0B4B84]">
                            ({bio.fatMassKg} kg)
                          </small>
                        </div>
                        <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                          WHR {bio.whr} • {bio.whrStatus}
                        </p>
                      </div>
                    </article>

                    <article className="flex flex-col justify-between rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#0B2545] px-3 py-1 text-[11px] font-extrabold text-white">
                          Komputasi AI • Mifflin-St Jeor
                        </span>
                        <ShieldCheck className="h-5 w-5 text-[#0B4B84]" />
                      </div>
                      <div className="mt-6">
                        <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                          Total Energi Harian (TDEE)
                        </span>
                        <div className="mt-1 text-3xl font-extrabold text-[#0B2545]">
                          {bio.tdee.toLocaleString('id-ID')}{' '}
                          <small className="text-xs">kkal/hari</small>
                        </div>
                        <p className="mt-1 text-xs font-extrabold text-[#0B4B84]">
                          Batas BMR Organ Vital:{' '}
                          {bio.bmr.toLocaleString('id-ID')} kkal
                        </p>
                      </div>
                    </article>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                            Distribusi Jaringan & Makronutrien AI
                          </span>
                          <h2 className="text-xl font-extrabold text-[#0B2545]">
                            Peta Massa Otot vs Lemak & Target Makro
                          </h2>
                        </div>
                        <span className="rounded-full bg-[#EEF5FC] px-3.5 py-1 text-xs font-extrabold text-[#0B4B84]">
                          Pinggang {effectiveInput.waistCm} cm
                        </span>
                      </div>

                      <div className="mt-6 space-y-5">
                        <div>
                          <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2545]">
                            <span>Massa Bebas Lemak (Otot) vs Massa Lemak</span>
                            <span>
                              {+(100 - bio.bodyFatPercentage).toFixed(1)}% Otot
                              • {bio.bodyFatPercentage}% Lemak
                            </span>
                          </div>
                          <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full bg-[#EEF5FC]">
                            <div
                              style={{
                                width: `${Math.min(
                                  100 - bio.bodyFatPercentage,
                                  92
                                )}%`,
                              }}
                              className="bg-[#0B4B84]"
                            />
                            <div
                              style={{
                                width: `${Math.max(bio.bodyFatPercentage, 8)}%`,
                              }}
                              className="bg-[#38D46A]"
                            />
                          </div>
                          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-[#1E293B]">
                            <span>
                              Massa Bebas Lemak:{' '}
                              <strong>{bio.leanMassKg} kg</strong>
                            </span>
                            <span>
                              Massa Lemak: <strong>{bio.fatMassKg} kg</strong>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                            <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                              Protein Harian
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                              {bio.proteinGrams} gram
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                              {(bio.proteinGrams * 4).toLocaleString('id-ID')}{' '}
                              kkal
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                            <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                              Karbohidrat
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                              {bio.carbGrams} gram
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                              {(bio.carbGrams * 4).toLocaleString('id-ID')} kkal
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-[#EEF5FC]/70 p-4">
                            <span className="text-xs font-extrabold text-[#0B4B84] uppercase">
                              Lemak Sehat
                            </span>
                            <div className="mt-1 text-2xl font-extrabold text-[#0B2545]">
                              {bio.fatGrams} gram
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-[#1E293B]">
                              {(bio.fatGrams * 9).toLocaleString('id-ID')} kkal
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
                            Target Hidrasi AI
                          </span>
                          <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                            {bio.waterLiters} Liter/hari
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#1E293B]">
                            Setara ±{Math.round((bio.waterLiters * 1000) / 250)}{' '}
                            gelas air.
                          </p>
                        </div>

                        <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                            <Moon className="h-5 w-5" />
                          </div>
                          <span className="mt-3 block text-xs font-extrabold text-[#0B4B84] uppercase">
                            Evaluasi Tidur AI
                          </span>
                          <div className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                            {effectiveInput.sleepHours} Jam/malam
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#1E293B]">
                            {bio.sleepAssessment}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-[#1E4E79]/40 bg-[#05203C] p-6 text-white shadow-md">
                        <div className="flex items-start gap-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                            {bio.bmrGuardTriggered ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5" />
                            )}
                          </span>
                          <div>
                            <span className="text-xs font-extrabold tracking-wider text-[#38D46A] uppercase">
                              Verifikasi BMR Guard oleh AI
                            </span>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#E0F2FE]">
                              {bio.bmrGuardExplanation}
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
                        Disusun Murni oleh AI • Anggaran:{' '}
                        {effectiveInput.budgetTier.toUpperCase()}
                      </span>
                      <h2 className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                        Rencana Menu Pangan Lokal 7 Hari (
                        {activeMealDay?.costEstimate}/hari)
                      </h2>
                      {activeMealDay?.dailyTip ? (
                        <p className="mt-1 text-xs font-semibold text-[#0B4B84]">
                          Catatan AI Hari {activeMealDay.day}:{' '}
                          {activeMealDay.dailyTip}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {weeklyMeals.map((item, idx) => {
                        const dayBtnClass =
                          idx === selectedDayIdx
                            ? 'rounded-full bg-[#05203C] px-4 py-2 text-xs font-extrabold text-[#38D46A] shadow-sm transition'
                            : 'rounded-full bg-[#EEF5FC] px-4 py-2 text-xs font-extrabold text-[#0B2545] transition hover:bg-[#DCEBF8]';

                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => setSelectedDayIdx(idx)}
                            className={dayBtnClass}
                          >
                            {item.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {activeMealDay?.meals.map((meal, index) => {
                      const isHighlight = index === 1;
                      const cardClass = isHighlight
                        ? 'flex flex-col justify-between rounded-[1.5rem] border border-[#1E4E79] bg-[#05203C] p-5 text-white shadow-md transition'
                        : 'flex flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-[#EEF5FC]/70 p-5 text-[#0B2545] transition';
                      const timeLabelClass = isHighlight
                        ? 'text-xs font-extrabold text-[#38D46A]'
                        : 'text-xs font-extrabold text-[#0B4B84]';
                      const kcalBadgeClass = isHighlight
                        ? 'rounded-full bg-[#38D46A] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B2545]'
                        : 'rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B4B84]';
                      const protBadgeClass = isHighlight
                        ? 'rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-white'
                        : 'rounded-full bg-[#0B2545] px-2 py-0.5 text-[10px] font-extrabold text-white';
                      const descClass = isHighlight
                        ? 'mt-4 border-t border-white/15 pt-3 text-xs leading-relaxed text-[#E0F2FE]'
                        : 'mt-4 border-t border-slate-200/80 pt-3 text-xs leading-relaxed text-[#1E293B]';

                      return (
                        <div key={meal.time} className={cardClass}>
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={timeLabelClass}>
                                {meal.time}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className={kcalBadgeClass}>
                                  ±{meal.kcalShare} kkal
                                </span>
                                <span className={protBadgeClass}>
                                  {meal.proteinGrams}g P
                                </span>
                              </div>
                            </div>
                            <h3 className="mt-3 text-base font-extrabold leading-snug">
                              {meal.title}
                            </h3>
                          </div>

                          <p className={descClass}>{meal.portionDesc}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === 'workout' ? (
                <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <span className="text-xs font-extrabold tracking-wider text-[#0B4B84] uppercase">
                        Disusun Murni oleh AI
                      </span>
                      <h2 className="mt-0.5 text-2xl font-extrabold text-[#0B2545]">
                        Jadwal Latihan & Pemulihan 7 Hari
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-4 py-2 text-xs font-extrabold text-[#0B4B84]">
                      <Calendar className="h-4 w-4" />
                      <span>Tujuan: {GOAL_LABELS[effectiveInput.goal]}</span>
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {weeklyWorkouts.map((w) => {
                      const workoutCardClass = w.isRest
                        ? 'flex flex-col justify-between rounded-[1.5rem] border border-slate-200/80 bg-white p-5'
                        : 'flex flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-[#EEF5FC]/85 p-5';

                      return (
                        <div key={w.day} className={workoutCardClass}>
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
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <div className={activeTab === 'chat' ? 'block' : 'pt-4'}>
                <AiChatbotPanel
                  rawInput={effectiveInput}
                  computedBiometrics={bio}
                />
              </div>
            </div>
          )}
        </>
      ) : null}

      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        pendingSubscriptionIntent={pendingSubscriptionAfterLogin}
        defaultName={effectiveInput.name}
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
        onSelectRecord={(rec) =>
          setUserInput(rec.input as RawUserBiometricInput)
        }
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