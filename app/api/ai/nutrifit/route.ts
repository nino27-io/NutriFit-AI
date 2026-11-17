import { NextResponse } from 'next/server';

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

export interface AiCalculatedValues {
  idealWeightMinKg: number;
  idealWeightMaxKg: number;
  idealWeightMidKg: number;
  weightDiffKg: number;
  bmi: number;
  bodyFatPercentage: number;
  fatMassKg: number;
  leanMassKg: number;
  whr: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  bmrGuardTriggered: boolean;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  waterLiters: number;
}

export interface AiDynamicAnalysis {
  aiSummaryNote: string;
  bmiCategory: string;
  weightAdvice: string;
  whrStatus: string;
  bmrGuardExplanation: string;
  sleepAssessment: string;
  formulaBreakdown: AiFormulaStep[];
  weeklyMeals: AiDayMealPlan[];
  weeklyWorkouts: AiDayWorkout[];
}

export interface FullAiStructuredOutput {
  calculated_values: AiCalculatedValues;
  dynamic_analysis: AiDynamicAnalysis;
}

// ============================================================================
// SERVER-SIDE MEMORY CACHE (Hemat Kuota API & Respons < 5ms untuk Input Sama)
// ============================================================================
interface CacheEntry {
  expiresAt: number;
  payload: unknown;
}

const PLAN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit
const MAX_CACHE_ENTRIES = 100;
const serverPlanCache = new Map<string, CacheEntry>();

function getCachedPlan(key: string): unknown | null {
  const entry = serverPlanCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    serverPlanCache.delete(key);
    return null;
  }
  return entry.payload;
}

function setCachedPlan(key: string, payload: unknown): void {
  if (serverPlanCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = serverPlanCache.keys().next().value;
    if (oldestKey) serverPlanCache.delete(oldestKey);
  }
  serverPlanCache.set(key, {
    expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
    payload,
  });
}

// ============================================================================
// UTILITAS KEY & PEMBERSIH JSON
// ============================================================================
function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function parseGeminiKeys(raw?: string): string[] {
  const candidates = [
    raw,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ]
    .filter(Boolean)
    .join(',');

  const uniqueKeys = new Set<string>();
  for (const part of candidates.split(',')) {
    const cleaned = sanitizeKey(part);
    if (cleaned.length >= 20 && !cleaned.includes('MASUKKAN_GEMINI_API_KEY')) {
      uniqueKeys.add(cleaned);
    }
  }
  return Array.from(uniqueKeys);
}

function cleanJsonString(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  const jsonSlice =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? stripped.slice(firstBrace, lastBrace + 1)
      : stripped;

  return jsonSlice.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
}

// ============================================================================
// SYSTEM INSTRUCTIONS PAKAR NUTRIFIT AI
// ============================================================================
const PLAN_SYSTEM_INSTRUCTION = `Anda adalah Mesin Komputasi Biometrik Klinis, Ahli Gizi Klinis, dan Pelatih Fisik di NutriFit AI Indonesia.
Gunakan data mentah pengguna untuk menghitung seluruh parameter secara matematis, lalu buat analisis mendalam yang spesifik dan ringkas tanpa frasa generik.

Aturan Komputasi Wajib:
1. Hitung di dalam "calculated_values":
   - Rentang Berat Ideal & BMI (standar WHO Asia-Pasifik: normal 18.5 - 22.9 kg/m²).
   - Persentase Lemak Tubuh (Metode US Navy) beserta fatMassKg dan leanMassKg.
   - Waist-to-Hip Ratio (WHR = pinggang / pinggul).
   - BMR (Mifflin-St Jeor), TDEE sesuai faktor aktivitas (sedentary=1.2, light=1.375, moderate=1.55, active=1.725), dan Target Kalori Harian (fat_loss = defisit 400 kkal dari TDEE namun wajib mematuhi BMR Guard agar tidak di bawah BMR; maintenance = TDEE; muscle_gain = surplus 300 kkal dari TDEE).
   - Makronutrien (proteinGrams, carbGrams, fatGrams) dengan (proteinGrams * 4) + (carbGrams * 4) + (fatGrams * 9) = targetCalories.
   - Kebutuhan air harian (waterLiters).
2. Di dalam "dynamic_analysis":
   - Sediakan 5 langkah rumus di "formulaBreakdown" (BMI & Berat Ideal, % Lemak US Navy, WHR, BMR Mifflin-St Jeor, TDEE & Makronutrien) lengkap dengan substitusi angka pengguna.
   - Susun jadwal makan dan jadwal olahraga lokal Indonesia yang realistis, hemat token, padat informasi, dan sesuai anggaran.`;

