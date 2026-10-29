'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  MessageSquare,
  X,
  CheckCircle2,
  SlidersHorizontal,
  Calculator,
  ChevronDown,
  ChevronUp,
  Table2,
  AlertCircle,
} from 'lucide-react';

export interface RawUserBiometricInput {
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'fat_loss' | 'maintenance' | 'muscle_gain';
  budgetTier: 'hemat' | 'seimbang' | 'fleksibel';
  sleepHours: number;
}

export interface AiComputedBiometrics {
  idealWeightMinKg: number;
  idealWeightMaxKg: number;
  idealWeightMidKg: number;
  weightDiffKg: number;
  weightAdvice: string;
  bmi: number;
  bmiCategory: string;
  bodyFatPercentage: number;
  fatMassKg: number;
  leanMassKg: number;
  whr: number;
  whrStatus: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  bmrGuardTriggered: boolean;
  bmrGuardExplanation: string;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  waterLiters: number;
  sleepAssessment: string;
}

export interface AiFormulaStep {
  parameter: string;
  formulaName: string;
  equation: string;
  substitution: string;
  result: string;
}

export interface AiMealItem {
  time: string;
  title: string;
  portionDesc: string;
  kcalShare: number;
  proteinGrams: number;
}

export interface AiDayMealPlan {
  day: string;
  costEstimate: string;
  dailyTip: string;
  meals: AiMealItem[];
}

export interface AiDayWorkout {
  day: string;
  focus: string;
  duration: string;
  intensity: string;
  isRest: boolean;
  exercises: string[];
}

export interface AiGeneratedProgram {
  aiSummaryNote: string;
  biometrics: AiComputedBiometrics;
  formulaBreakdown: AiFormulaStep[];
  weeklyMeals: AiDayMealPlan[];
  weeklyWorkouts: AiDayWorkout[];
  generatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Merender teks inline (**bold** dan `code`) serta membersihkan simbol LaTeX mentah
 */
function renderInlineFormatted(text: string): React.ReactNode[] {
  const cleanText = text
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\approx/g, '≈');

  const parts = cleanText.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-current">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded-md bg-[#0B4B84]/15 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-[#0B4B84]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Parser untuk merender Tabel Markdown, Blok Rumus, Heading, & Poin dari respon AI
 */
function FormattedAiResponse({
  content,
  isUser = false,
}: {
  content: string;
  isUser?: boolean;
}) {
  if (isUser) {
    return <div className="whitespace-pre-line">{content}</div>;
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. DETEKSI TABEL MARKDOWN (| Kolom 1 | Kolom 2 |)
    if (trimmed.includes('|') && trimmed.split('|').length >= 3) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().includes('|') &&
        lines[i].trim().split('|').length >= 3
      ) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const dataRows = tableLines
        .filter((row) => !/^\|?[\s\-:|]+\|[\s\-:|]*$/.test(row))
        .map((row) =>
          row
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim())
        );

