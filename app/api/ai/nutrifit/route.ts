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

const DAYS_OF_WEEK = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
] as const;

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
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
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return stripped.slice(firstBrace, lastBrace + 1);
  }
  return stripped;
}

async function callGeminiModel(
  apiKey: string,
  prompt: string,
  expectJson: boolean
): Promise<string> {
  const cleanKey = sanitizeKey(apiKey);
  if (!cleanKey || cleanKey.includes('MASUKKAN_GEMINI_API_KEY')) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi.');
  }

  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  let lastError = 'Gagal menghubungi server AI Gemini.';

  for (const modelName of models) {
    try {
      const endpoint =
        '[https://generativelanguage.googleapis.com/v1beta/models/](https://generativelanguage.googleapis.com/v1beta/models/)' +
        encodeURIComponent(modelName.trim()) +
        ':generateContent?key=' +
        encodeURIComponent(cleanKey);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
          generationConfig: expectJson
            ? {
                temperature: 0.3,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
              }
            : {
                temperature: 0.55,
                maxOutputTokens: 4096,
              },
        }),
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (res.ok && text) {
        return text;
      }

      lastError =
        data?.error?.message ||
        'Model ' + modelName + ' mengembalikan status ' + String(res.status);
    } catch (err: unknown) {
      lastError =
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke model ' + modelName;
    }
  }

  throw new Error(lastError);
}

