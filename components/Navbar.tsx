'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#beranda', label: 'Beranda' },
  { href: '/#layanan', label: 'Layanan' },
  { href: '/#tentang', label: 'Tentang' },
  { href: '/#sumber-belajar', label: 'Sumber Belajar' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-sky-900/10 bg-[#EBF3FC]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo Resmi NutriFit-AI */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
        >
          <Image
            src="/images/logo.png"
            alt="Logo NutriFit AI"
            width={168}
            height={48}
            priority
            className="h-10 w-auto rounded-lg object-contain sm:h-11"
          />
        </Link>

        {/* Navigasi Desktop */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 py-1 text-sm font-medium text-slate-700 transition-colors hover:text-[#0B4B84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Tombol Pil Kanan (Gaya Referensi: Pil Putih + Lingkaran Hijau Panah) */}
        <div className="hidden md:block">
          <Link
            href="/input"
            className="group inline-flex min-h-[46px] items-center gap-3 rounded-full border border-sky-900/10 bg-white py-1.5 pl-5 pr-1.5 text-sm font-semibold text-[#0B2545] shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
          >
            <span>Mulai Analisis</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38D46A] text-slate-900 transition-transform duration-300 group-hover:rotate-12">
              <ArrowUpRight className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* Tombol Hamburger Ponsel */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-sky-900/15 bg-white text-[#0B2545] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84] md:hidden"
        >
          {isOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Panel Menu Ponsel */}
      {isOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Navigasi Ponsel"
          className="border-t border-sky-900/10 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden"
        >
          <ul className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-slate-800 hover:bg-[#EEF5FC] hover:text-[#0B4B84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-2">
            <Link
              href="/input"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[48px] w-full items-center justify-between rounded-full bg-[#0B4B84] py-2 pl-6 pr-2 text-base font-semibold text-white shadow-sm hover:bg-[#083A66] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4B84]"
            >
              <span>Mulai Analisis Sekarang</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#38D46A] text-slate-900">
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}