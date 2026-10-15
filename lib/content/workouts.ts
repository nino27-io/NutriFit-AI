import type { ActivityFactor, FitnessGoal } from '../calc/types';

export interface WorkoutDayItem {
  day: string;
  activity: string;
  duration: string;
  intensity: 'Ringan' | 'Sedang' | 'Tinggi' | 'Pemulihan';
  isRestDay: boolean;
}

export interface GroupedWorkoutItem {
  daysLabel: string;
  activity: string;
  duration: string;
  isRest?: boolean;
}

export function getWeeklyWorkoutPlan(
  goal: FitnessGoal,
  activityFactor: ActivityFactor
): {
  dailySchedule: WorkoutDayItem[];
  groupedSummary: GroupedWorkoutItem[];
} {
  const isBeginner = activityFactor <= 1.375;

  if (goal === 'lose') {
    const kardioDur = isBeginner ? '30 menit' : '40 menit';
    const bebanDur = isBeginner ? '20 menit' : '30 menit';

    return {
      groupedSummary: [
        {
          daysLabel: 'Senin, Rabu, Jumat',
          activity: 'Jalan cepat / Jogging ringan',
          duration: kardioDur,
        },
        {
          daysLabel: 'Selasa, Kamis',
          activity: 'Latihan beban tubuh (Squat, Push-up, Plank)',
          duration: bebanDur,
        },
        {
          daysLabel: 'Sabtu',
          activity: 'Bersepeda santai / Senam aerobik',
          duration: '45 menit',
        },
        {
          daysLabel: 'Minggu',
          activity: 'Istirahat & peregangan ringan',
          duration: 'Pemulihan penuh',
          isRest: true,
        },
      ],
      dailySchedule: [
        {
          day: 'Senin',
          activity: 'Jalan cepat atau jogging ritme stabil',
          duration: kardioDur,
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Selasa',
          activity: 'Latihan kekuatan tubuh (Squat, Push-up, Plank)',
          duration: bebanDur,
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Rabu',
          activity: 'Jalan cepat atau naik-turun tangga terukur',
          duration: kardioDur,
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Kamis',
          activity: 'Latihan beban tubuh fokus otot inti & punggung',
          duration: bebanDur,
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Jumat',
          activity: 'Jogging ringan atau lompat tali bertahap',
          duration: kardioDur,
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Sabtu',
          activity: 'Bersepeda santai / Olahraga rekreasional',
          duration: '45 menit',
          intensity: 'Ringan',
          isRestDay: false,
        },
        {
          day: 'Minggu',
          activity: 'Istirahat & peregangan mobilitas',
          duration: '15 menit opsional',
          intensity: 'Pemulihan',
          isRestDay: true,
        },
      ],
    };
  }

  if (goal === 'gain') {
    const strengthDur = isBeginner ? '30 menit' : '45 menit';

    return {
      groupedSummary: [
        {
          daysLabel: 'Senin, Rabu, Jumat',
          activity: 'Latihan kekuatan progresif (Upper & Lower Body)',
          duration: strengthDur,
        },
        {
          daysLabel: 'Selasa, Kamis',
          activity: 'Jalan santai aktif & mobilitas sendi',
          duration: '20 menit',
        },
        {
          daysLabel: 'Sabtu',
          activity: 'Latihan beban tubuh komplit & otot inti (Core)',
          duration: '35 menit',
        },
        {
          daysLabel: 'Minggu',
          activity: 'Istirahat total untuk pertumbuhan otot',
          duration: 'Pemulihan penuh',
          isRest: true,
        },
      ],
      dailySchedule: [
        {
          day: 'Senin',
          activity: 'Latihan kekuatan tubuh bagian atas (Push-up, Dips, Pike)',
          duration: strengthDur,
          intensity: 'Tinggi',
          isRestDay: false,
        },
        {
          day: 'Selasa',
          activity: 'Jalan kaki santai & peregangan dinamis',
          duration: '20 menit',
          intensity: 'Ringan',
          isRestDay: false,
        },
        {
          day: 'Rabu',
          activity: 'Latihan kekuatan kaki (Squat, Lunges, Calf Raise)',
          duration: strengthDur,
          intensity: 'Tinggi',
          isRestDay: false,
        },
        {
          day: 'Kamis',
          activity: 'Istirahat aktif & latihan pernapasan/mobilitas',
          duration: '20 menit',
          intensity: 'Pemulihan',
          isRestDay: true,
        },
        {
          day: 'Jumat',
          activity: 'Latihan kekuatan seluruh tubuh (Full Body Compound)',
          duration: strengthDur,
          intensity: 'Tinggi',
          isRestDay: false,
        },
        {
          day: 'Sabtu',
          activity: 'Latihan otot inti (Plank, Bird-Dog) & kardio ringan',
          duration: '35 menit',
          intensity: 'Sedang',
          isRestDay: false,
        },
        {
          day: 'Minggu',
          activity: 'Istirahat penuh',
          duration: 'Pemulihan penuh',
          intensity: 'Pemulihan',
          isRestDay: true,
        },
      ],
    };
  }

  // Default: 'maintain' (Jaga berat badan & kebugaran umum)
  return {
    groupedSummary: [
      {
        daysLabel: 'Senin, Rabu, Jumat',
        activity: 'Jogging ringan / Jalan cepat pagi',
        duration: '30 menit',
      },
      {
        daysLabel: 'Selasa, Kamis',
        activity: 'Latihan kekuatan dasar (Bodyweight Conditioning)',
        duration: '25 menit',
      },
      {
        daysLabel: 'Sabtu',
        activity: 'Olahraga hobi (Bulu tangkis / Renang / Bersepeda)',
        duration: '40 menit',
      },
      {
        daysLabel: 'Minggu',
        activity: 'Istirahat',
        duration: 'Pemulihan penuh',
        isRest: true,
      },
    ],
    dailySchedule: [
      {
        day: 'Senin',
        activity: 'Jogging ringan atau jalan cepat pagi',
        duration: '30 menit',
        intensity: 'Sedang',
        isRestDay: false,
      },
      {
        day: 'Selasa',
        activity: 'Latihan kekuatan dasar (Squat, Push-up, Plank)',
        duration: '25 menit',
        intensity: 'Sedang',
        isRestDay: false,
      },
      {
        day: 'Rabu',
        activity: 'Jalan cepat sore & peregangan punggung',
        duration: '30 menit',
        intensity: 'Ringan',
        isRestDay: false,
      },
      {
        day: 'Kamis',
        activity: 'Latihan kekuatan fungsional & keseimbangan',
        duration: '25 menit',
        intensity: 'Sedang',
        isRestDay: false,
      },
      {
        day: 'Jumat',
        activity: 'Jogging stabil atau bersepeda statis',
        duration: '30 menit',
        intensity: 'Sedang',
        isRestDay: false,
      },
      {
        day: 'Sabtu',
        activity: 'Olahraga permainan / rekreasional akhir pekan',
        duration: '40 menit',
        intensity: 'Sedang',
        isRestDay: false,
      },
      {
        day: 'Minggu',
        activity: 'Istirahat penuh',
        duration: 'Pemulihan penuh',
        intensity: 'Pemulihan',
        isRestDay: true,
      },
    ],
  };
}