const REMAINING_DAYS_SYSTEM_INSTRUCTION = `Anda adalah Ahli Gizi Klinis dan Pelatih Fisik NutriFit AI Indonesia.
Lanjutkan penyusunan jadwal makan dan latihan untuk 6 hari berikutnya ("Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu") agar konsisten dengan target kalori & makronutrien pengguna, dengan variasi menu lokal Indonesia yang berbeda setiap harinya.`;

const CHAT_SYSTEM_INSTRUCTION = `Anda adalah "NutriCoach AI", pakar gizi klinis, antropometri, dan kebugaran dari NutriFit AI Indonesia.
Jawablah pertanyaan pengguna secara luwes, cerdas, empatik, dan langsung ke inti permasalahan menggunakan data biometrik pengguna sebagai acuan utama.
Jika pengguna meminta perubahan menu berdasarkan bahan yang tersedia atau menghitung ulang kalori/makro, langsung hitung secara matematis dan sajikan dengan format Markdown yang rapi (subjudul "### ", Tabel Markdown untuk menu/jadwal, dan baris "> RUMUS: " untuk perhitungan).`;

// ============================================================================
// ENGINE 1: FAST NON-STREAMING (JSON / TEXT) + GROQ FAILOVER
// ============================================================================
const GEMINI_FAST_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

