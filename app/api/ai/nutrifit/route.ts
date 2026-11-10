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

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function parseApiKeys(raw?: string): string[] {
  const candidates = [
    raw,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PLAN_SYSTEM_INSTRUCTION = `Anda adalah Mesin Komputasi Biometrik Klinis, Ahli Gizi Klinis, dan Pelatih Fisik di NutriFit AI Indonesia.
Gunakan data mentah pengguna untuk menghitung seluruh parameter secara matematis, lalu buat analisis mendalam yang sangat spesifik terhadap profil unik pengguna ini. Jangan pernah menggunakan frasa generik atau template. Jelaskan alasan fisiologis dan matematis mengapa setiap angka muncul.

Aturan Komputasi Wajib:
1. Hitung di dalam "calculated_values":
   - Rentang Berat Ideal & BMI (standar WHO Asia-Pasifik: batas normal 18.5 - 22.9 kg/m²).
   - Persentase Lemak Tubuh (Metode US Navy) beserta fatMassKg dan leanMassKg.
   - Waist-to-Hip Ratio (WHR = pinggang / pinggul).
   - BMR (Mifflin-St Jeor), TDEE sesuai faktor aktivitas (sedentary=1.2, light=1.375, moderate=1.55, active=1.725), dan Target Kalori Harian sesuai tujuan (fat_loss = defisit 400 kkal dari TDEE namun wajib mematuhi BMR Guard yaitu tidak boleh di bawah BMR; maintenance = TDEE; muscle_gain = surplus 300 kkal dari TDEE).
   - Makronutrien (proteinGrams, carbGrams, fatGrams) di mana (proteinGrams * 4) + (carbGrams * 4) + (fatGrams * 9) tepat sama dengan targetCalories.
   - Kebutuhan air harian (waterLiters).
2. Di dalam "dynamic_analysis":
   - Sediakan 5 langkah rumus di "formulaBreakdown" (BMI & Berat Ideal, % Lemak US Navy, WHR, BMR Mifflin-St Jeor, TDEE & Makronutrien) lengkap dengan substitusi angka nyata pengguna.
   - Susun "weeklyMeals" WAJIB lengkap 7 hari berurutan ("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"), masing-masing 4 waktu makan dengan menu lokal Indonesia yang variatif dan sesuai anggaran.
   - Susun "weeklyWorkouts" WAJIB lengkap 7 hari berurutan ("Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu").`;

const CHAT_SYSTEM_INSTRUCTION = `Anda adalah "NutriCoach AI", model LLM pakar gizi klinis, antropometri, dan kebugaran dari sistem NutriFit AI Indonesia.
Berinteraksilah secara luwes, cerdas, empatik, dan mendalam layaknya model LLM tingkat lanjut yang menguasai penuh topik nutrisi dan olahraga:
1. Gunakan data biometrik pengguna sebagai konteks utama. Jika pengguna meminta pembaruan menu berdasarkan bahan makanan yang mereka miliki (misalnya hanya punya beras, tempe, telur, kol), langsung racikkan jadwal/rekomendasi menu yang lezat, realistis, lengkap dengan takaran gramasi dan perhitungan kalori/proteinnya secara real-time.
2. Jika pengguna bertanya tentang penyesuaian target atau perhitungan, hitung langsung secara matematis dan jelaskan alasannya secara natural tanpa bahasa kaku.
3. Format jawaban menggunakan Markdown yang rapi:
   - Gunakan subjudul "### " untuk memisahkan bagian penting.
   - Gunakan **Tabel Markdown** saat menampilkan daftar menu, pembagian porsi, atau jadwal latihan.
   - Jika menampilkan rumus atau rincian perhitungan matematika, tuliskan pada baris khusus diawali "> RUMUS: " dengan simbol bersih (×, ÷, +, -, =).`;

async function callGeminiFullAi(
  rawApiKeyEnv: string,
  systemInstruction: string,
  userPrompt: string,
  expectJson: boolean
): Promise<string> {
  const apiKeys = parseApiKeys(rawApiKeyEnv);
  if (apiKeys.length === 0) {
    throw new Error(
      'GEMINI_API_KEY belum diisi atau tidak valid di .env.local.'
    );
  }

  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
  ];

  const errorLogs: string[] = [];
  const baseUrl = [
    'https:',
    '',
    'generativelanguage.googleapis.com',
    'v1beta',
    'models',
  ].join('/');

  for (const currentKey of apiKeys) {
    for (const modelName of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const endpoint =
            baseUrl +
            '/' +
            encodeURIComponent(modelName.trim()) +
            ':generateContent?key=' +
            encodeURIComponent(currentKey);

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: String(userPrompt) }],
                },
              ],
              generationConfig: expectJson
                ? {
                    temperature: 0.6,
                    topP: 0.92,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json',
                  }
                : {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                  },
            }),
          });

          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (res.ok && text) {
            return text;
          }

          const errMessage =
            data?.error?.message || `Status HTTP ${String(res.status)}`;
          errorLogs.push(`${modelName}: ${errMessage}`);

          if ((res.status === 429 || res.status === 503) && attempt === 1) {
            await delay(1200);
            continue;
          }

          break;
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Gagal menghubungi endpoint';
          errorLogs.push(`${modelName}: ${msg}`);
          break;
        }
      }
    }
  }

  throw new Error(
    errorLogs[0] || 'Gagal memproses komputasi di server Gemini API.'
  );
}

