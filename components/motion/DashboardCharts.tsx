'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ClipboardList, Sparkles, CalendarCheck } from 'lucide-react';
import { useReducedMotion } from './useReducedMotion';
import { ProgressRing } from './ProgressRing';

const WEEKLY_CALORIE_SAMPLE = [
  { day: 'Sen', kcal: 1950, ratio: 0.85 },
  { day: 'Sel', kcal: 2020, ratio: 0.92 },
  { day: 'Rab', kcal: 1980, ratio: 0.88 },
  { day: 'Kam', kcal: 2000, ratio: 0.9 },
  { day: 'Jum', kcal: 1940, ratio: 0.84 },
  { day: 'Sab', kcal: 2100, ratio: 0.98 },
  { day: 'Min', kcal: 1990, ratio: 0.89 },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Isi Data Tubuh & Aktivitas',
    description:
      'Masukkan tinggi, berat, lingkar pinggang-pinggul, tingkat aktivitas, serta budget makan harianmu.',
    icon: ClipboardList,
  },
  {
    step: '02',
    title: 'Dapatkan Hasil Terukur',
    description:
      'Sistem menghitung BMI Asia-Pasifik, WHR, estimasi lemak tubuh US Navy, BMR, dan target kalori aman.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Jalankan Rencana Harian',
    description:
      'Ikuti kombinasi menu lokal sesuai kantong dan jadwal olahraga 7 hari yang realistis.',
    icon: CalendarCheck,
  },
];

