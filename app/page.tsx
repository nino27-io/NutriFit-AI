import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowUpRight,
  Award,
  ClipboardCheck,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { LEARNING_RESOURCES } from '@/lib/content/resources';
import { Reveal } from '@/components/motion/Reveal';
import { CountUp } from '@/components/motion/CountUp';
import { DashboardCharts } from '@/components/motion/DashboardCharts';
import { ServiceCard } from '@/components/ServiceCard';
import { ResourceCard } from '@/components/ResourceCard';

const SERVICES = [
  {
    imageSrc: '/images/nuvica-service-body.webp',
    imageAlt: 'Ilustrasi 3D kaca analisis komposisi tubuh dan lingkar pinggang',
    title: 'Analisis Tubuh',
    description:
      'BMI Asia-Pasifik, rasio pinggang-pinggul (WHR), dan lemak tubuh US Navy.',
    featured: false,
  },
  {
    imageSrc: '/images/nuvica-service-meal.webp',
    imageAlt: 'Ilustrasi 3D kaca rencana kalori dan nutrisi harian',
    title: 'Rencana Kalori & Menu',
    description:
      'Target kalori aman di atas BMR beserta menu lokal sesuai budget.',
    featured: false,
  },
  {
    imageSrc: '/images/nuvica-service-workout.webp',
    imageAlt: 'Ilustrasi 3D kaca rekomendasi latihan mingguan',
    title: 'Rekomendasi Latihan',
    description:
      'Program olahraga 7 hari sesuai tujuan dan tingkat aktivitas fisikmu.',
    featured: false,
  },
  {
    imageSrc: '/images/nuvica-service-report.webp',
    imageAlt: 'Ilustrasi 3D kaca laporan kesehatan instan',
    title: 'Laporan Instan',
    description:
      'Ringkasan lengkap yang langsung tampil tanpa perlu menunggu lama.',
    featured: true,
  },
];

