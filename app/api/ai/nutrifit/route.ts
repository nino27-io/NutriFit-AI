import { NextResponse } from 'next/server';

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
  source: 'gemini-ai' | 'cloud-llm';
}

interface BiometricContext {
  name: string;
  email?: string;
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

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

/**
 * GUARDRAIL FILTER: Mendeteksi kata kunci rasisme/SARA, seksualitas eksplisit/pornografi,
 * perjudian, atau kekerasan ekstrem sebelum dikirim ke model.
 */
function checkSafetyGuardrail(text: string): {
  blocked: boolean;
  reason?: string;
} {
  const normalized = text.toLowerCase();

  const sexualKeywords = [
    'bokep',
    'porno',
    'pornografi',
    'ngentot',
    'memek',
    'kontol',
    'bugil',
    'telanjang',
    'masturbasi',
    'colmek',
    'coli',
    'open bo',
    'prostitusi',
    'seks bebas',
    'posisi seks',
    'orgasme',
    'erotis',
    'hentai',
    'nsfw',
  ];

  const racismAndHateKeywords = [
    'rasis',
    'pribumi hina',
    'cina babi',
    'arab Sesat',
    'negro',
    'nigger',
    'supremasi ras',
    'pembersihan etnis',
    'benci suku',
    'hina agama',
    'penistaan agama',
  ];

  const illegalKeywords = [
    'situs judi',
    'slot gacor',
    'judi online',
    'cara bunuh diri',
    'merakit bom',
    'beli narkoba',
    'sabu-sabu',
  ];

  if (sexualKeywords.some((kw) => normalized.includes(kw))) {
    return {
      blocked: true,
      reason:
        'Maaf, sebagai konsultan profesional NutriFit AI, saya tidak dapat melayani pertanyaan yang berkaitan dengan konten seksualitas eksplisit, pornografi, atau topik dewasa di luar edukasi kesehatan klinis.',
    };
  }

  if (racismAndHateKeywords.some((kw) => normalized.includes(kw))) {
    return {
      blocked: true,
      reason:
        'Maaf, pertanyaan Anda tidak dapat diproses karena mengandung unsur rasisme, SARA, atau ujaran kebencian yang melanggar pedoman etika konsultasi NutriFit AI.',
    };
  }

  if (illegalKeywords.some((kw) => normalized.includes(kw))) {
    return {
      blocked: true,
      reason:
        'Maaf, saya tidak dapat menanggapi pertanyaan yang berkaitan dengan aktivitas ilegal, perjudian, atau tindakan berbahaya di luar ruang lingkup konsultasi.',
    };
  }

  return { blocked: false };
}

/**
 * Fungsi pemanggil Real Generative LLM:
 * 1. Menggunakan Google Gemini API (gemini-2.5-flash / gemini-2.0-flash) jika GEMINI_API_KEY tersedia.
 * 2. Otomatis beralih ke Cloud OpenAI-Compatible LLM jika GEMINI_API_KEY belum diatur,
 *    sehingga AI 100% selalu berpikir dinamis layaknya AI sungguhan (bukan jawaban statis dari kode).
 */
async function generateRealAiCompletion(params: {
  systemInstruction: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  jsonMode?: boolean;
}): Promise<{ text: string; provider: 'gemini-ai' | 'cloud-llm' }> {
  const apiKey = sanitizeKey(process.env.GEMINI_API_KEY);
  const hasGeminiKey =
    Boolean(apiKey) && !apiKey.includes('MASUKKAN_GEMINI_API_KEY');

  // 1. Coba Google Gemini API terlebih dahulu jika kunci tersedia
  if (hasGeminiKey) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const modelName of modelsToTry) {
      try {
        const contents = params.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: params.systemInstruction }],
              },
              contents,
              generationConfig: {
                temperature: params.jsonMode ? 0.5 : 0.7,
                ...(params.jsonMode
                  ? { responseMimeType: 'application/json' }
                  : {}),
              },
            }),
          }
        );

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (res.ok && text.trim()) {
          return { text: text.trim(), provider: 'gemini-ai' };
        }
      } catch (err) {
        console.warn(`Gemini (${modelName}) gagal, mencoba jalur berikutnya:`, err);
      }
    }
  }

  // 2. Real Cloud LLM Engine (OpenAI-Compatible Endpoint) — Tanpa perlu API Key manual
  const openAiMessages = [
    { role: 'system', content: params.systemInstruction },
    ...params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const cloudRes = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: openAiMessages,
      temperature: params.jsonMode ? 0.5 : 0.7,
      ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!cloudRes.ok) {
    throw new Error(`Cloud LLM HTTP ${cloudRes.status}`);
  }

  const cloudData = await cloudRes.json();
  const replyText =
    cloudData?.choices?.[0]?.message?.content ||
    (typeof cloudData === 'string' ? cloudData : '');

  if (!replyText || !replyText.trim()) {
    throw new Error('Respons AI kosong');
  }

  return { text: replyText.trim(), provider: 'cloud-llm' };
}