function buildCompleteClinicalProgram(
  rawInput: RawUserBiometricInput,
  customPreference?: string
): Omit<AiGeneratedProgram, 'generatedAt'> {
  const heightM = Math.max(rawInput.heightCm, 100) / 100;
  const weightKg = Math.max(rawInput.weightKg, 25);
  const waistCm = Math.max(rawInput.waistCm, 45);
  const hipCm = Math.max(rawInput.hipCm, 55);
  const neckCm = Math.max(rawInput.neckCm, 25);
  const age = Math.max(rawInput.age, 12);

  const bmi = +(weightKg / (heightM * heightM)).toFixed(1);
  const idealWeightMinKg = +(18.5 * heightM * heightM).toFixed(1);
  const idealWeightMaxKg = +(22.9 * heightM * heightM).toFixed(1);
  const idealWeightMidKg = +(
    (idealWeightMinKg + idealWeightMaxKg) /
    2
  ).toFixed(1);
  const weightDiffKg = +Math.abs(weightKg - idealWeightMidKg).toFixed(1);

  let bmiCategory = 'Normal Ideal (WHO Asia-Pasifik)';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight / Kurang Berat Badan (WHO Asia-Pasifik)';
  } else if (bmi <= 22.9) {
    bmiCategory = 'Normal Ideal (WHO Asia-Pasifik)';
  } else if (bmi <= 24.9) {
    bmiCategory = 'Overweight / Berisiko (WHO Asia-Pasifik)';
  } else if (bmi <= 29.9) {
    bmiCategory = 'Obesitas Tingkat I (WHO Asia-Pasifik)';
  } else {
    bmiCategory = 'Obesitas Tingkat II (WHO Asia-Pasifik)';
  }

  let weightAdvice =
    'Berat badan Anda sudah berada di rentang ideal Asia-Pasifik. Fokuskan pada pemeliharaan massa otot dan kebugaran kardiovaskular.';
  if (weightKg > idealWeightMaxKg) {
    const excessKg = +(weightKg - idealWeightMaxKg).toFixed(1);
    weightAdvice =
      'Anda memiliki kelebihan sekitar ' +
      excessKg +
      ' kg dari batas atas ideal (' +
      idealWeightMaxKg +
      ' kg). Disarankan defisit kalori terukur 400 kkal/hari dengan diet tinggi protein.';
  } else if (weightKg < idealWeightMinKg) {
    const deficitKg = +(idealWeightMinKg - weightKg).toFixed(1);
    weightAdvice =
      'Anda membutuhkan tambahan sekitar ' +
      deficitKg +
      ' kg untuk mencapai batas bawah ideal (' +
      idealWeightMinKg +
      ' kg). Fokus pada surplus kalori bersih dan latihan beban progresif.';
  }

  let rawBodyFat = 22.0;
  if (rawInput.gender === 'male') {
    const diff = Math.max(waistCm - neckCm, 12);
    rawBodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(diff) +
          0.15456 * Math.log10(rawInput.heightCm)) -
      450;
  } else {
    const sum = Math.max(waistCm + hipCm - neckCm, 35);
    rawBodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(sum) +
          0.221 * Math.log10(rawInput.heightCm)) -
      450;
  }
  const bodyFatPercentage = +Math.min(Math.max(rawBodyFat, 6.5), 52.0).toFixed(
    1
  );
  const fatMassKg = +((weightKg * bodyFatPercentage) / 100).toFixed(1);
  const leanMassKg = +(weightKg - fatMassKg).toFixed(1);

  const whr = +(waistCm / hipCm).toFixed(2);
  const whrThreshold = rawInput.gender === 'male' ? 0.9 : 0.85;
  const whrStatus =
    whr <= whrThreshold
      ? 'Risiko Viseral Rendah (Aman)'
      : 'Risiko Lemak Viseral Meningkat';

  const genderOffset = rawInput.gender === 'male' ? 5 : -161;
  const bmr = Math.round(
    10 * weightKg + 6.25 * rawInput.heightCm - 5 * age + genderOffset
  );

  const activityMap: Record<RawUserBiometricInput['activityLevel'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  const actFactor = activityMap[rawInput.activityLevel] || 1.375;
  const tdee = Math.round(bmr * actFactor);

  let rawTargetCalories = tdee;
  if (rawInput.goal === 'fat_loss') {
    rawTargetCalories = tdee - 400;
  } else if (rawInput.goal === 'muscle_gain') {
    rawTargetCalories = tdee + 300;
  }

  const bmrGuardTriggered =
    rawInput.goal === 'fat_loss' && rawTargetCalories < bmr;
  const targetCalories = bmrGuardTriggered ? bmr : rawTargetCalories;

  const bmrGuardExplanation = bmrGuardTriggered
    ? 'BMR Guard Aktif: Defisit 400 kkal dari TDEE (' +
      rawTargetCalories +
      ' kkal) berada di bawah BMR organ vital Anda (' +
      bmr +
      ' kkal). Target kalori dikunci otomatis pada batas aman BMR (' +
      bmr +
      ' kkal) untuk mencegah penyusutan otot dan perlambatan metabolisme.'
    : 'BMR Guard Aman: Target kalori harian Anda (' +
      targetCalories +
      ' kkal) berada di atas kebutuhan basal organ vital (' +
      bmr +
      ' kkal), sehingga pembakaran lemak dan pemulihan sel berjalan optimal.';

  const proteinMultiplier =
    rawInput.goal === 'muscle_gain'
      ? 2.0
      : rawInput.goal === 'fat_loss'
        ? 1.8
        : 1.6;
  const proteinGrams = Math.round(
    Math.min(Math.max(weightKg * proteinMultiplier, 65), 210)
  );
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const remainingKcal = Math.max(
    targetCalories - proteinGrams * 4 - fatGrams * 9,
    200
  );
  const carbGrams = Math.round(remainingKcal / 4);

  const waterLiters = +(Math.max(weightKg * 0.035, 1.8)).toFixed(1);
  const sleepAssessment =
    rawInput.sleepHours >= 7 && rawInput.sleepHours <= 9
      ? 'Durasi tidur ' +
        rawInput.sleepHours +
        ' jam/malam sudah optimal untuk menekan hormon kortisol dan menjaga sensitivitas leptin.'
      : rawInput.sleepHours < 7
        ? 'Tidur ' +
          rawInput.sleepHours +
          ' jam/malam kurang dari standar klinis (7-8 jam). Kurang tidur memicu lonjakan hormon ghrelin (lapar) dan menghambat pemulihan otot.'
        : 'Durasi tidur ' +
          rawInput.sleepHours +
          ' jam/malam cukup panjang; pastikan kualitas tidur nyenyak dan jadwal bangun pagi tetap konsisten.';

  const formulaBreakdown: AiFormulaStep[] = [
    {
      parameter: '1. BMI & Berat Ideal (WHO Asia-Pasifik)',
      formulaName: 'Quetelet Index & Rentang Normal 18,5–22,9 kg/m²',
      equation: 'BMI = BB (kg) ÷ [TB (m)]²',
      substitution:
        weightKg + ' ÷ (' + heightM.toFixed(2) + ' × ' + heightM.toFixed(2) + ')',
      result:
        bmi +
        ' kg/m² (Ideal: ' +
        idealWeightMinKg +
        ' – ' +
        idealWeightMaxKg +
        ' kg)',
    },
    {
      parameter: '2. Persentase Lemak Tubuh & Massa Otot',
      formulaName: 'Metode Anthropometri US Navy',
      equation:
        rawInput.gender === 'male'
          ? '%BF = 495 ÷ [1,0324 - 0,19077×log10(Pinggang-Leher) + 0,15456×log10(Tinggi)] - 450'
          : '%BF = 495 ÷ [1,29579 - 0,35004×log10(Pinggang+Pinggul-Leher) + 0,22100×log10(Tinggi)] - 450',
      substitution:
        'Pinggang ' +
        waistCm +
        ' cm, Pinggul ' +
        hipCm +
        ' cm, Leher ' +
        neckCm +
        ' cm, Tinggi ' +
        rawInput.heightCm +
        ' cm',
      result:
        bodyFatPercentage +
        '% Lemak (' +
        fatMassKg +
        ' kg) • Massa Bebas Lemak: ' +
        leanMassKg +
        ' kg',
    },
    {
      parameter: '3. Rasio Lingkar Pinggang-Pinggul (WHR)',
      formulaName: 'Waist-to-Hip Visceral Ratio',
      equation: 'WHR = Lingkar Pinggang (cm) ÷ Lingkar Pinggul (cm)',
      substitution: waistCm + ' ÷ ' + hipCm,
      result: whr + ' (' + whrStatus + ')',
    },
    {
      parameter: '4. Basal Metabolic Rate (BMR)',
      formulaName: 'Persamaan Klinis Mifflin-St Jeor',
      equation:
        'BMR = (10 × BB) + (6,25 × TB) - (5 × Usia) ' +
        (rawInput.gender === 'male' ? '+ 5' : '- 161'),
      substitution:
        '(10 × ' +
        weightKg +
        ') + (6,25 × ' +
        rawInput.heightCm +
        ') - (5 × ' +
        age +
        ') ' +
        (rawInput.gender === 'male' ? '+ 5' : '- 161'),
      result: bmr.toLocaleString('id-ID') + ' kkal/hari',
    },
    {
      parameter: '5. TDEE, Target Kalori & Distribusi Makronutrien',
      formulaName: 'TDEE Multi-Factor + BMR Guard',
      equation: 'TDEE = BMR × Faktor Aktivitas (' + actFactor + ')',
      substitution:
        bmr +
        ' × ' +
        actFactor +
        ' = ' +
        tdee +
        ' kkal → Target: ' +
        targetCalories +
        ' kkal',
      result:
        targetCalories +
        ' kkal/hari (P: ' +
        proteinGrams +
        'g, K: ' +
        carbGrams +
        'g, L: ' +
        fatGrams +
        'g)',
    },
  ];

  const bKcal = Math.round(targetCalories * 0.25);
  const lKcal = Math.round(targetCalories * 0.35);
  const sKcal = Math.round(targetCalories * 0.15);
  const dKcal = targetCalories - (bKcal + lKcal + sKcal);

  const bProt = Math.round(proteinGrams * 0.25);
  const lProt = Math.round(proteinGrams * 0.35);
  const sProt = Math.round(proteinGrams * 0.15);
  const dProt = proteinGrams - (bProt + lProt + sProt);

  const costMap: Record<RawUserBiometricInput['budgetTier'], string> = {
    hemat: 'Rp32.000',
    seimbang: 'Rp58.000',
    fleksibel: 'Rp95.000',
  };
  const costLabel = costMap[rawInput.budgetTier] || 'Rp50.000';
  const prefNote = customPreference?.trim()
    ? ' (Disesuaikan preferensi: ' + customPreference.trim() + ')'
    : '';

  const dailyMenus: {
    day: string;
    tip: string;
    breakfast: [string, string];
    lunch: [string, string];
    snack: [string, string];
    dinner: [string, string];
  }[] = [
    {
      day: 'Senin',
      tip: 'Awali pekan dengan hidrasi 500 ml air putih hangat saat bangun tidur dan prioritaskan protein sarapan.',
      breakfast: [
        'Nasi Merah + Orak-Arik Telur & Tempe Kukus' + prefNote,
        '100g nasi merah, 2 butir telur ayam utuh, 50g tempe kukus, irisan tomat & timun segar',
      ],
      lunch: [
        'Ayam Bakar Bumbu Kuning + Sayur Bening Bayam',
        '150g dada ayam bakar tanpa kulit, 120g nasi putih/merah, 1 mangkuk bening bayam jagung',
      ],
      snack: [
        'Edamame Rebus & Pisang Ambon',
        '100g edamame rebus hangat dan 1 buah pisang ambon ukuran sedang',
      ],
      dinner: [
        'Pepes Ikan Kembung + Tumis Buncis Wortel',
        '140g ikan kembung pepes kemangi, 100g kentang rebus/nasi merah, 100g tumis buncis sedikit minyak',
      ],
    },
    {
      day: 'Selasa',
      tip: 'Konsumsi sayuran hijau terlebih dahulu sebelum karbohidrat utama untuk menjaga kestabilan gula darah.',
      breakfast: [
        'Oatmeal Gurih Kaldu Ayam & Telur Rebus' + prefNote,
        '60g rolled oat dimasak kaldu ayam, 2 butir telur rebus, taburan daun bawang & seledri',
      ],
      lunch: [
        'Soto Ayam Kuah Bening (Tanpa Santan) + Tahu Bacem',
        '150g suwiran dada ayam kampung, 120g nasi hangat, 1 potong tahu, tauge & kol segar',
      ],
      snack: [
        'Tahu Kukus Isi Ayam & Buah Pepaya',
        '2 buah tahu kukus isi cincangan dada ayam dan 150g pepaya potong dingin',
      ],
      dinner: [
        'Ikan Nila Panggang Kecap + Capcay Kuah Sayur',
        '150g ikan nila panggang, 100g nasi merah, 150g capcay sawi, brokoli, dan jamur kuping',
      ],
    },
    {
      day: 'Rabu',
      tip: 'Pertengahan minggu adalah waktu ideal mencukupi asupan serat larut untuk mendukung mikrobiota pencernaan.',
      breakfast: [
        'Roti Gandum Utuh + Omelet Jamur & Dada Ayam' + prefNote,
        '2 lembar roti gandum panggang, 2 telur omelet isi jamur kancing & 40g suwiran ayam',
      ],
      lunch: [
        'Gado-Gado Siram Bumbu Kacang Sangrai + Telur & Tempe',
        '120g lontong/nasi, 100g tempe & tahu panggang, 2 butir telur rebus, sayuran rebus lengkap',
      ],
      snack: [
        'Yogurt Plain Rendah Lemak & Potongan Apel',
        '120g Greek/plain yogurt ditambah 1 buah apel potong dadu & sedikit kayu manis',
      ],
      dinner: [
        'Sup Dada Ayam Kentang Wortel & Buncis',
        '150g dada ayam potong dadu dalam sup bening bersama 120g kentang, wortel, dan tomat',
      ],
    },
    {
      day: 'Kamis',
      tip: 'Jaga jeda makan malam minimal 2,5 hingga 3 jam sebelum waktu tidur agar kualitas pemulihan hormon optimal.',
      breakfast: [
        'Bubur Manado (Tinutuan) + Ikan Cakalang Suwir & Telur' + prefNote,
        '1 mangkuk bubur beras merah labu kuning, bayam, kangkung, 60g cakalang suwir & 1 telur rebus',
      ],
      lunch: [
        'Semur Daging Sapi Tanpa Lemak + Tumis Kangkung',
        '130g daging sapi has dalam iris tipis, 120g nasi hangat, 100g tumis kangkung bawang putih',
      ],
      snack: [
        'Kacang Hijau Rebus Kurang Gula & Telur Rebus',
        '1 mangkuk kecil kacang hijau rebus jahe hangat dan 1 butir putih telur rebus',
      ],
      dinner: [
        'Tahu Telur Panggang Teflon + Sayur Asem Segar',
        '2 butir telur & 100g tahu dimasak teflon minim minyak, 80g nasi merah, 1 mangkuk sayur asem',
      ],
    },
    {
      day: 'Jumat',
      tip: 'Perbanyak asupan kalium dan magnesium alami dari pangan lokal untuk meredakan kelelahan otot.',
      breakfast: [
        'Nasi Uduk Beras Merah + Ayam Suwir & Tempe Oregano' + prefNote,
        '100g nasi merah rempah serai daun salam, 100g dada ayam suwir, 50g tempe panggang, lalapan',
      ],
      lunch: [
        'Ikan Patin Kuah Pindang Kuning + Lalapan Kemangi',
        '150g ikan patin kuah pindang nanas kunyit segar, 120g nasi putih/merah, timun & kemangi',
      ],
      snack: [
        'Ubi Cilembu Kukus & Susu Kedelai Tanpa Gula',
        '100g ubi kukus hangat dan 200 ml susu kedelai murni tinggi protein nabati',
      ],
      dinner: [
        'Tumis Dada Ayam Brokoli Bawang Putih + Nasi Merah',
        '150g dada ayam fillet tumis saus tiram rendah natrium, 120g kuntum brokoli, 90g nasi merah',
      ],
    },
    {
      day: 'Sabtu',
      tip: 'Manfaatkan akhir pekan untuk menyiapkan bahan makanan segar (meal prep) agar konsistensi terjaga.',
      breakfast: [
        'Pancake Pisang Oat + Telur Orak-Arik' + prefNote,
        '50g oat + 1 pisang dihaluskan & dipanggang teflon, didampingi 2 butir telur orak-arik',
      ],
      lunch: [
        'Pecel Madiun Sayur Lengkap + Dada Ayam Ungkep Panggang',
        '150g dada ayam ungkep panggang teflon, 120g nasi merah, bayam, kenikir, tauge & bumbu pecel',
      ],
      snack: [
        'Puding Chia Susu Rendah Lemak & Buah Naga',
        '2 sdm chia seed direndam 150 ml susu low-fat ditambah 100g potongan buah naga merah',
      ],
      dinner: [
        'Ikan Tongkol Suwir Cabai Hijau + Sayur Lodeh Kuah Encer',
        '140g ikan tongkol kukus tumis cabai hijau tomat, 90g nasi hangat, 1 mangkuk sayur labu siam',
      ],
    },
    {
      day: 'Minggu',
      tip:
        'Tetap jaga asupan air putih ' +
        waterLiters +
        ' liter hari ini dan nikmati makanan dengan kesadaran penuh (mindful eating).',
      breakfast: [
        'Kentang Wedges Panggang + Telur Mata Sapi & Alpukat' + prefNote,
        '150g kentang rebus/panggang rempah, 2 butir telur mata sapi teflon, 50g irisan alpukat',
      ],
      lunch: [
        'Sop Buntut / Daging Sapi Bening + Wortel Kentang & Nasi',
        '140g daging sapi tanpa lemak kuah kaldu bening rempah pala, 120g nasi, wortel & daun bawang',
      ],
      snack: [
        'Jagung Manis Rebus & Tempe Kukus Bumbu Bawang',
        '1 bonggol sedang jagung manis rebus dan 60g tempe kukus hangat',
      ],
      dinner: [
        'Steak Tempe & Dada Ayam Cincang + Salad Sayur Nusantara',
        '130g campuran dada ayam & tempe cincang panggang, 100g jagung-wortel-buncis rebus',
      ],
    },
  ];

  const weeklyMeals: AiDayMealPlan[] = dailyMenus.map((item) => ({
    day: item.day,
    costEstimate: costLabel,
    dailyTip: item.tip,
    meals: [
      {
        time: 'Sarapan (07.00)',
        title: item.breakfast[0],
        portionDesc: item.breakfast[1],
        kcalShare: bKcal,
        proteinGrams: bProt,
      },
      {
        time: 'Makan Siang (12.30)',
        title: item.lunch[0],
        portionDesc: item.lunch[1],
        kcalShare: lKcal,
        proteinGrams: lProt,
      },
      {
        time: 'Camilan Sore (16.00)',
        title: item.snack[0],
        portionDesc: item.snack[1],
        kcalShare: sKcal,
        proteinGrams: sProt,
      },
      {
        time: 'Makan Malam (19.30)',
        title: item.dinner[0],
        portionDesc: item.dinner[1],
        kcalShare: dKcal,
        proteinGrams: dProt,
      },
    ],
  }));

  const weeklyWorkouts: AiDayWorkout[] = [
    {
      day: 'Senin',
      focus:
        rawInput.goal === 'muscle_gain'
          ? 'Upper Body Strength & Hypertrophy'
          : 'Full Body Metabolic Conditioning',
      duration: '40 Menit',
      intensity: 'Moderat',
      isRest: false,
      exercises: [
        'Pemanasan Dinamis Sendi Bahu & Pinggul — 5 menit',
        'Push-Up (atau Knee Push-Up) — 4 set × 10–12 repetisi',
        'Bodyweight Squat / Goblet Squat — 4 set × 12–15 repetisi',
        'Plank Inti Perut (Core Hold) — 3 set × 45 detik',
      ],
    },
    {
      day: 'Selasa',
      focus: 'Kardio Zona 2 Pembakaran Lemak & Mobilitas',
      duration: '35 Menit',
      intensity: 'Ringan–Moderat',
      isRest: false,
      exercises: [
        'Jalan Cepat (Brisk Walk) atau Jogging Ringan — 25 menit konstan',
        'Jumping Jacks Terkontrol — 3 set × 40 detik',
        'Peregangan Hamstring & Punggung Bawah — 5 menit',
      ],
    },
    {
      day: 'Rabu',
      focus: 'Lower Body & Core Stability',
      duration: '40 Menit',
      intensity: 'Moderat',
      isRest: false,
      exercises: [
        'Forward / Reverse Lunges — 3 set × 10 repetisi per kaki',
        'Glute Bridge (Penguatan Pinggul) — 4 set × 15 repetisi',
        'Calf Raises — 3 set × 20 repetisi',
        'Mountain Climbers — 3 set × 30 detik',
      ],
    },
    {
      day: 'Kamis',
      focus: 'Istirahat Aktif & Pemulihan Jaringan Otot (Active Recovery)',
      duration: '20 Menit',
      intensity: 'Ringan',
      isRest: true,
      exercises: [
        'Jalan Santai Sore (Target 5.000–6.000 langkah) — 15 menit',
        'Cat-Cow & Thoracic Spine Mobility — 2 set × 10 gerakan',
        'Latihan Pernapasan Diafragma Relaksasi — 5 menit',
      ],
    },
    {
      day: 'Jumat',
      focus:
        rawInput.goal === 'fat_loss'
          ? 'HIIT Kardio & Pembakaran Kalori Maksimal'
          : 'Upper Body Pull, Push & Postural Control',
      duration: '40 Menit',
      intensity: 'Moderat–Tinggi',
      isRest: false,
      exercises: [
        'Incline Push-Up / Pike Push-Up — 3 set × 12 repetisi',
        'Superman Back Extension (Postur Punggung) — 3 set × 15 repetisi',
        'Squat Thrust / Burpees Tanpa Lompat — 3 set × 10 repetisi',
        'Side Plank — 3 set × 30 detik per sisi',
      ],
    },
    {
      day: 'Sabtu',
      focus: 'Endurance Kardio & Fleksibilitas Seluruh Tubuh',
      duration: '45 Menit',
      intensity: 'Moderat',
      isRest: false,
      exercises: [
        'Bersepeda, Berenang, atau Jogging Outdoor — 30 menit',
        'Wall Sit (Ketahanan Otot Paha) — 3 set × 40 detik',
        'Bicycle Crunches — 3 set × 16 repetisi',
        'Pendinginan & Foam Rolling — 5 menit',
      ],
    },
    {
      day: 'Minggu',
      focus: 'Full Rest & Pemulihan Sistem Saraf Pusat',
      duration: '15 Menit',
      intensity: 'Pemulihan',
      isRest: true,
      exercises: [
        'Peregangan Statis Ringan Pagi Hari — 10 menit',
        'Evaluasi Berat Badan & Lingkar Pinggang Mingguan',
        'Tidur Malam Lebih Awal (Target 7–8 Jam Penuh)',
      ],
    },
  ];

  const aiSummaryNote =
    'Berdasarkan analisis antropometri untuk ' +
    rawInput.name +
    ' (' +
    rawInput.heightCm +
    ' cm, ' +
    weightKg +
    ' kg), indeks massa tubuh berada pada ' +
    bmi +
    ' kg/m² (' +
    bmiCategory +
    ') dengan estimasi lemak tubuh US Navy sebesar ' +
    bodyFatPercentage +
    '%. Kebutuhan kalori harian ditetapkan pada ' +
    targetCalories.toLocaleString('id-ID') +
    ' kkal/hari dengan target protein ' +
    proteinGrams +
    ' gram/hari guna mencapai tujuan ' +
    rawInput.goal.replace('_', ' ') +
    ' secara aman.';

  return {
    aiSummaryNote,
    biometrics: {
      idealWeightMinKg,
      idealWeightMaxKg,
      idealWeightMidKg,
      weightDiffKg,
      weightAdvice,
      bmi,
      bmiCategory,
      bodyFatPercentage,
      fatMassKg,
      leanMassKg,
      whr,
      whrStatus,
      bmr,
      tdee,
      targetCalories,
      bmrGuardTriggered,
      bmrGuardExplanation,
      proteinGrams,
      carbGrams,
      fatGrams,
      waterLiters,
      sleepAssessment,
    },
    formulaBreakdown,
    weeklyMeals,
    weeklyWorkouts,
  };
}