async function callFastAiEngine(
  rawGeminiEnv: string,
  systemInstruction: string,
  userPrompt: string,
  expectJson: boolean
): Promise<string> {
  const geminiKeys = parseGeminiKeys(rawGeminiEnv);
  const groqKey = sanitizeKey(process.env.GROQ_API_KEY);

  if (geminiKeys.length === 0 && !groqKey) {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi di .env.local atau Environment Variables.'
    );
  }

  const errorLogs: string[] = [];
  const geminiBaseUrl = [
    'https:',
    '',
    'generativelanguage.googleapis.com',
    'v1beta',
    'models',
  ].join('/');

  for (const currentKey of geminiKeys) {
    for (const modelName of GEMINI_FAST_MODELS) {
      try {
        const endpoint =
          geminiBaseUrl +
          '/' +
          encodeURIComponent(modelName) +
          ':generateContent?key=' +
          encodeURIComponent(currentKey);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: expectJson
              ? {
                  temperature: 0.55,
                  topP: 0.9,
                  maxOutputTokens: 6144,
                  responseMimeType: 'application/json',
                }
              : {
                  temperature: 0.7,
                  topP: 0.95,
                  maxOutputTokens: 3072,
                },
          }),
        });

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (res.ok && text) {
          return text;
        }

        const msg = data?.error?.message || `HTTP ${res.status}`;
        errorLogs.push(`${modelName}: ${msg}`);

        if (res.status === 400 || res.status === 403) {
          break; // Key invalid, langsung pindah ke key berikutnya
        }
      } catch (err: unknown) {
        errorLogs.push(
          `${modelName}: ${err instanceof Error ? err.message : 'Network error'}`
        );
      }
    }
  }

  // FAILOVER OTOMATIS KE GROQ FREE API (500+ token/detik) JIKA GEMINI LIMIT
  if (groqKey) {
    try {
      const groqEndpoint = [
        'https:',
        '',
        'api.groq.com',
        'openai',
        'v1',
        'chat',
        'completions',
      ].join('/');

      const res = await fetch(groqEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          temperature: expectJson ? 0.5 : 0.7,
          max_tokens: 4096,
          ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (res.ok && text) {
        return text;
      }
      errorLogs.push(`Groq: ${data?.error?.message || `HTTP ${res.status}`}`);
    } catch (err: unknown) {
      errorLogs.push(
        `Groq: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  throw new Error(errorLogs[0] || 'Seluruh server AI sedang sibuk.');
}

// ============================================================================
// ENGINE 2: REAL-TIME SSE STREAMING UNTUK CHATBOT (< 0.8 DETIK)
// ============================================================================
async function createChatSseStream(
  rawGeminiEnv: string,
  systemInstruction: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const geminiKeys = parseGeminiKeys(rawGeminiEnv);
  const groqKey = sanitizeKey(process.env.GROQ_API_KEY);
  const encoder = new TextEncoder();

  const geminiBaseUrl = [
    'https:',
    '',
    'generativelanguage.googleapis.com',
    'v1beta',
    'models',
  ].join('/');

  // 1. Coba stream langsung dari Gemini
  for (const currentKey of geminiKeys) {
    for (const modelName of GEMINI_FAST_MODELS) {
      try {
        const endpoint =
          geminiBaseUrl +
          '/' +
          encodeURIComponent(modelName) +
          ':streamGenerateContent?alt=sse&key=' +
          encodeURIComponent(currentKey);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 3072,
            },
          }),
        });

        if (res.ok && res.body) {
          const upstreamReader = res.body.getReader();
          const decoder = new TextDecoder();

          return new ReadableStream<Uint8Array>({
            async start(controller) {
              let buffer = '';
              try {
                while (true) {
                  const { done, value } = await upstreamReader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });

                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const jsonPart = trimmed.slice(5).trim();
                    if (!jsonPart || jsonPart === '[DONE]') continue;

                    try {
                      const parsed = JSON.parse(jsonPart);
                      const chunkText =
                        parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (chunkText) {
                        controller.enqueue(
                          encoder.encode(
                            `data: ${JSON.stringify({ text: chunkText })}\n\n`
                          )
                        );
                      }
                    } catch {
                      // Abaikan potongan JSON parsial
                    }
                  }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (streamErr) {
                controller.error(streamErr);
              }
            },
          });
        }
      } catch {
        // Lanjut ke model/key berikutnya
      }
    }
  }

  // 2. Failover Stream ke Groq Free API jika Gemini terkena limit 429
  if (groqKey) {
    const groqEndpoint = [
      'https:',
      '',
      'api.groq.com',
      'openai',
      'v1',
      'chat',
      'completions',
    ].join('/');

    const res = await fetch(groqEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3072,
        stream: true,
      }),
    });

    if (res.ok && res.body) {
      const upstreamReader = res.body.getReader();
      const decoder = new TextDecoder();

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await upstreamReader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const jsonPart = trimmed.slice(5).trim();
                if (!jsonPart || jsonPart === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(jsonPart);
                  const chunkText = parsed?.choices?.[0]?.delta?.content;
                  if (chunkText) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ text: chunkText })}\n\n`
                      )
                    );
                  }
                } catch {
                  // Abaikan potongan parsial
                }
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (streamErr) {
            controller.error(streamErr);
          }
        },
      });
    }
  }

  throw new Error('Kuota AI sedang penuh. Silakan coba beberapa saat lagi.');
}

