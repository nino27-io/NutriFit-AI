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

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function cleanJsonString(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function callGeminiModel(
  apiKey: string,
  prompt: string,
  expectJson: boolean
): Promise<string> {
  const models = ['gemini-3.5-flash-lite'];
  let lastError = 'Gagal menghubungi server AI Gemini.';

  for (const modelName of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: '' + prompt }] }],
          generationConfig: expectJson
            ? {
                temperature: 0.3,
                responseMimeType: 'application/json',
              }
            : {
                temperature: 0.55,
              },
        }),
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (res.ok && text) {
      return text;
    }

    lastError =
      data?.error?.message ||
      `Model ${modelName} mengembalikan status ${res.status}`;
  }

  throw new Error(lastError);
}

export async function POST(request: Request) {
  try {
    const apiKey = sanitizeKey(process.env.GEMINI_API_KEY);

    if (!apiKey || apiKey.includes('MASUKKAN_GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY belum diatur di file .env.local. Masukkan API Key Gemini Anda lalu restart npm run dev agar AI dapat menghitung analisis biometrik.',
        },
        { status: 500 }
      );
    }

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

    // =========================================================================
    // MODE 1: AI MENGHITUNG SELURUH ANALISIS BIOMETRIK, RUMUS, MENU & LATIHAN
    // =========================================================================
    if (mode === 'generate_plan') {
      if (!rawInput) {
        return NextResponse.json(
          { error: 'Data input biometrik tidak ditemukan.' },
          { status: 400 }
        );
      }

      const analysisPrompt = `Kamu adalah Sistem Komputasi Klinis Anthropometri, Ahli Gizi Klinis, dan Pelatih Fisik di NutriFit AI Indonesia.
Hitung secara akurat seluruh parameter biometrik, langkah rumus matematis, serta susun program menu lokal & jadwal latihan 7 hari (Senin–Minggu) dari data mentah pengguna berikut:
- Nama Panggilan: ${rawInput.name}
- Jenis Kelamin: ${rawInput.gender === 'male' ? 'Pria' : 'Wanita'}
- Usia: ${rawInput.age} tahun
- Tinggi Badan: ${rawInput.heightCm} cm
- Berat Badan: ${rawInput.weightKg} kg
- Lingkar Pinggang: ${rawInput.waistCm} cm
- Lingkar Pinggul: ${rawInput.hipCm} cm
- Lingkar Leher: ${rawInput.neckCm} cm
- Tingkat Aktivitas: ${rawInput.activityLevel} (sedentary=1.2, light=1.375, moderate=1.55, active=1.725)
- Tujuan Fisik: ${rawInput.goal} (fat_loss = defisit 400 kkal dari TDEE namun tidak boleh di bawah BMR; maintenance = setara TDEE; muscle_gain = surplus 300 kkal dari TDEE)
- Tingkat Anggaran Makan Harian: ${rawInput.budgetTier} (hemat: Rp25.000-Rp40.000/hari, seimbang: Rp45.000-Rp75.000/hari, fleksibel: >Rp75.000/hari)
- Durasi Tidur Malam: ${rawInput.sleepHours} jam/malam
- Permintaan / Alergi / Preferensi Khusus Pengguna: "${customPreference || 'Tidak ada alergi khusus, gunakan makanan lokal Indonesia yang mudah diperoleh'}"

INSTRUKSI PERHITUNGAN WAJIB OLEH AI:
1. Hitung Rentang Berat Badan Ideal menggunakan batas BMI Normal WHO Asia-Pasifik (18.5 hingga 22.9 kg/m²).
2. Hitung BMI, kategori BMI WHO Asia-Pasifik, WHR (Pinggang/Pinggul), dan Persentase Lemak Tubuh metode US Navy (beserta kg massa lemak & kg massa bebas lemak/otot).
3. Hitung BMR dengan rumus Mifflin-St Jeor, TDEE sesuai faktor aktivitas, dan Target Kalori Harian dengan aturan BMR Guard (Target Kalori tidak boleh lebih rendah dari BMR).
4. Hitung kebutuhan makronutrien harian (Protein dalam gram, Karbohidrat dalam gram, Lemak dalam gram) yang total kalorinya (P*4 + K*4 + L*9) tepat sama dengan Target Kalori Harian.
5. Buat rincian langkah perhitungan rumus di dalam array "formulaBreakdown" (minimal 5 rumus: BMI & Berat Ideal, % Lemak US Navy, WHR, BMR Mifflin-St Jeor, serta TDEE & Makronutrien) lengkap dengan rumus acuan, substitusi angka pengguna, dan hasil akhirnya.
6. Susun 7 hari rencana makan ("weeklyMeals", Senin–Minggu, masing-masing 4 waktu makan: Sarapan, Makan Siang, Camilan Sore, Makan Malam) yang mematuhi preferensi pengguna dan sesuai anggaran.
7. Susun 7 hari jadwal olahraga ("weeklyWorkouts", Senin–Minggu) yang sesuai tujuan pengguna.

Kembalikan HANYA objek JSON valid dengan skema persis berikut:
{
  "aiSummaryNote": "Ringkasan analisis klinis komprehensif 2-3 kalimat langsung dari perhitungan AI",
  "biometrics": {
    "idealWeightMinKg": 54.1,
    "idealWeightMaxKg": 67.0,
    "idealWeightMidKg": 60.5,
    "weightDiffKg": 13.5,
    "weightAdvice": "Saran spesifik berdasarkan selisih berat badan saat ini terhadap titik ideal",
    "bmi": 25.3,
    "bmiCategory": "Obesitas Tingkat I (WHO Asia-Pasifik)",
    "bodyFatPercentage": 23.4,
    "fatMassKg": 17.3,
    "leanMassKg": 56.7,
    "whr": 0.9,
    "whrStatus": "Status risiko lemak viseral",
    "bmr": 1680,
    "tdee": 2604,
    "targetCalories": 2204,
    "bmrGuardTriggered": false,
    "bmrGuardExplanation": "Penjelasan keamanan target kalori terhadap BMR organ vital",
    "proteinGrams": 133,
    "carbGrams": 280,
    "fatGrams": 61,
    "waterLiters": 2.6,
    "sleepAssessment": "Evaluasi klinis jam tidur terhadap hormon ghrelin dan kortisol"
  },
  "formulaBreakdown": [
    {
      "parameter": "1. BMI & Berat Ideal (WHO Asia-Pasifik)",
      "formulaName": "Quetelet Index & Rentang 18,5–22,9",
      "equation": "BMI = BB (kg) ÷ [TB (m)]²",
      "substitution": "74 ÷ (1,71 × 1,71)",
      "result": "25,3 kg/m² (Ideal: 54,1 – 67,0 kg)"
    }
  ],
  "weeklyMeals": [
    {
      "day": "Senin",
      "costEstimate": "Rp35.000",
      "dailyTip": "Tips nutrisi spesifik hari Senin",
      "meals": [
        {
          "time": "Sarapan (07.00)",
          "title": "Nama Menu",
          "portionDesc": "Takaran porsi gram/centong/potong yang akurat",
          "kcalShare": 550,
          "proteinGrams": 35
        }
      ]
    }
  ],
  "weeklyWorkouts": [
    {
      "day": "Senin",
      "focus": "Fokus Latihan",
      "duration": "35 Menit",
      "intensity": "Moderat",
      "isRest": false,
      "exercises": [
        "Nama gerakan — set x repetisi"
      ]
    }
  ]
}`;

      const rawAiText = await callGeminiModel(apiKey, analysisPrompt, true);
      const cleanedJson = cleanJsonString(rawAiText);
      const parsed = JSON.parse(cleanedJson) as Omit<
        AiGeneratedProgram,
        'generatedAt'
      >;

      if (!parsed?.biometrics || !Array.isArray(parsed?.weeklyMeals)) {
        throw new Error(
          'Format respons AI tidak lengkap. Silakan tekan tombol coba lagi.'
        );
      }

      const finalProgram: AiGeneratedProgram = {
        ...parsed,
        generatedAt: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      return NextResponse.json(finalProgram);
    }

    // =========================================================================
    // MODE 2: CHATBOT KONSULTASI REAL-TIME DIJAWAB MURNI OLEH AI
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

      const bioSummary = computedBiometrics
        ? `- Hasil Perhitungan AI Sebelumnya:
  • Berat Ideal: ${computedBiometrics.idealWeightMinKg}–${computedBiometrics.idealWeightMaxKg} kg (Titik tengah: ${computedBiometrics.idealWeightMidKg} kg)
  • BMI Asia-Pasifik: ${computedBiometrics.bmi} kg/m² (${computedBiometrics.bmiCategory})
  • Lemak Tubuh US Navy: ${computedBiometrics.bodyFatPercentage}% (Massa Lemak ${computedBiometrics.fatMassKg} kg, Massa Otot/Lean ${computedBiometrics.leanMassKg} kg)
  • WHR: ${computedBiometrics.whr} (${computedBiometrics.whrStatus})
  • BMR: ${computedBiometrics.bmr} kkal | TDEE: ${computedBiometrics.tdee} kkal
  • Target Kalori Harian: ${computedBiometrics.targetCalories} kkal/hari
  • Target Makronutrien: Protein ${computedBiometrics.proteinGrams}g, Karbohidrat ${computedBiometrics.carbGrams}g, Lemak ${computedBiometrics.fatGrams}g`
        : '';

      const chatPrompt = `Kamu adalah "NutriCoach AI", konsultan gizi klinis dan pelatih kebugaran di aplikasi NutriFit AI Indonesia.
Jawablah pertanyaan pengguna secara akurat dan personal berdasarkan data biometrik berikut:
- Nama: ${rawInput.name} (${rawInput.gender === 'male' ? 'Pria' : 'Wanita'}, ${rawInput.age} tahun)
- Tinggi / Berat: ${rawInput.heightCm} cm / ${rawInput.weightKg} kg
- Lingkar Pinggang / Pinggul / Leher: ${rawInput.waistCm} cm / ${rawInput.hipCm} cm / ${rawInput.neckCm} cm
- Aktivitas: ${rawInput.activityLevel} | Tujuan: ${rawInput.goal} | Budget: ${rawInput.budgetTier} | Tidur: ${rawInput.sleepHours} jam
${bioSummary}

Riwayat Percakapan:
${historyTranscript}

Pertanyaan Pengguna Saat Ini:
"${cleanQuestion}"

ATURAN FORMAT OUTPUT WAJIB AGAR MUDAH DIBACA:
1. Gunakan subjudul diawali "### " (misal: "### Analisis & Rekomendasi Gizi").
2. Jika menyajikan daftar makanan pengganti, pembagian porsi, perbandingan nutrisi, atau jadwal latihan, WAJIB sajikan dalam **Tabel Markdown** standar:
   | Kolom 1 | Kolom 2 | Kolom 3 | Kolom 4 |
   | :--- | :--- | :--- | :--- |
3. Jika menampilkan rumus atau langkah perhitungan matematika, WAJIB tulis dalam baris khusus diawali "> RUMUS: " dengan operator matematika bersih (×, ÷, +, -, =), tanpa simbol LaTeX ($ atau \\frac).
4. Berikan poin-poin ("- ") yang jelas dan langsung menjawab inti pertanyaan pengguna.`;

      const replyText = await callGeminiModel(apiKey, chatPrompt, false);

      return NextResponse.json({
        reply: replyText,
      });
    }

    return NextResponse.json({ error: 'Mode tidak valid.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Gemini AI Engine Error:', error);
    const msg =
      error instanceof Error
        ? error.message
        : 'Gagal memproses perhitungan AI.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}