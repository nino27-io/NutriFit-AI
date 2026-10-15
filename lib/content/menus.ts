export type MealTime = 'Sarapan' | 'Makan Siang' | 'Makan Malam' | 'Camilan';

export interface MealOption {
  id: string;
  mealTime: MealTime;
  name: string;
  calories: number;
  priceIdr: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DailyMealPlanResult {
  items: Record<MealTime, MealOption>;
  totalCalories: number;
  totalPriceIdr: number;
  isBudgetSufficient: boolean;
  minimumPossibleBudgetIdr: number;
  budgetNote: string;
}

export const INDONESIAN_MEAL_OPTIONS: MealOption[] = [
  // SARAPAN (5 Pilihan)
  {
    id: 'srp-1',
    mealTime: 'Sarapan',
    name: 'Bubur Kacang Hijau + 1 Telur Rebus',
    calories: 340,
    priceIdr: 8000,
    proteinG: 14,
    carbsG: 48,
    fatG: 9,
  },
  {
    id: 'srp-2',
    mealTime: 'Sarapan',
    name: 'Nasi Kuning Porsi Kecil + Telur Balado + Timun',
    calories: 420,
    priceIdr: 10000,
    proteinG: 13,
    carbsG: 56,
    fatG: 15,
  },
  {
    id: 'srp-3',
    mealTime: 'Sarapan',
    name: 'Oatmeal 5 Sdm + Pisang Ambon + Telur Dadar Tipis',
    calories: 390,
    priceIdr: 12000,
    proteinG: 16,
    carbsG: 54,
    fatG: 11,
  },
  {
    id: 'srp-4',
    mealTime: 'Sarapan',
    name: 'Roti Gandum 2 Lembar + Orak-Arik 2 Telur + Tomat',
    calories: 440,
    priceIdr: 15000,
    proteinG: 20,
    carbsG: 42,
    fatG: 18,
  },
  {
    id: 'srp-5',
    mealTime: 'Sarapan',
    name: 'Nasi Uduk + Ayam Suwir Panggang + Tempe Orek',
    calories: 560,
    priceIdr: 18000,
    proteinG: 26,
    carbsG: 68,
    fatG: 19,
  },

  // MAKAN SIANG (5 Pilihan)
  {
    id: 'sng-1',
    mealTime: 'Makan Siang',
    name: 'Nasi Putih + Sayur Bening Bayam + 2 Potong Tempe & Tahu Bacem',
    calories: 510,
    priceIdr: 10000,
    proteinG: 18,
    carbsG: 76,
    fatG: 13,
  },
  {
    id: 'sng-2',
    mealTime: 'Makan Siang',
    name: 'Nasi + Pecel Sayur Bumbu Kacang + Telur Ceplok + Tempe',
    calories: 590,
    priceIdr: 13000,
    proteinG: 22,
    carbsG: 74,
    fatG: 21,
  },
  {
    id: 'sng-3',
    mealTime: 'Makan Siang',
    name: 'Nasi + Ikan Tongkol Balado + Tumis Kangkung + Tahu',
    calories: 630,
    priceIdr: 16000,
    proteinG: 32,
    carbsG: 78,
    fatG: 18,
  },
  {
    id: 'sng-4',
    mealTime: 'Makan Siang',
    name: 'Nasi + Dada Ayam Bakar Lalapan + Sayur Asem + Tempe',
    calories: 690,
    priceIdr: 22000,
    proteinG: 38,
    carbsG: 82,
    fatG: 20,
  },
  {
    id: 'sng-5',
    mealTime: 'Makan Siang',
    name: 'Nasi Merah/Putih + Ikan Bandeng Presto/Bakar + Cah Brokoli & Tempe',
    calories: 780,
    priceIdr: 27000,
    proteinG: 42,
    carbsG: 88,
    fatG: 26,
  },

  // MAKAN MALAM (5 Pilihan)
  {
    id: 'mlm-1',
    mealTime: 'Makan Malam',
    name: 'Sup Sayur Wortel Buncis + Nasi Porsi Kecil + Telur Rebus + Tahu',
    calories: 430,
    priceIdr: 10000,
    proteinG: 17,
    carbsG: 58,
    fatG: 12,
  },
  {
    id: 'mlm-2',
    mealTime: 'Makan Malam',
    name: 'Gado-Gado Lontong Porsi Sedang + Telur Rebus + Tahu Tempe',
    calories: 520,
    priceIdr: 13000,
    proteinG: 20,
    carbsG: 62,
    fatG: 20,
  },
  {
    id: 'mlm-3',
    mealTime: 'Makan Malam',
    name: 'Soto Ayam Kampung Kuah Bening + Nasi + Perkedel Kentang',
    calories: 560,
    priceIdr: 16000,
    proteinG: 27,
    carbsG: 68,
    fatG: 17,
  },
  {
    id: 'mlm-4',
    mealTime: 'Makan Malam',
    name: 'Nasi + Pepes Ikan Kembung + Sayur Capcay Kuah',
    calories: 610,
    priceIdr: 20000,
    proteinG: 34,
    carbsG: 72,
    fatG: 18,
  },
  {
    id: 'mlm-5',
    mealTime: 'Makan Malam',
    name: 'Nasi + Ayam Panggang Kecap + Tumis Buncis Tempe',
    calories: 710,
    priceIdr: 24000,
    proteinG: 36,
    carbsG: 84,
    fatG: 23,
  },

  // CAMILAN (5 Pilihan)
  {
    id: 'cml-1',
    mealTime: 'Camilan',
    name: '1 Buah Pisang Kepok + 1 Potong Pepaya Potong',
    calories: 150,
    priceIdr: 4000,
    proteinG: 2,
    carbsG: 36,
    fatG: 1,
  },
  {
    id: 'cml-2',
    mealTime: 'Camilan',
    name: 'Jagung Rebus Manis + Teh Tawar Hangat',
    calories: 190,
    priceIdr: 5000,
    proteinG: 5,
    carbsG: 41,
    fatG: 2,
  },
  {
    id: 'cml-3',
    mealTime: 'Camilan',
    name: 'Kacang Kedelai / Edamame Rebus (100g) + 1 Buah Jeruk',
    calories: 230,
    priceIdr: 8000,
    proteinG: 14,
    carbsG: 24,
    fatG: 8,
  },
  {
    id: 'cml-4',
    mealTime: 'Camilan',
    name: 'Susu Kedelai / Susu Sapi UHT 200ml + 2 Keping Biskuit Gandum',
    calories: 280,
    priceIdr: 10000,
    proteinG: 10,
    carbsG: 38,
    fatG: 10,
  },
  {
    id: 'cml-5',
    mealTime: 'Camilan',
    name: 'Roti Bakar Selai Kacang + Susu Sapi Hangat',
    calories: 380,
    priceIdr: 13000,
    proteinG: 15,
    carbsG: 46,
    fatG: 15,
  },
];

export function selectDailyMealPlan(
  targetCalories: number,
  dailyBudgetIdr: number
): DailyMealPlanResult {
  const sarapanList = INDONESIAN_MEAL_OPTIONS.filter((m) => m.mealTime === 'Sarapan');
  const siangList = INDONESIAN_MEAL_OPTIONS.filter((m) => m.mealTime === 'Makan Siang');
  const malamList = INDONESIAN_MEAL_OPTIONS.filter((m) => m.mealTime === 'Makan Malam');
  const camilanList = INDONESIAN_MEAL_OPTIONS.filter((m) => m.mealTime === 'Camilan');

  // Cari kombinasi paling hemat untuk mengetahui batas minimum budget
  const cheapestCombo: Record<MealTime, MealOption> = {
    Sarapan: sarapanList[0],
    'Makan Siang': siangList[0],
    'Makan Malam': malamList[0],
    Camilan: camilanList[0],
  };

  const minimumPossibleBudgetIdr =
    cheapestCombo.Sarapan.priceIdr +
    cheapestCombo['Makan Siang'].priceIdr +
    cheapestCombo['Makan Malam'].priceIdr +
    cheapestCombo.Camilan.priceIdr;

  if (dailyBudgetIdr < minimumPossibleBudgetIdr) {
    const fallbackCalories =
      cheapestCombo.Sarapan.calories +
      cheapestCombo['Makan Siang'].calories +
      cheapestCombo['Makan Malam'].calories +
      cheapestCombo.Camilan.calories;

    return {
      items: cheapestCombo,
      totalCalories: fallbackCalories,
      totalPriceIdr: minimumPossibleBudgetIdr,
      isBudgetSufficient: false,
      minimumPossibleBudgetIdr,
      budgetNote: `Budget Rp${dailyBudgetIdr.toLocaleString('id-ID')}/hari berada di bawah estimasi minimum makanan matang warung (Rp${minimumPossibleBudgetIdr.toLocaleString('id-ID')}/hari). Berikut alternatif kombinasi paling hemat; Anda dapat menekan biaya lebih jauh dengan memasak nasi sendiri dan mengandalkan tempe, tahu, serta telur.`,
    };
  }

  let bestCombo: Record<MealTime, MealOption> = cheapestCombo;
  let smallestCalorieDiff = Number.POSITIVE_INFINITY;

  for (const s of sarapanList) {
    for (const l of siangList) {
      for (const d of malamList) {
        for (const c of camilanList) {
          const totalPrice = s.priceIdr + l.priceIdr + d.priceIdr + c.priceIdr;
          if (totalPrice <= dailyBudgetIdr) {
            const totalCal = s.calories + l.calories + d.calories + c.calories;
            const diff = Math.abs(totalCal - targetCalories);
            if (diff < smallestCalorieDiff) {
              smallestCalorieDiff = diff;
              bestCombo = {
                Sarapan: s,
                'Makan Siang': l,
                'Makan Malam': d,
                Camilan: c,
              };
            }
          }
        }
      }
    }
  }

  const totalCalories =
    bestCombo.Sarapan.calories +
    bestCombo['Makan Siang'].calories +
    bestCombo['Makan Malam'].calories +
    bestCombo.Camilan.calories;

  const totalPriceIdr =
    bestCombo.Sarapan.priceIdr +
    bestCombo['Makan Siang'].priceIdr +
    bestCombo['Makan Malam'].priceIdr +
    bestCombo.Camilan.priceIdr;

  return {
    items: bestCombo,
    totalCalories,
    totalPriceIdr,
    isBudgetSufficient: true,
    minimumPossibleBudgetIdr,
    budgetNote: `Kombinasi menu dipilih otomatis agar mendekati target ${targetCalories} kkal dan tetap di bawah budget Rp${dailyBudgetIdr.toLocaleString('id-ID')}/hari.`,
  };
}