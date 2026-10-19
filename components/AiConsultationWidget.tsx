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
} from 'lucide-react';

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
  weeklyMeals: AiDayMealPlan[];
  weeklyWorkouts: AiDayWorkout[];
  generatedAt: string;
  source: 'gemini-ai' | 'smart-engine';
}

export interface BiometricAiPayload {
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  activityLevel: string;
  goal: string;
  budgetTier: string;
  sleepHours: number;
  bmi: number;
  bodyFat: number;
  whr: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiPlanCustomizerBarProps {
  customPreference: string;
  onChangePreference: (val: string) => void;
  onRegeneratePlan: (prefOverride?: string) => void;
  isGenerating: boolean;
  aiSummaryNote: string;
  generatedAt?: string;
}

export function AiPlanCustomizerBar({
  customPreference,
  onChangePreference,
  onRegeneratePlan,
  isGenerating,
  aiSummaryNote,
  generatedAt,
}: AiPlanCustomizerBarProps) {
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

  return (
    <div className="rounded-[2rem] border border-[#1E4E79]/40 bg-gradient-to-br from-[#05203C] via-[#082B52] to-[#05203C] p-6 text-white shadow-lg sm:p-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#38D46A]/20 px-3 py-1 text-[11px] font-extrabold text-[#38D46A]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Dynamic Program Generator • Aktif
            {generatedAt ? (
              <span className="text-[#E0F2FE]/80">
                • Diperbarui {generatedAt}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            Rekomendasi AI Personal & Kustomisasi Menu/Latihan
          </h3>
          <p className="max-w-3xl text-xs leading-relaxed text-[#E0F2FE]">
            {aiSummaryNote}
          </p>
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={() => onRegeneratePlan()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#38D46A] px-5 py-3 text-xs font-extrabold text-[#0B2545] shadow-md transition hover:brightness-95 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
          />
          {isGenerating
            ? 'AI Sedang Menyusun Program...'
            : 'Susun Ulang dengan AI'}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 border-t border-white/15 pt-4"
      >
        <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#38D46A]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Sesuaikan Alergi, Bahan Makanan Lokal, atau Kondisi Latihan Anda:
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
            Terapkan ke Program 7 Hari
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#E0F2FE]/80">
            Pilihan Cepat:
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
  biometricContext: BiometricAiPayload;
}

export function AiChatbotPanel({ biometricContext }: AiChatbotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-ai',
      role: 'assistant',
      content: `Halo ${biometricContext.name}! Saya NutriCoach AI, asisten gizi dan kebugaran pribadi Anda.\n\nSaya sudah menganalisis profil biometrik Anda (BMI ${biometricContext.bmi} kg/m², estimasi lemak ${biometricContext.bodyFat}%, target ${biometricContext.targetCalories} kkal & ${biometricContext.proteinGrams}g protein/hari).\n\nAda bahan makanan yang ingin diganti karena alergi/bosan, atau ingin diskusi strategi menurunkan lemak perut? Tanyakan langsung di bawah ini!`,
      timestamp: 'Baru saja',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const quickQuestions = [
    'Bagaimana cara capai target protein harian dengan budget hemat?',
    'Saya alergi ikan laut, apa pengganti lauk yang kalorinya setara?',
    'Kapan waktu terbaik olahraga untuk membakar lemak perut?',
    'Bolehkah saya minum kopi susu saat sedang defisit kalori?',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendChatMessage = async (textToSend?: string) => {
    const cleanText = (textToSend ?? inputMsg).trim();
    if (!cleanText || isLoading) return;

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
          biometricContext,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: cleanText,
        }),
      });

      const data = await res.json();
      const assistantEntry: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          'Maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantEntry]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Koneksi ke server AI sedang sibuk. Pastikan Anda tetap menjaga target harian ${biometricContext.targetCalories} kkal dan ${biometricContext.proteinGrams}g protein.`,
          timestamp: 'Baru saja',
        },
      ]);
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
                  Terhubung Data Biometrik
                </span>
              </div>
              <p className="text-xs text-[#E0F2FE]">
                Target Konteks: {biometricContext.targetCalories} kkal •{' '}
                {biometricContext.proteinGrams}g Protein • BMI{' '}
                {biometricContext.bmi}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-[#EEF5FC]/70 px-6 py-3">
          <span className="text-[11px] font-extrabold text-[#0B4B84] uppercase">
            Topik Konsultasi Cepat:
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

        <div className="max-h-[420px] min-h-[300px] space-y-4 overflow-y-auto p-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    isUser
                      ? 'bg-[#0B4B84] text-white'
                      : 'bg-[#05203C] text-[#38D46A]'
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed sm:text-sm ${
                    isUser
                      ? 'rounded-tr-none bg-[#0B4B84] font-semibold text-white'
                      : 'rounded-tl-none border border-slate-100 bg-[#EEF5FC]/80 font-medium text-[#0B2545]'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                  <div
                    className={`mt-1.5 text-[10px] ${
                      isUser ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
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
                NutriCoach AI sedang menyusun saran klinis untuk Anda...
              </div>
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
            placeholder="Ketik pertanyaan gizi, pengganti makanan, atau tips olahraga..."
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
          <div className="w-[340px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:w-[380px]">
            <div className="flex items-center justify-between bg-[#05203C] px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38D46A] text-[#0B2545]">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold">NutriCoach AI</div>
                  <div className="text-[10px] text-[#38D46A]">
                    Online • Konsultasi Cepat
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

            <div className="max-h-[280px] space-y-3 overflow-y-auto p-4">
              {messages.slice(-4).map((msg) => (
                <div
                  key={`float-${msg.id}`}
                  className={`rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-6 bg-[#0B4B84] font-semibold text-white'
                      : 'mr-4 bg-[#EEF5FC] font-medium text-[#0B2545]'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              ))}
              {isLoading ? (
                <div className="text-xs font-bold text-[#0B4B84]">
                  Mengetik jawaban...
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
            Tanya NutriCoach AI
          </button>
        )}
      </div>
    </>
  );
}