function cleanJsonString(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, biometricContext, customPreference, messages, userMessage } =
      body as {
        mode: 'generate_plan' | 'chat';
        biometricContext: BiometricContext;
        customPreference?: string;
        messages?: { role: 'user' | 'assistant'; content: string }[];
        userMessage?: string;
      };

    // =========================================================================
    // MODE 1: CHATBOT KONSULTASI AI INTERAKTIF (REAL AI CONSULTANT)
    // =========================================================================
    if (mode === 'chat') {
      const cleanQuestion = (userMessage || '').trim();
      if (!cleanQuestion) {
        return NextResponse.json(
          { error: 'Pesan tidak boleh kosong.' },
          { status: 400 }
        );
      }

      // Cek Guardrail Keamanan (Rasisme, Seksualitas, Judi, Kekerasan)
      const safetyCheck = checkSafetyGuardrail(cleanQuestion);
      if (safetyCheck.blocked) {
        return NextResponse.json({
          reply: safetyCheck.reason,
          source: 'guardrail-filter',
        });
      }

      const systemInstruction = `Kamu adalah "NutriCoach AI", konsultan cerdas, ramah, dan berwawasan luas di aplikasi NutriFit AI.

ATURAN PERILAKU UTAMA:
1. JAWAB LAYAKNYA MANUSIA/KONSULTAN AI ASLI YANG CERDAS:
   - Kamu BUKAN mesin template. Jangan pernah mengulang-ulang kalimat pembuka yang kaku atau menyebutkan ulang seluruh data BMI/Kalori pengguna jika tidak ditanyakan.
   - Jawablah semua jenis pertanyaan pengguna secara langsung, luwes, solutif, dan mendalam (baik seputar nutrisi, makanan harian, resep, olahraga, kesehatan, produktivitas, manajemen waktu kuliah/kerja, sains, motivasi, maupun konsultasi umum).
   - Gunakan data biometrik pengguna di bawah ini HANYA sebagai konteks pendukung yang relevan.

2. FILTER KEAMANAN & ETIKA (WAJIB PATUH):
   - TOLAK DENGAN SOPAN segala pertanyaan yang berkaitan dengan:
     a) Rasisme, diskriminasi suku/agama/ras/antargolongan (SARA), dan ujaran kebencian.
     b) Seksualitas eksplisit, pornografi, pelecehan seksual, atau konten dewasa (NSFW).
     c) Perjudian online, narkoba, tindakan kriminal, kekerasan, atau politik praktis yang memecah belah.
   - Jika pengguna menanyakan hal-hal terlarang tersebut, jawab dengan sopan: "Maaf, sebagai konsultan NutriFit AI, saya tidak dapat menanggapi topik yang berkaitan dengan SARA/rasisme, seksualitas, atau hal di luar batas etika konsultasi."

3. PROFIL PENGGUNA SAAT INI (Gunakan seperlunya secara alami):
   - Identitas/Email: ${biometricContext.name} (${biometricContext.email || 'Pengguna'})
   - Profil Fisik: ${biometricContext.gender === 'male' ? 'Pria' : 'Wanita'}, ${biometricContext.age} tahun, Tinggi ${biometricContext.heightCm} cm, Berat ${biometricContext.weightKg} kg
   - Indikator Klinis: BMI ${biometricContext.bmi} kg/m², Lemak Tubuh ${biometricContext.bodyFat}%, WHR ${biometricContext.whr}
   - Kebutuhan Energi: BMR ${biometricContext.bmr} kkal, TDEE ${biometricContext.tdee} kkal, Target Kalori ${biometricContext.targetCalories} kkal/hari, Target Protein ${biometricContext.proteinGrams}g/hari, Budget makan: ${biometricContext.budgetTier}.`;

      const conversationHistory: {
        role: 'user' | 'assistant';
        content: string;
      }[] = [
        ...(messages || []).slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: cleanQuestion },
      ];

      const aiResult = await generateRealAiCompletion({
        systemInstruction,
        messages: conversationHistory,
        jsonMode: false,
      });

      return NextResponse.json({
        reply: aiResult.text,
        source: aiResult.provider,
      });
    }

    // =========================================================================
    // MODE 2: GENERATE PROGRAM 7 HARI (MENU & LATIHAN) DENGAN REAL AI
    // =========================================================================
    if (mode === 'generate_plan') {
      if (customPreference) {
        const prefSafety = checkSafetyGuardrail(customPreference);
        if (prefSafety.blocked) {
          return NextResponse.json(
            { error: prefSafety.reason },
            { status: 400 }
          );
        }
      }

      const planPrompt = `Susunkan program 7 Hari (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu) berupa Rencana Menu Pangan Lokal Indonesia dan Jadwal Latihan Fisik untuk pengguna berikut:
- Nama/Identitas: ${biometricContext.name} (${biometricContext.gender === 'male' ? 'Pria' : 'Wanita'}, ${biometricContext.age} tahun)
- Tinggi/Berat: ${biometricContext.heightCm} cm / ${biometricContext.weightKg} kg (BMI: ${biometricContext.bmi} kg/m², Lemak Tubuh: ${biometricContext.bodyFat}%, WHR: ${biometricContext.whr})
- Target Kalori Harian: ${biometricContext.targetCalories} kkal/hari (Batas BMR: ${biometricContext.bmr} kkal)
- Target Makro: Protein ${biometricContext.proteinGrams}g, Karbohidrat ${biometricContext.carbGrams}g, Lemak ${biometricContext.fatGrams}g
- Tingkat Budget: ${biometricContext.budgetTier.toUpperCase()}
- Tujuan: ${biometricContext.goal}
- Permintaan Kustom / Alergi Pengguna: "${customPreference || 'Menu lokal Indonesia yang variatif, lezat, dan mudah didapat'}"

Kembalikan HANYA objek JSON murni dengan struktur persis berikut:
{
  "aiSummaryNote": "Analisis klinis personal 2 kalimat untuk ${biometricContext.name} beserta penjelasan singkat strategi menu/latihan yang disusun",
  "weeklyMeals": [
    {
      "day": "Senin",
      "costEstimate": "Rp35.000",
      "dailyTip": "Tips praktis hari tersebut",
      "meals": [
        {
          "time": "Sarapan (07.00)",
          "title": "Nama Menu",
          "portionDesc": "Takaran porsi jelas (gram/centong/potong)",
          "kcalShare": 450,
          "proteinGrams": 30
        },
        {
          "time": "Makan Siang (12.30)",
          "title": "Nama Menu",
          "portionDesc": "Takaran porsi jelas",
          "kcalShare": 600,
          "proteinGrams": 42
        },
        {
          "time": "Camilan Sore (16.00)",
          "title": "Nama Menu",
          "portionDesc": "Takaran porsi jelas",
          "kcalShare": 200,
          "proteinGrams": 12
        },
        {
          "time": "Makan Malam (19.00)",
          "title": "Nama Menu",
          "portionDesc": "Takaran porsi jelas",
          "kcalShare": 450,
          "proteinGrams": 35
        }
      ]
    }
  ],
  "weeklyWorkouts": [
    {
      "day": "Senin",
      "focus": "Judul Fokus Latihan",
      "duration": "35 Menit",
      "intensity": "Moderat",
      "isRest": false,
      "exercises": [
        "Nama gerakan — set x repetisi"
      ]
    }
  ]
}
Wajib sertakan lengkap 7 hari (Senin s.d. Minggu) untuk weeklyMeals dan weeklyWorkouts.`;

      const aiPlanResult = await generateRealAiCompletion({
        systemInstruction:
          'Kamu adalah AI Clinical Nutritionist & Strength Coach yang selalu mengembalikan JSON valid tanpa teks tambahan di luar JSON.',
        messages: [{ role: 'user', content: planPrompt }],
        jsonMode: true,
      });

      const cleanedJson = cleanJsonString(aiPlanResult.text);
      const parsed = JSON.parse(cleanedJson);

      return NextResponse.json({
        aiSummaryNote: parsed.aiSummaryNote,
        weeklyMeals: parsed.weeklyMeals,
        weeklyWorkouts: parsed.weeklyWorkouts,
        generatedAt: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        source: aiPlanResult.provider,
      } satisfies AiGeneratedProgram);
    }

    return NextResponse.json({ error: 'Mode tidak valid' }, { status: 400 });
  } catch (error: unknown) {
    console.error('AI Route Error:', error);
    return NextResponse.json(
      {
        error:
          'Layanan AI sedang memproses banyak permintaan. Silakan coba beberapa saat lagi.',
      },
      { status: 500 }
    );
  }
}