// ============================================================================
// ROUTE HANDLER UTAMA
// ============================================================================
export async function POST(request: Request) {
  try {
    const rawGeminiEnv = process.env.GEMINI_API_KEY || '';
    const body = await request.json();

    const {
      mode,
      planScope = 'full',
      rawInput,
      computedBiometrics,
      customPreference,
      mondaySummary,
      messages,
      userMessage,
      stream = false,
    } = body as {
      mode: 'generate_plan' | 'chat';
      planScope?: 'initial' | 'remaining_days' | 'full';
      rawInput: RawUserBiometricInput;
      computedBiometrics?: AiComputedBiometrics;
      customPreference?: string;
      mondaySummary?: string;
      messages?: { role: 'user' | 'assistant'; content: string }[];
      userMessage?: string;
      stream?: boolean;
    };

    // =========================================================================
    // MODE 1: GENERATE PLAN (MENDUKUNG PROGRESSIVE LOADING 2 TAHAP & CACHE)
    // =========================================================================
    if (mode === 'generate_plan') {
      if (!rawInput) {
        return NextResponse.json(
          { error: 'Data input biometrik tidak ditemukan.' },
          { status: 400 }
        );
      }

      const normalizedPref = (customPreference || '').trim();
      const cacheKey = JSON.stringify({
        planScope,
        rawInput,
        pref: normalizedPref,
      });

      const cached = getCachedPlan(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // TAHAP 2 (LATAR BELAKANG): Melengkapi Selasa - Minggu
      if (planScope === 'remaining_days') {
        const remainingPrompt = `Data Pengguna:
${JSON.stringify(rawInput)}
Target Nutrisi Terhitung:
${JSON.stringify(computedBiometrics || {})}
Preferensi: "${normalizedPref || 'Kuliner lokal Indonesia sehat & variatif'}"
Menu Hari Senin (jangan diulang): "${mondaySummary || '-'}"

Susun jadwal makan dan jadwal latihan untuk 6 hari ("Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu") dalam JSON valid:
{
  "weeklyMeals": [
    {
      "day": "Selasa",
      "costEstimate": "Rp35.000",
      "dailyTip": "Tips singkat",
      "meals": [
        { "time": "Sarapan (07.00)", "title": "Nama Menu", "portionDesc": "Takaran porsi", "kcalShare": 500, "proteinGrams": 30 }
      ]
    }
  ],
  "weeklyWorkouts": [
    {
      "day": "Selasa",
      "focus": "Fokus Latihan",
      "duration": "35 Menit",
      "intensity": "Moderat",
      "isRest": false,
      "exercises": ["Gerakan — set x repetisi"]
    }
  ]
}`;

        const rawRemaining = await callFastAiEngine(
          rawGeminiEnv,
          REMAINING_DAYS_SYSTEM_INSTRUCTION,
          remainingPrompt,
          true
        );

        const parsedRemaining = JSON.parse(cleanJsonString(rawRemaining)) as {
          weeklyMeals?: AiDayMealPlan[];
          weeklyWorkouts?: AiDayWorkout[];
        };

        const remainingPayload = {
          weeklyMeals: Array.isArray(parsedRemaining.weeklyMeals)
            ? parsedRemaining.weeklyMeals
            : [],
          weeklyWorkouts: Array.isArray(parsedRemaining.weeklyWorkouts)
            ? parsedRemaining.weeklyWorkouts
            : [],
        };

        setCachedPlan(cacheKey, remainingPayload);
        return NextResponse.json(remainingPayload);
      }

      // TAHAP 1 ('initial' = Cepat ~2.5 detik hanya Senin) atau 'full' (7 hari sekaligus)
      const isInitialOnly = planScope === 'initial';
      const daysInstruction = isInitialOnly
        ? 'Susun HANYA 1 hari pertama yaitu "Senin" di dalam array "weeklyMeals" (4 waktu makan) dan "weeklyWorkouts" agar respons super cepat.'
        : 'Susun lengkap 7 hari berurutan ("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu") di dalam "weeklyMeals" dan "weeklyWorkouts".';

      const userPrompt = `Data Mentah Pengguna:
${JSON.stringify({
  ...rawInput,
  customPreference:
    normalizedPref ||
    'Kuliner lokal Indonesia yang mudah didapat, bergizi, dan sesuai anggaran',
})}

${daysInstruction}
Kembalikan HANYA JSON valid sesuai skema berikut:
{
  "calculated_values": {
    "idealWeightMinKg": 0,
    "idealWeightMaxKg": 0,
    "idealWeightMidKg": 0,
    "weightDiffKg": 0,
    "bmi": 0,
    "bodyFatPercentage": 0,
    "fatMassKg": 0,
    "leanMassKg": 0,
    "whr": 0,
    "bmr": 0,
    "tdee": 0,
    "targetCalories": 0,
    "bmrGuardTriggered": false,
    "proteinGrams": 0,
    "carbGrams": 0,
    "fatGrams": 0,
    "waterLiters": 0
  },
  "dynamic_analysis": {
    "aiSummaryNote": "Ringkasan analisis spesifik 2-3 kalimat mengapa angka-angka ini muncul",
    "bmiCategory": "Kategori BMI WHO Asia-Pasifik",
    "weightAdvice": "Saran spesifik berdasarkan selisih berat badan",
    "whrStatus": "Status risiko viseral",
    "bmrGuardExplanation": "Penjelasan keamanan target kalori terhadap BMR",
    "sleepAssessment": "Evaluasi klinis jam tidur",
    "formulaBreakdown": [
      {
        "parameter": "Nama Parameter",
        "formulaName": "Nama Rumus",
        "equation": "Persamaan",
        "substitution": "Substitusi angka pengguna",
        "result": "Hasil Akhir"
      }
    ],
    "weeklyMeals": [
      {
        "day": "Senin",
        "costEstimate": "Estimasi biaya",
        "dailyTip": "Tips singkat",
        "meals": [
          {
            "time": "Sarapan (07.00)",
            "title": "Nama Menu",
            "portionDesc": "Takaran porsi",
            "kcalShare": 0,
            "proteinGrams": 0
          }
        ]
      }
    ],
    "weeklyWorkouts": [
      {
        "day": "Senin",
        "focus": "Fokus Latihan",
        "duration": "Durasi",
        "intensity": "Intensitas",
        "isRest": false,
        "exercises": ["Gerakan — set x repetisi"]
      }
    ]
  }
}`;

      const rawAiText = await callFastAiEngine(
        rawGeminiEnv,
        PLAN_SYSTEM_INSTRUCTION,
        userPrompt,
        true
      );

      const parsed = JSON.parse(
        cleanJsonString(rawAiText)
      ) as FullAiStructuredOutput;

      const calc = parsed.calculated_values;
      const analysis = parsed.dynamic_analysis;

      if (!calc || !analysis) {
        throw new Error('Struktur JSON dari AI tidak lengkap.');
      }

      const responsePayload: AiGeneratedProgram &
        FullAiStructuredOutput & { isPartialPlan?: boolean } = {
        calculated_values: calc,
        dynamic_analysis: analysis,
        isPartialPlan: isInitialOnly,
        aiSummaryNote: analysis.aiSummaryNote,
        biometrics: {
          ...calc,
          bmiCategory: analysis.bmiCategory,
          weightAdvice: analysis.weightAdvice,
          whrStatus: analysis.whrStatus,
          bmrGuardExplanation: analysis.bmrGuardExplanation,
          sleepAssessment: analysis.sleepAssessment,
        },
        formulaBreakdown: Array.isArray(analysis.formulaBreakdown)
          ? analysis.formulaBreakdown
          : [],
        weeklyMeals: Array.isArray(analysis.weeklyMeals)
          ? analysis.weeklyMeals
          : [],
        weeklyWorkouts: Array.isArray(analysis.weeklyWorkouts)
          ? analysis.weeklyWorkouts
          : [],
        generatedAt: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setCachedPlan(cacheKey, responsePayload);
      return NextResponse.json(responsePayload);
    }

    // =========================================================================
    // MODE 2: CHATBOT (MENDUKUNG REAL-TIME STREAMING & JSON FALLBACK)
    // =========================================================================
    if (mode === 'chat') {
      const cleanQuestion = (userMessage || '').trim();
      if (!cleanQuestion) {
        return NextResponse.json(
          { error: 'Pertanyaan tidak boleh kosong.' },
          { status: 400 }
        );
      }

      const historyTranscript = (messages || [])
        .slice(-6)
        .map(
          (m) =>
            `${m.role === 'user' ? 'Pengguna' : 'NutriCoach AI'}: ${m.content}`
        )
        .join('\n');

      const chatContextPrompt = `Data Biometrik Pengguna:
${JSON.stringify(rawInput)}

Metrik Hasil Perhitungan Saat Ini:
${JSON.stringify(computedBiometrics || {})}

Riwayat Percakapan:
${historyTranscript || 'Belum ada percakapan sebelumnya.'}

Pertanyaan Pengguna Saat Ini:
"${cleanQuestion}"`;

      if (stream) {
        const sseStream = await createChatSseStream(
          rawGeminiEnv,
          CHAT_SYSTEM_INSTRUCTION,
          chatContextPrompt
        );

        return new Response(sseStream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      }

      const replyMarkdown = await callFastAiEngine(
        rawGeminiEnv,
        CHAT_SYSTEM_INSTRUCTION,
        chatContextPrompt,
        false
      );

      return NextResponse.json({ reply: replyMarkdown });
    }

    return NextResponse.json({ error: 'Mode tidak valid.' }, { status: 400 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Gagal memproses perhitungan AI.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}