export default function DashboardPage() {
  return (
    <div id="beranda" className="overflow-x-hidden bg-[#EEF5FC]">
      {/* =====================================================================
          1. HERO SECTION (100% Komposisi 3-Kolom Nuvica)
      ===================================================================== */}
      <section className="bg-nuvica-hero relative pb-14 pt-6 md:pb-20 md:pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* KOLOM KIRI (lg:col-span-5): Pil Putih + Headline Putih 3 Baris + Tombol Biru */}
            <div className="z-10 lg:col-span-5">
              <Reveal delayMs={0}>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-xs font-bold text-[#0B2545] shadow-sm">
                  <Activity
                    className="h-4 w-4 text-[#0B4B84]"
                    aria-hidden="true"
                  />
                  <span>Analisis Cepat</span>
                </span>
              </Reveal>

              <Reveal delayMs={100}>
                <h1 className="text-hero-shadow mt-5 text-5xl font-extrabold uppercase leading-[0.98] tracking-tight text-white sm:text-6xl">
                  <span className="block">CERDAS</span>
                  <span className="my-1 flex items-center gap-3">
                    <Image
                      src="/images/nuvica-inline-title.webp"
                      alt=""
                      width={52}
                      height={52}
                      className="h-11 w-11 shrink-0 drop-shadow-md sm:h-13 sm:w-13"
                    />
                    <span>BUGAR</span>
                  </span>
                  <span className="block">TERUKUR</span>
                </h1>
              </Reveal>

              <Reveal delayMs={200}>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-[#0B2545]/85 sm:text-base">
                  <strong>NutriFit AI</strong> adalah destinasi analisis tubuh
                  terukur untuk menghitung <strong>kebutuhan kalori aman</strong>,
                  menyusun <strong>menu sesuai budget</strong>, dan memandu
                  olahraga harianmu dalam satu layar.
                </p>
              </Reveal>

              <Reveal delayMs={300}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {/* Tombol Pil Biru Tua + Bulatan Putih Panah (Identik "Explore More ↗" Nuvica) */}
                  <Link
                    href="/input"
                    className="group inline-flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
                  >
                    <span className="inline-flex min-h-[48px] items-center rounded-full bg-[#0B4B84] px-7 py-3 text-sm font-bold text-white shadow-md transition-colors group-hover:bg-[#083A66]">
                      Mulai Analisis
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0B2545] shadow-md transition-transform duration-300 group-hover:rotate-12">
                      <ArrowUpRight
                        className="h-5 w-5 stroke-[2.2]"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>

                  <Link
                    href="#layanan"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/80 bg-white/60 px-5 py-3 text-sm font-bold text-[#0B2545] backdrop-blur-sm transition-colors hover:bg-white"
                  >
                    Cara Kerja
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* KOLOM TENGAH (lg:col-span-4): Archway Portrait + 2 Floating Glass Cards */}
            <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:col-span-4">
              <Reveal delayMs={150}>
                <div className="relative flex justify-center">
                  {/* Bingkai Kubah Melengkung (Archway) */}
                  <div className="relative h-[370px] w-[275px] overflow-hidden rounded-t-full rounded-b-[2.5rem] border-[6px] border-white/80 bg-[#CFE4F9] shadow-xl sm:h-[400px] sm:w-[295px]">
                    {/* // TODO: ganti nuvica-hero-person.webp dengan foto asli orang bugar jika diinginkan */}
                    <Image
                      src="/images/nuvica-hero-person.webp"
                      alt="Pendamping kebugaran dan nutrisi NutriFit AI"
                      width={520}
                      height={640}
                      priority
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Kartu Kaca Mengambang Bawah Kiri (Meniru "22 Years Medical Excellence") */}
                  <div className="animate-float-slow absolute -bottom-4 left-0 z-20 flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md sm:-left-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF5FC] text-[#0B4B84]">
                      <HeartPulse className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-base font-extrabold leading-none text-[#0B2545]">
                        <CountUp to={21.4} decimals={1} suffix=" BMI" />
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        Normal · Contoh tampilan
                      </p>
                    </div>
                  </div>

                  {/* Kartu Kaca Vertikal Kanan Atas (Meniru "490 AWARDS" + Trofi di Nuvica) */}
                  <div className="animate-float-delayed absolute -right-2 top-4 z-20 flex flex-col items-center rounded-2xl border border-white bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur-md sm:-right-6">
                    <p className="text-xl font-extrabold leading-none text-[#0B2545]">
                      <CountUp to={2000} decimals={0} formatThousands />
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      KKAL / HARI
                    </p>
                    <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFC83D]/25 text-[#0B4B84]">
                      <Award className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-[9px] font-semibold text-slate-500">
                      Contoh
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* KOLOM KANAN (lg:col-span-3): Organ 3D Kaca Biru-Hijau + Pill Badge Kanan */}
            <div className="relative mx-auto w-full max-w-xs lg:col-span-3">
              <Reveal delayMs={250}>
                <div className="relative flex items-center justify-center">
                  {/* // TODO: ganti nuvica-hero-organ.webp dengan render 3D kaca jika diinginkan */}
                  <Image
                    src="/images/nuvica-hero-organ.webp"
                    alt="Ilustrasi 3D kaca metabolisme dan komposisi tubuh"
                    width={540}
                    height={580}
                    priority
                    className="h-auto w-64 drop-shadow-xl sm:w-72 lg:w-full"
                  />

                  {/* Kartu Kaca Kanan Tengah (Meniru "6700 Healed Lungs" di Nuvica) */}
                  <div className="animate-float-slow absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2.5 rounded-2xl border border-white bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold leading-none text-[#0B2545]">
                        18.5–22.9
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        BMI Ideal Asia
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* =================================================================
              2. BARIS KARTU LAYANAN (id="layanan") — Menyatu di Bawah Hero
          ================================================================= */}
          <div id="layanan" className="scroll-mt-24 pt-12 md:pt-16">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((srv, idx) => (
                <Reveal key={srv.title} delayMs={idx * 90}>
                  <ServiceCard
                    imageSrc={srv.imageSrc}
                    imageAlt={srv.imageAlt}
                    title={srv.title}
                    description={srv.description}
                    featured={srv.featured}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. TENTANG KAMI SECTION (id="tentang") — 100% Gaya "ABOUT US" Nuvica
      ===================================================================== */}
      <section id="tentang" className="scroll-mt-20 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              {/* SISI KIRI: Gambar Studio/Gedung dengan Overlay Kartu Kaca Vertikal di Kanan */}
              <div className="relative lg:col-span-6">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#DCEBF8] shadow-md">
                  <Image
                    src="/images/nuvica-about-showcase.webp"
                    alt="Pusat metodologi analisis tubuh NutriFit AI"
                    width={720}
                    height={480}
                    className="h-[320px] w-full object-cover sm:h-[360px]"
                  />

                  {/* Kartu Kaca Vertikal di Sisi Kanan Dalam (1:1 dengan Kartu "NUVICA FROM 28/10/2003") */}
                  <div className="absolute bottom-4 right-4 top-4 flex w-[210px] flex-col justify-between rounded-3xl border border-white/80 bg-white/85 p-5 shadow-lg backdrop-blur-md sm:w-[235px] sm:p-6">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B4B84] text-lg font-bold text-white">
                        +
                      </span>
                      <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#0B2545] shadow-sm">
                        NUTRIFIT
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#0B4B84]">
                        STANDAR BAKU
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-600">
                        WHO · US Navy · Mifflin
                      </p>
                    </div>

                    <p className="text-xs font-bold leading-snug text-[#0B2545] sm:text-sm">
                      Berkomitmen menjaga kesehatan dan batas aman kalori
                      harianmu.
                    </p>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: Badge Hijau Neon + Judul Uppercase Tebal + Deskripsi + Tombol Biru */}
              <div className="lg:col-span-6">
                <span className="inline-block rounded-full bg-[#38D46A] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                  TENTANG KAMI
                </span>

                <h2 className="mt-4 text-3xl font-extrabold uppercase leading-[1.12] tracking-tight text-[#0B2545] sm:text-4xl">
                  PENDAMPING ANALISIS TUBUH & NUTRISI HARIANMU
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                  Kami memadukan rumus antropometri ilmiah (lingkar pinggang,
                  pinggul, dan leher) dengan perhitungan metabolisme basal agar
                  target kalorimu lebih akurat daripada kalkulator BMI biasa.
                  Seluruh hasil bersifat edukatif untuk memandu pola hidup sehat.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <Link
                    href="/input"
                    className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-[#0B4B84] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#083A66]"
                  >
                    <span>Coba Analisis</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF5FC] text-[#0B4B84]">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0B2545]">
                        Kepatuhan & Edukasi
                      </p>
                      <p className="text-xs text-slate-500">
                        Sesuai Prinsip Privasi UU PDP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =====================================================================
          4. STRIP 4 ANGKA STATISTIK BESAR (100% Gaya "$250M | 20M+ | 95% | 200+")
      ===================================================================== */}
      <section className="border-y border-sky-900/5 bg-[#E9F2FA] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                  18.5–22.9
                </p>
                <p className="mx-auto mt-1.5 max-w-[140px] text-xs leading-snug text-slate-600">
                  Rentang BMI Ideal Asia-Pasifik
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                  WHR+Navy
                </p>
                <p className="mx-auto mt-1.5 max-w-[140px] text-xs leading-snug text-slate-600">
                  Akurasi Lingkar Pinggang & Pinggul
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                  100% BMR
                </p>
                <p className="mx-auto mt-1.5 max-w-[140px] text-xs leading-snug text-slate-600">
                  Batas Minimum Kalori Harian Aman
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-[#0B2545] sm:text-4xl">
                  7 Hari
                </p>
                <p className="mx-auto mt-1.5 max-w-[140px] text-xs leading-snug text-slate-600">
                  Rencana Menu Lokal & Olahraga
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =====================================================================
          5. CARA KERJA & GRAFIK ANIMASI CONTOH (Gaya Header "WE OFFER PRO DNA")
      ===================================================================== */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="inline-block rounded-full bg-[#38D46A] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                  CARA KERJA & SIMULASI
                </span>
                <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight text-[#0B2545] sm:text-4xl">
                  VISUALISASI METRIK & RENCANA HARIAN
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Data pada grafik di bawah adalah contoh tampilan edukatif
              </p>
            </div>
          </Reveal>

          <DashboardCharts />
        </div>
      </section>

      {/* =====================================================================
          6. SUMBER BELAJAR SECTION (id="sumber-belajar")
      ===================================================================== */}
      <section
        id="sumber-belajar"
        className="scroll-mt-20 border-t border-sky-900/10 bg-[#EEF5FC] py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-block rounded-full bg-[#38D46A] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                  SUMBER BELAJAR
                </span>
                <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight text-[#0B2545] sm:text-4xl">
                  PANDUAN PRAKTIS GIZI & KEBUGARAN
                </h2>
              </div>
              <p className="max-w-md text-sm text-slate-600">
                Artikel singkat berbasis ilmu gizi dan kebugaran untuk membantumu
                memahami tubuh tanpa istilah medis yang rumit.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LEARNING_RESOURCES.map((item, idx) => (
              <Reveal key={item.id} delayMs={idx * 80}>
                <ResourceCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. AJAKAN PENUTUP (CLOSING CTA)
      ===================================================================== */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-[2.25rem] bg-gradient-to-br from-[#1C64A6] via-[#0B4B84] to-[#082E54] p-8 text-center text-white shadow-xl sm:p-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#38D46A] px-4 py-1 text-xs font-extrabold uppercase text-slate-900">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                <span>Mulai Dalam 1 Menit</span>
              </span>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
                SIAP MELIHAT REKOMENDASI MENU DAN OLAHRAGA UNTUK TUBUHMU?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-sky-100/90 sm:text-base">
                Siapkan ukuran tinggi, berat, serta lingkar pinggang dan
                pinggulmu. Dapatkan laporan instan tanpa biaya dan tanpa perlu
                login.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/input"
                  className="group inline-flex min-h-[52px] items-center gap-3 rounded-full bg-white py-2 pl-7 pr-2 text-sm font-extrabold text-[#0B2545] shadow-md transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38D46A]"
                >
                  <span>Mulai Analisis Sekarang</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38D46A] text-slate-900 transition-transform duration-300 group-hover:rotate-12">
                    <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}