      if (dataRows.length >= 1) {
        const headers = dataRows[0];
        const bodyRows = dataRows.slice(1);

        blocks.push(
          <div
            key={`table-${i}`}
            className="my-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-[#EEF5FC] px-3.5 py-2 text-[10px] font-extrabold tracking-wider text-[#0B4B84] uppercase">
              <Table2 className="h-3.5 w-3.5" />
              Tabel Hasil Analisis AI
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#05203C] text-white">
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="border-b border-white/10 px-3.5 py-2.5 font-extrabold whitespace-nowrap"
                      >
                        {renderInlineFormatted(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0
                          ? 'bg-white hover:bg-[#EEF5FC]/50'
                          : 'bg-[#EEF5FC]/35 hover:bg-[#EEF5FC]/70'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={
                            cIdx === 0
                              ? 'px-3.5 py-2.5 font-bold text-[#0B2545]'
                              : 'px-3.5 py-2.5 font-medium text-[#0B2545]'
                          }
                        >
                          {renderInlineFormatted(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }
    }

    // 2. DETEKSI BLOK RUMUS (> RUMUS: atau ```)
    if (
      trimmed.startsWith('>') ||
      /^(\*\*?)?(rumus|kalkulasi|perhitungan|formula)\b/i.test(trimmed) ||
      trimmed.startsWith('```')
    ) {
      let formulaText = trimmed;
      if (trimmed.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i].trim());
          i++;
        }
        i++;
        formulaText = codeLines.join('\n');
      } else {
        formulaText = trimmed
          .replace(/^>\s*/, '')
          .replace(
            /^(\*\*?)?(rumus|kalkulasi|perhitungan|formula)\s*:?\s*(\*\*?)?/i,
            ''
          );
        i++;
      }

      blocks.push(
        <div
          key={`formula-${i}`}
          className="my-3 rounded-2xl border border-[#1E4E79]/35 bg-[#05203C] p-3.5 text-white shadow-sm"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-[#38D46A] uppercase">
            <Calculator className="h-3.5 w-3.5" />
            Rumus & Kalkulasi AI
          </div>
          <div className="mt-1.5 font-mono text-xs leading-relaxed font-bold text-[#E0F2FE]">
            {renderInlineFormatted(formulaText)}
          </div>
        </div>
      );
      continue;
    }

    // 3. DETEKSI HEADING (### atau ##)
    if (trimmed.startsWith('#')) {
      const cleanHeading = trimmed.replace(/^#+\s*/, '');
      blocks.push(
        <h4
          key={`h-${i}`}
          className="mt-2.5 mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#0B2545]"
        >
          <span className="h-3.5 w-1 rounded-full bg-[#38D46A]" />
          <span>{renderInlineFormatted(cleanHeading)}</span>
        </h4>
      );
      i++;
      continue;
    }

    // 4. DETEKSI DAFTAR POIN (-, *, •, atau 1.)
    if (/^([-*•]|\d+\.)\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        /^([-*•]|\d+\.)\s+/.test(lines[i].trim())
      ) {
        listItems.push(lines[i].trim().replace(/^([-*•]|\d+\.)\s+/, ''));
        i++;
      }

      blocks.push(
        <ul key={`list-${i}`} className="my-2 space-y-1.5">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs leading-relaxed text-[#0B2545]"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B4B84]" />
              <span>{renderInlineFormatted(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. PARAGRAF BIASA
    blocks.push(
      <p
        key={`p-${i}`}
        className="my-1.5 text-xs leading-relaxed text-[#0B2545]"
      >
        {renderInlineFormatted(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{blocks}</div>;
}

interface AiPlanCustomizerBarProps {
  customPreference: string;
  onChangePreference: (val: string) => void;
  onRegeneratePlan: (prefOverride?: string) => void;
  isGenerating: boolean;
  aiSummaryNote: string;
  generatedAt?: string;
  formulaBreakdown?: AiFormulaStep[];
  userName?: string;
}

export function AiPlanCustomizerBar({
  customPreference,
  onChangePreference,
  onRegeneratePlan,
  isGenerating,
  aiSummaryNote,
  generatedAt,
  formulaBreakdown,
  userName,
}: AiPlanCustomizerBarProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const quickPresets = [
    'Tanpa Seafood / Udang',
    'Menu Anak Kos Praktis',
    'Tinggi Protein Tanpa Santan',
    'Latihan Kamar Tanpa Alat',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegeneratePlan();
  };

  const refreshIconClass = isGenerating ? 'h-4 w-4 animate-spin' : 'h-4 w-4';

  return (
    <div className="rounded-[2rem] border border-[#1E4E79]/40 bg-gradient-to-br from-[#05203C] via-[#082B52] to-[#05203C] p-6 text-white shadow-lg sm:p-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#38D46A]/20 px-3 py-1 text-[11px] font-extrabold text-[#38D46A]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Perhitungan Klinis & Program 100% oleh Gemini AI</span>
            {generatedAt ? (
              <span className="text-[#E0F2FE]/80">
                • Dihitung pukul {generatedAt}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            Ringkasan Analisis AI & Kustomisasi Program
          </h3>
          <p className="max-w-3xl text-xs leading-relaxed text-[#E0F2FE]">
            {aiSummaryNote}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formulaBreakdown && formulaBreakdown.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowFormulaModal((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-xs font-extrabold text-[#E0F2FE] transition hover:bg-white/20"
            >
              <Calculator className="h-4 w-4 text-[#38D46A]" />
              <span>
                {showFormulaModal
                  ? 'Tutup Rincian Rumus AI'
                  : 'Lihat Rincian Rumus AI'}
              </span>
              {showFormulaModal ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRegeneratePlan()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#38D46A] px-5 py-3 text-xs font-extrabold text-[#0B2545] shadow-md transition hover:brightness-95 disabled:opacity-60"
          >
            <RefreshCw className={refreshIconClass} />
            <span>
              {isGenerating
                ? 'AI Sedang Menghitung Ulang...'
                : 'Hitung & Susun Ulang via AI'}
            </span>
          </button>
        </div>
      </div>

      {/* TABEL RINCIAN RUMUS YANG DIHITUNG MURNI OLEH AI */}
      {showFormulaModal && formulaBreakdown && formulaBreakdown.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/20 bg-white p-5 text-[#0B2545] shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#0B4B84]" />
              <h4 className="text-sm font-extrabold text-[#0B2545]">
                Tabel Transparansi Rumus & Langkah Perhitungan AI (
                {userName || 'Personal'})
              </h4>
            </div>
            <span className="rounded-full bg-[#EEF5FC] px-3 py-0.5 text-[10px] font-extrabold text-[#0B4B84]">
              Dihitung Real-Time oleh Gemini AI
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#05203C] text-white">
                  <th className="px-3.5 py-2.5 font-extrabold">
                    Parameter Biometrik
                  </th>
                  <th className="px-3.5 py-2.5 font-extrabold">
                    Metode / Rumus
                  </th>
                  <th className="px-3.5 py-2.5 font-extrabold">
                    Persamaan Matematika
                  </th>
                  <th className="px-3.5 py-2.5 font-extrabold">
                    Substitusi Angka
                  </th>
                  <th className="px-3.5 py-2.5 font-extrabold">
                    Hasil Komputasi AI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formulaBreakdown.map((step, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EEF5FC]/45'}
                  >
                    <td className="px-3.5 py-2.5 font-extrabold text-[#0B2545]">
                      {step.parameter}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-[#1E293B]">
                      {step.formulaName}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#0B4B84]">
                      {step.equation}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-[#1E293B]">
                      {step.substitution}
                    </td>
                    <td className="px-3.5 py-2.5 font-extrabold text-emerald-700">
                      {step.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-5 border-t border-white/15 pt-4"
      >
        <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#38D46A]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>
            Instruksikan AI untuk Menyesuaikan Alergi, Bahan Makanan, atau
            Kondisi Latihan:
          </span>
        </label>

        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={customPreference}
            onChange={(e) => onChangePreference(e.target.value)}
            placeholder="Contoh: Saya alergi telur, ganti dengan ayam/ikan lokal & latihan tanpa lompat..."
            className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white placeholder:text-slate-300 focus:border-[#38D46A] focus:bg-white/15 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-[#0B2545] transition hover:bg-[#EEF5FC] disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0B4B84]" />
            <span>Hitung & Terapkan via AI</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#E0F2FE]/80">
            Instruksi Cepat ke AI:
          </span>
          {quickPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isGenerating}
              onClick={() => {
                onChangePreference(preset);
                onRegeneratePlan(preset);
              }}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-[#E0F2FE] transition hover:border-[#38D46A] hover:bg-white/20 disabled:opacity-50"
            >
              + {preset}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

interface AiChatbotPanelProps {
  rawInput: RawUserBiometricInput;
  computedBiometrics: AiComputedBiometrics;
}

export function AiChatbotPanel({
  rawInput,
  computedBiometrics,
}: AiChatbotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const quickQuestions = [
    'Buatkan tabel pengganti lauk lokal yang setara dengan target protein saya',
    'Jelaskan langkah rumus pembagian kalori & makronutrien harian saya',
    'Buatkan tabel jadwal latihan mingguan untuk membakar lemak perut',
    'Bagaimana strategi makan malam agar tetap defisit kalori tanpa lapar?',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendChatMessage = async (textToSend?: string) => {
    const cleanText = (textToSend ?? inputMsg).trim();
    if (!cleanText || isLoading) return;

    setChatError(null);
    const userEntry: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanText,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userEntry]);
    if (!textToSend) setInputMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/nutrifit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          rawInput,
          computedBiometrics,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: cleanText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(
          data.error || 'Gagal mendapatkan jawaban dari Gemini AI.'
        );
      }

      const assistantEntry: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantEntry]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan saat menghubungi Gemini AI.';
      setChatError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#05203C] px-6 py-5 text-white">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#38D46A] text-[#0B2545] shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-white sm:text-lg">
                  NutriCoach AI — Konsultan Gizi & Latihan Pribadi
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#38D46A]/20 px-2.5 py-0.5 text-[10px] font-extrabold text-[#38D46A]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>100% Live Gemini AI</span>
                </span>
              </div>
              <p className="text-xs text-[#E0F2FE]">
                Konteks AI: {computedBiometrics.targetCalories} kkal •{' '}
                {computedBiometrics.proteinGrams}g Protein • BMI{' '}
                {computedBiometrics.bmi}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-[#EEF5FC]/70 px-6 py-3">
          <span className="text-[11px] font-extrabold text-[#0B4B84] uppercase">
            Klik Pertanyaan Cepat untuk Meminta Perhitungan & Tabel ke AI:
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isLoading}
                onClick={() => sendChatMessage(q)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-left text-xs font-bold text-[#0B2545] shadow-sm transition hover:border-[#0B4B84] hover:bg-[#0B4B84] hover:text-white disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[520px] min-h-[320px] space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[#0B4B84]/30 bg-[#EEF5FC]/50 p-6 text-center">
              <Bot className="mx-auto h-8 w-8 text-[#0B4B84]" />
              <h4 className="mt-2 text-sm font-extrabold text-[#0B2545]">
                Mulai Konsultasi Langsung dengan NutriCoach AI
              </h4>
              <p className="mx-auto mt-1 max-w-lg text-xs text-[#1E293B]">
                Tidak ada pesan statis/dummy. Ketik pertanyaan Anda di bawah
                atau pilih tombol topik cepat di atas, dan AI akan menghitung
                serta menyusun tabel jawaban secara real-time untuk{' '}
                <strong>{rawInput.name}</strong>.
              </p>
            </div>
          ) : null}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const rowClass = isUser
              ? 'flex flex-row-reverse items-start gap-3'
              : 'flex flex-row items-start gap-3';
            const avatarClass = isUser
              ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B4B84] text-xs font-extrabold text-white'
              : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#05203C] text-xs font-extrabold text-[#38D46A]';
            const bubbleClass = isUser
              ? 'max-w-[88%] rounded-2xl rounded-tr-none bg-[#0B4B84] px-4 py-3.5 text-xs leading-relaxed font-semibold text-white sm:text-sm'
              : 'max-w-[88%] rounded-2xl rounded-tl-none border border-slate-200/80 bg-[#EEF5FC]/55 px-4 py-3.5 text-xs leading-relaxed font-medium text-[#0B2545] sm:text-sm';
            const timeClass = isUser
              ? 'mt-2 text-[10px] text-sky-200'
              : 'mt-2 text-[10px] text-slate-400';

            return (
              <div key={msg.id} className={rowClass}>
                <div className={avatarClass}>
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div className={bubbleClass}>
                  <FormattedAiResponse content={msg.content} isUser={isUser} />
                  <div className={timeClass}>{msg.timestamp}</div>
                </div>
              </div>
            );
          })}

          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#05203C] text-[#38D46A]">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl bg-[#EEF5FC] px-4 py-3 text-xs font-bold text-[#0B4B84]">
                NutriCoach AI sedang menghitung & menyusun tabel jawaban...
              </div>
            </div>
          ) : null}

          {chatError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{chatError}</span>
            </div>
          ) : null}

          <div ref={chatBottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage();
          }}
          className="flex items-center gap-2.5 border-t border-slate-100 bg-white p-4 sm:px-6"
        >
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Tanyakan pengganti makanan, rumus gizi, atau jadwal latihan ke AI..."
            className="flex-1 rounded-full border border-slate-200 bg-[#EEF5FC]/60 px-5 py-3 text-xs font-bold text-[#0B2545] focus:border-[#0B4B84] focus:bg-white focus:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMsg.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#05203C] text-[#38D46A] shadow-md transition hover:bg-[#0B2545] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* TOMBOL FLOATING CHATBOT DI POJOK KANAN BAWAH */}
      <div className="no-print fixed right-5 bottom-5 z-40">
        {isFloatingOpen ? (
          <div className="w-[350px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:w-[420px]">
            <div className="flex items-center justify-between bg-[#05203C] px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold">NutriCoach AI</div>
                  <div className="text-[10px] text-[#38D46A]">
                    100% Live Gemini AI
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFloatingOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-center text-xs text-slate-500">
                  Ketik pertanyaan di bawah untuk mulai berkonsultasi dengan AI.
                </p>
              ) : null}
              {messages.slice(-4).map((msg) => {
                const isUserMsg = msg.role === 'user';
                const floatBubbleClass = isUserMsg
                  ? 'ml-6 rounded-2xl bg-[#0B4B84] p-3 text-xs leading-relaxed font-semibold text-white'
                  : 'mr-2 rounded-2xl border border-slate-200/80 bg-[#EEF5FC]/60 p-3 text-xs leading-relaxed font-medium text-[#0B2545]';

                return (
                  <div key={`float-${msg.id}`} className={floatBubbleClass}>
                    <FormattedAiResponse
                      content={msg.content}
                      isUser={isUserMsg}
                    />
                  </div>
                );
              })}
              {isLoading ? (
                <div className="text-xs font-bold text-[#0B4B84]">
                  AI sedang menghitung & menyusun jawaban...
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
              className="flex items-center gap-2 border-t border-slate-100 p-3"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Tanya NutriCoach AI..."
                className="flex-1 rounded-full border border-slate-200 bg-[#EEF5FC]/60 px-3.5 py-2 text-xs font-bold text-[#0B2545] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMsg.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsFloatingOpen(true)}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-[#05203C] px-5 py-3.5 text-xs font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#0B2545]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span>Tanya NutriCoach AI</span>
          </button>
        )}
      </div>
    </>
  );
}