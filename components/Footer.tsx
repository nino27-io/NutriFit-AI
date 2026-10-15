import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B2545] text-sky-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Deskripsi */}
          <div className="md:col-span-5">
            <div className="inline-block rounded-2xl bg-white p-2.5 shadow-sm">
              <Image
                src="/images/logo.png"
                alt="Logo NutriFit AI"
                width={160}
                height={44}
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sky-100/85">
              Pendamping analisis komposisi tubuh, kebutuhan kalori harian, dan
              perencanaan makan hemat berbasis bukti ilmiah untuk mahasiswa dan
              profesional muda Indonesia.
            </p>
          </div>

          {/* Tautan Cepat */}
          <div className="md:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#38D46A]">
              Navigasi
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#beranda"
                  className="text-sky-100 transition-colors hover:text-white"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/#layanan"
                  className="text-sky-100 transition-colors hover:text-white"
                >
                  Layanan Analisis
                </Link>
              </li>
              <li>
                <Link
                  href="/#tentang"
                  className="text-sky-100 transition-colors hover:text-white"
                >
                  Cara Kerja & Metodologi
                </Link>
              </li>
              <li>
                <Link
                  href="/#sumber-belajar"
                  className="text-sky-100 transition-colors hover:text-white"
                >
                  Sumber Belajar
                </Link>
              </li>
              <li>
                <Link
                  href="/input"
                  className="font-semibold text-[#38D46A] transition-colors hover:underline"
                >
                  Cek Tubuhmu Sekarang
                </Link>
              </li>
            </ul>
          </div>

          {/* Kepatuhan & Privasi */}
          <div className="md:col-span-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#38D46A]">
              Kepatuhan & Keselamatan
            </h2>
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-sky-50">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-[#38D46A]"
                aria-hidden="true"
              />
              <p>
                <strong>Disclaimer Medis:</strong> Seluruh hasil perhitungan BMI,
                WHR, estimasi lemak tubuh, rencana menu, dan jadwal olahraga di
                NutriFit AI bersifat <strong>edukatif</strong> dan bukan
                merupakan diagnosis medis atau pengganti konsultasi dengan dokter
                maupun ahli gizi terdaftar (RD).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-sky-200/75 sm:flex sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NutriFit AI. Hak cipta dilindungi.</p>
          <p className="mt-2 sm:mt-0">
            Dirancang dengan perlindungan privasi data sesuai prinsip UU PDP.
          </p>
        </div>
      </div>
    </footer>
  );
}