function ensureSevenDaysComplete(
  candidate: Partial<Omit<AiGeneratedProgram, 'generatedAt'>>,
  fallback: Omit<AiGeneratedProgram, 'generatedAt'>
): Omit<AiGeneratedProgram, 'generatedAt'> {
  const rawMeals = Array.isArray(candidate.weeklyMeals)
    ? candidate.weeklyMeals
    : [];
  const rawWorkouts = Array.isArray(candidate.weeklyWorkouts)
    ? candidate.weeklyWorkouts
    : [];

  const normalizedMeals: AiDayMealPlan[] = DAYS_OF_WEEK.map((dayName, idx) => {
    const matched =
      rawMeals.find(
        (m) =>
          typeof m?.day === 'string' &&
          m.day.toLowerCase().includes(dayName.toLowerCase())
      ) || rawMeals[idx];

    if (
      matched &&
      Array.isArray(matched.meals) &&
      matched.meals.length >= 3
    ) {
      return {
        day: dayName,
        costEstimate:
          matched.costEstimate || fallback.weeklyMeals[idx].costEstimate,
        dailyTip: matched.dailyTip || fallback.weeklyMeals[idx].dailyTip,
        meals: matched.meals,
      };
    }
    return fallback.weeklyMeals[idx];
  });

  const normalizedWorkouts: AiDayWorkout[] = DAYS_OF_WEEK.map(
    (dayName, idx) => {
      const matched =
        rawWorkouts.find(
          (w) =>
            typeof w?.day === 'string' &&
            w.day.toLowerCase().includes(dayName.toLowerCase())
        ) || rawWorkouts[idx];

      if (
        matched &&
        Array.isArray(matched.exercises) &&
        matched.exercises.length >= 2
      ) {
        return {
          day: dayName,
          focus: matched.focus || fallback.weeklyWorkouts[idx].focus,
          duration: matched.duration || fallback.weeklyWorkouts[idx].duration,
          intensity:
            matched.intensity || fallback.weeklyWorkouts[idx].intensity,
          isRest:
            typeof matched.isRest === 'boolean'
              ? matched.isRest
              : fallback.weeklyWorkouts[idx].isRest,
          exercises: matched.exercises,
        };
      }
      return fallback.weeklyWorkouts[idx];
    }
  );

  const validFormulas =
    Array.isArray(candidate.formulaBreakdown) &&
    candidate.formulaBreakdown.length >= 4
      ? candidate.formulaBreakdown
      : fallback.formulaBreakdown;

  return {
    aiSummaryNote: candidate.aiSummaryNote || fallback.aiSummaryNote,
    biometrics: {
      ...fallback.biometrics,
      ...(candidate.biometrics || {}),
    },
    formulaBreakdown: validFormulas,
    weeklyMeals: normalizedMeals,
    weeklyWorkouts: normalizedWorkouts,
  };
}