export function DashboardCharts() {
  const stepsRef = useRef<HTMLDivElement | null>(null);
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [stepsVisible, setStepsVisible] = useState(false);
  const [chartsVisible, setChartsVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setStepsVisible(true);
      setChartsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === stepsRef.current) {
            setStepsVisible(entry.isIntersecting);
          }
          if (entry.target === chartsRef.current) {
            setChartsVisible(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (stepsRef.current) observer.observe(stepsRef.current);
    if (chartsRef.current) observer.observe(chartsRef.current);

    return () => observer.disconnect();
  }, [reducedMotion]);

  const showSteps = reducedMotion || stepsVisible;
  const showCharts = reducedMotion || chartsVisible;

  return (
    <div className="space-y-12">
      {/* BAGIAN A: 3 Langkah Cara Kerja dengan Garis SVG yang Tergambar Saat Di-scroll */}
      <div ref={stepsRef} className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden md:block"
        >
          <svg
            className="h-6 w-full"
            viewBox="0 0 800 24"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 12 L 800 12"
              stroke="#DCEBF8"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 0 12 L 800 12"
              stroke="#38D46A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="800"
              strokeDashoffset={showSteps ? 0 : 800}
              style={{
                transition: reducedMotion
                  ? 'none'
                  : 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {WORKFLOW_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                style={{
                  transitionDelay: reducedMotion ? '0ms' : `${idx * 150}ms`,
                }}
                className={`relative rounded-3xl border border-sky-900/10 bg-white p-6 shadow-sm transition-[transform,opacity] duration-500 ease-out ${
                  showSteps
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B4B84] text-white shadow-sm">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#E3F7EB] px-3 py-1 text-xs font-bold text-[#156C36]">
                    Langkah {item.step}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-[#0B2545]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BAGIAN B: 3 Grafik Animasi Contoh */}
      <div ref={chartsRef} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafik 1: Donut Makronutrien SVG */}
        <div className="rounded-3xl border border-sky-900/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                Komposisi Makronutrien
              </h3>
              <p className="text-xs text-slate-500">
                Keseimbangan protein, karbohidrat, dan lemak
              </p>
            </div>
            <span className="rounded-full bg-[#E3F7EB] px-2.5 py-1 text-[11px] font-bold text-[#156C36]">
              Contoh tampilan
            </span>
          </div>

          <ProgressRing
            size={156}
            strokeWidth={18}
            centerLabel="2.000"
            centerSubLabel="kkal/hari"
            segments={[
              {
                label: 'Karbohidrat',
                percentage: 45,
                grams: 225,
                color: '#0B4B84',
              },
              {
                label: 'Protein',
                percentage: 30,
                grams: 150,
                color: '#38D46A',
              },
              {
                label: 'Lemak Sehat',
                percentage: 25,
                grams: 56,
                color: '#FFC83D',
              },
            ]}
          />
        </div>

        {/* Grafik 2: Tren Kalori Mingguan */}
        <div className="rounded-3xl border border-sky-900/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                Tren Kalori Mingguan
              </h3>
              <p className="text-xs text-slate-500">
                Konsistensi terhadap target 2.000 kkal
              </p>
            </div>
            <span className="rounded-full bg-[#E3F7EB] px-2.5 py-1 text-[11px] font-bold text-[#156C36]">
              Contoh tampilan
            </span>
          </div>

          <div
            role="img"
            aria-label="Contoh grafik batang tren kalori mingguan sekitar 2000 kkal per hari"
            className="mt-6 flex h-36 items-end justify-between gap-2 border-b border-slate-200 pb-2 pt-4"
          >
            {WEEKLY_CALORIE_SAMPLE.map((item, idx) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-[10px] font-medium text-slate-500">
                  {item.kcal}
                </span>
                <div className="relative flex h-24 w-full max-w-[28px] items-end overflow-hidden rounded-t-lg bg-[#EEF5FC]">
                  <div
                    style={{
                      height: `${Math.round(item.ratio * 100)}%`,
                      transformOrigin: 'bottom',
                      transitionDelay: reducedMotion ? '0ms' : `${idx * 60}ms`,
                    }}
                    className={`w-full rounded-t-lg bg-gradient-to-t from-[#0B4B84] to-[#38D46A] transition-transform duration-700 ease-out ${
                      showCharts ? 'scale-y-100' : 'scale-y-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Target kalori dijaga agar tidak pernah turun di bawah angka BMR tubuh.
          </p>
        </div>

        {/* Grafik 3: Bilah Skala BMI dengan Penanda Bergeser */}
        <div className="rounded-3xl border border-sky-900/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0B2545]">
                Indikator Skala BMI
              </h3>
              <p className="text-xs text-slate-500">
                Standar Asia-Pasifik (WHO WPRO)
              </p>
            </div>
            <span className="rounded-full bg-[#E3F7EB] px-2.5 py-1 text-[11px] font-bold text-[#156C36]">
              Contoh tampilan
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F2F7FC] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-600">
                Posisi Contoh:
              </span>
              <span className="font-serif text-xl font-bold text-[#0B4B84]">
                21.4 kg/m² · Normal
              </span>
            </div>

            <div className="relative mt-5">
              <div className="grid h-3.5 w-full grid-cols-4 overflow-hidden rounded-full">
                <div className="bg-sky-300" title="< 18.5 Kurang" />
                <div className="bg-[#38D46A]" title="18.5 - 22.9 Normal" />
                <div className="bg-[#FFC83D]" title="23.0 - 24.9 Berlebih" />
                <div className="bg-[#0B4B84]" title=">= 25.0 Obesitas" />
              </div>

              <div className="relative mt-1 h-6 w-full">
                <div
                  className={`inline-flex flex-col items-center transition-transform duration-700 ease-out ${
                    showCharts
                      ? 'translate-x-[96px] sm:translate-x-[110px]'
                      : 'translate-x-0'
                  }`}
                >
                  <span
                    className="h-0 w-0 border-b-[7px] border-l-[6px] border-r-[6px] border-b-[#0B2545] border-l-transparent border-r-transparent"
                    aria-hidden="true"
                  />
                  <span className="rounded bg-[#0B2545] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    21.4
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 text-center text-[10px] font-medium text-slate-600">
              <span>&lt;18.5</span>
              <span className="font-bold text-[#156C36]">18.5–22.9</span>
              <span>23–24.9</span>
              <span>&ge;25.0</span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Didampingi rasio pinggang-pinggul (WHR) agar distribusi lemak perut
            terdeteksi lebih akurat.
          </p>
        </div>
      </div>
    </div>
  );
}