export async function POST(request: Request) {
  try {
    const rawApiKeyEnv = process.env.GEMINI_API_KEY || '';
    const body = await request.json();

    const {
      mode,
      rawInput,
      computedBiometrics,
      customPreference,
      messages,
      userMessage,
    } = body as {
      mode: 'generate_plan' | 'chat';
      rawInput: RawUserBiometricInput;
      computedBiometrics?: AiComputedBiometrics;
      customPreference?: string;
      messages?: { role: 'user' | 'assistant'; content: string }[];
      userMessage?: string;
    };

    if (mode === 'generate_plan') {
      if (!rawInput) {
        return NextResponse.json(
          { error: 'Data input biometrik tidak ditemukan.' },
          { status: 400 }
        );
      }

      const userPrompt = `Data Mentah Pengguna:
${JSON.stringify(
  {
    ...rawInput,
    customPreference:
      customPreference ||
      'Tidak ada alergi khusus, prioritaskan bahan makanan lokal Indonesia yang mudah didapat dan bervariasi setiap hari',
  },
  null,
  2
)}

Hitung seluruh metrik biometrik dan susun program 7 hari penuh (Senin s.d. Minggu) dalam format JSON valid sesuai skema berikut:
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
    "aiSummaryNote": "Penjelasan analisis mendalam mengapa angka-angka tersebut muncul untuk tubuh pengguna",
    "bmiCategory": "Kategori BMI WHO Asia-Pasifik",
    "weightAdvice": "Strategi spesifik berdasarkan selisih berat badan",
    "whrStatus": "Status risiko viseral berdasarkan rasio pinggang-pinggul",
    "bmrGuardExplanation": "Penjelasan keamanan target kalori terhadap BMR",
    "sleepAssessment": "Evaluasi klinis durasi tidur pengguna",
    "formulaBreakdown": [
      {
        "parameter": "Nama Parameter",
        "formulaName": "Nama Rumus Ilmiah",
        "equation": "Persamaan Matematika",
        "substitution": "Substitusi angka pengguna",
        "result": "Hasil Akhir"
      }
    ],
    "weeklyMeals": [
      {
        "day": "Senin",
        "costEstimate": "Estimasi biaya harian",
        "dailyTip": "Tips spesifik hari tersebut",
        "meals": [
          {
            "time": "Sarapan (07.00)",
            "title": "Nama Menu",
            "portionDesc": "Rincian porsi gram/rumah tangga",
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
        "exercises": ["Nama gerakan — set x repetisi"]
      }
    ]
  }
}`;

      const rawAiText = await callGeminiFullAi(
        rawApiKeyEnv,
        PLAN_SYSTEM_INSTRUCTION,
        userPrompt,
        true // Parameter ke-4 bernilai true agar dashboard menerima struktur JSON
      );

      const parsed = JSON.parse(
        cleanJsonString(rawAiText)
      ) as FullAiStructuredOutput;

      const calc = parsed.calculated_values;
      const analysis = parsed.dynamic_analysis;

      if (!calc || !analysis) {
        throw new Error('Struktur JSON dari AI tidak lengkap.');
      }

      const responsePayload: AiGeneratedProgram & FullAiStructuredOutput = {
        calculated_values: calc,
        dynamic_analysis: analysis,
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

      return NextResponse.json(responsePayload);
    }

    if (mode === 'chat') {
      const cleanQuestion = (userMessage || '').trim();
      if (!cleanQuestion) {
        return NextResponse.json(
          { error: 'Pertanyaan tidak boleh kosong.' },
          { status: 400 }
        );
      }

      const historyTranscript = (messages || [])
        .slice(-8)
        .map(
          (m) =>
            `${m.role === 'user' ? 'Pengguna' : 'NutriCoach AI'}: ${m.content}`
        )
        .join('\n');

      const chatContextPrompt = `Data Mentah Biometrik Pengguna:
${JSON.stringify(rawInput, null, 2)}

Metrik Hasil Perhitungan Saat Ini:
${JSON.stringify(computedBiometrics || {}, null, 2)}

Riwayat Percakapan:
${historyTranscript || 'Belum ada percakapan sebelumnya.'}

Pertanyaan / Permintaan Pengguna Saat Ini:
"${cleanQuestion}"`;

      const replyMarkdown = await callGeminiFullAi(
        rawApiKeyEnv,
        CHAT_SYSTEM_INSTRUCTION,
        chatContextPrompt,
        false // Parameter ke-4 bernilai false agar Chatbot merespons luwes sebagai LLM murni
      );

      return NextResponse.json({
        reply: replyMarkdown,
      });
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