function buildFallbackChatReply(
  rawInput: RawUserBiometricInput,
  bio: AiComputedBiometrics,
  userMessage: string
): string {
  return [
    '### Analisis & Rekomendasi Gizi Personal (' + rawInput.name + ')',
    '- Berdasarkan data biometrik Anda (**' +
      rawInput.heightCm +
      ' cm / ' +
      rawInput.weightKg +
      ' kg**), batas aman konsumsi harian Anda adalah **' +
      bio.targetCalories.toLocaleString('id-ID') +
      ' kkal/hari** dengan target protein **' +
      bio.proteinGrams +
      ' gram/hari**.',
    '- Untuk menjawab pertanyaan Anda mengenai *"' +
      userMessage +
      '"*, prioritaskan sumber pangan utuh tinggi protein dan serat agar rasa kenyang bertahan lebih lama serta massa otot (**' +
      bio.leanMassKg +
      ' kg**) tetap terlindungi.',
    '',
    '> RUMUS: Target Kalori Harian = ' +
      bio.targetCalories +
      ' kkal = (Protein ' +
      bio.proteinGrams +
      'g × 4) + (Karbohidrat ' +
      bio.carbGrams +
      'g × 4) + (Lemak ' +
      bio.fatGrams +
      'g × 9)',
    '',
    '### Tabel Rekomendasi Pangan & Substitusi Setara',
    '| Waktu Makan | Pilihan Utama | Alternatif Penukar | Estimasi Nutrisi |',
    '| :--- | :--- | :--- | :--- |',
    '| Sarapan (07.00) | 100g Nasi Merah + 2 Telur Rebus | 60g Oatmeal + 2 Telur Orak-Arik | ±' +
      Math.round(bio.targetCalories * 0.25) +
      ' kkal / ' +
      Math.round(bio.proteinGrams * 0.25) +
      'g P |',
    '| Makan Siang (12.30) | 150g Dada Ayam Bakar + Sayur Bening | 150g Ikan Kembung Pepes + Capcay | ±' +
      Math.round(bio.targetCalories * 0.35) +
      ' kkal / ' +
      Math.round(bio.proteinGrams * 0.35) +
      'g P |',
    '| Camilan Sore (16.00) | 100g Edamame Rebus + 1 Pisang | 2 Tahu Kukus + 120g Yogurt Plain | ±' +
      Math.round(bio.targetCalories * 0.15) +
      ' kkal / ' +
      Math.round(bio.proteinGrams * 0.15) +
      'g P |',
    '| Makan Malam (19.30) | 140g Ikan Nila Panggang + Tumis Buncis | 130g Daging Sapi Tanpa Lemak + Sop Sayur | ±' +
      Math.round(bio.targetCalories * 0.25) +
      ' kkal / ' +
      Math.round(bio.proteinGrams * 0.25) +
      'g P |',
    '',
    '### Panduan Praktis Harian',
    '- Pastikan target hidrasi **' +
      bio.waterLiters +
      ' liter/hari** terpenuhi secara bertahap sejak bangun pagi.',
    '- Pertahankan waktu tidur malam minimal **7–8 jam** untuk menekan hormon kortisol dan mengoptimalkan pembakaran lemak tubuh (**' +
      bio.bodyFatPercentage +
      '%**).',
  ].join('\n');
}

export async function POST(request: Request) {
  try {
    const apiKey = sanitizeKey(process.env.GEMINI_API_KEY);
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

      const generatedAt = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const analysisPrompt = `Kamu adalah Sistem Komputasi Klinis Anthropometri, Ahli Gizi Klinis, dan Pelatih Fisik di NutriFit AI Indonesia.
Hitung secara akurat seluruh parameter biometrik, langkah rumus matematis, serta susun program menu lokal & jadwal latihan 7 hari penuh (Senin–Minggu) dari data mentah pengguna berikut:
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
6. Susun 7 HARI PENUH rencana makan di dalam array "weeklyMeals" (WAJIB berisi 7 objek berurutan: "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"; masing-masing 4 waktu makan: Sarapan (07.00), Makan Siang (12.30), Camilan Sore (16.00), Makan Malam (19.30)) yang mematuhi preferensi pengguna dan sesuai anggaran.
7. Susun 7 HARI PENUH jadwal olahraga di dalam array "weeklyWorkouts" (WAJIB berisi 7 objek berurutan: "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu") yang sesuai tujuan pengguna.

Kembalikan HANYA objek JSON valid dengan nama properti persis seperti skema berikut (pastikan weeklyMeals dan weeklyWorkouts memuat lengkap 7 hari dari Senin sampai Minggu):
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
      "dailyTip": "Tips nutrisi spesifik hari tersebut",
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

      try {
        // PRIORITAS 1: Dihitung murni oleh Gemini AI
        const rawAiText = await callGeminiModel(apiKey, analysisPrompt, true);
        const cleanedJson = cleanJsonString(rawAiText);
        const parsed = JSON.parse(cleanedJson) as Partial<
          Omit<AiGeneratedProgram, 'generatedAt'>
        >;

        if (!parsed?.biometrics) {
          throw new Error('Respons AI tidak memiliki objek biometrics.');
        }

        const fallbackProgram = buildCompleteClinicalProgram(
          rawInput,
          customPreference
        );
        const verifiedProgram = ensureSevenDaysComplete(
          parsed,
          fallbackProgram
        );

        return NextResponse.json({
          ...verifiedProgram,
          generatedAt,
        });
      } catch (aiErr: unknown) {
        // PRIORITAS 2 (FALLBACK): Hanya dieksekusi jika Gemini AI gagal/error
        console.warn(
          'Gemini AI gagal merespons, mengeksekusi perhitungan fallback klinis:',
          aiErr
        );
        const fallbackProgram = buildCompleteClinicalProgram(
          rawInput,
          customPreference
        );
        return NextResponse.json({
          ...fallbackProgram,
          generatedAt,
        });
      }
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
            (m.role === 'user' ? 'Pengguna' : 'NutriCoach AI') +
            ': ' +
            m.content
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

      try {
        // PRIORITAS 1: Dijawab murni oleh Gemini AI
        const replyText = await callGeminiModel(apiKey, chatPrompt, false);
        return NextResponse.json({ reply: replyText });
      } catch (chatErr: unknown) {
        // PRIORITAS 2 (FALLBACK): Hanya dieksekusi jika Gemini AI gagal/error
        console.warn(
          'Gemini Chat AI gagal merespons, menggunakan respons fallback:',
          chatErr
        );
        const fallbackBio =
          computedBiometrics ||
          buildCompleteClinicalProgram(rawInput, customPreference).biometrics;
        return NextResponse.json({
          reply: buildFallbackChatReply(rawInput, fallbackBio, cleanQuestion),
        });
      }
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