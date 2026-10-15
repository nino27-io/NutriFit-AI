import React from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface ServiceCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  featured?: boolean;
}

export function ServiceCard({
  imageSrc,
  imageAlt,
  title,
  description,
  featured = false,
}: ServiceCardProps) {
  return (
    <article
      className={`group relative flex h-[300px] w-full flex-col justify-between overflow-hidden rounded-[2rem] p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${
        featured
          ? 'border border-[#1E4E79]/60 bg-[#05203C] text-white shadow-md'
          : 'border border-white bg-white text-[#0B2545] shadow-sm'
      }`}
    >
      {/* Gambar Memenuhi 100% Kartu Tanpa Garis Tepi Kotak */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Gradasi Halus di Bagian Bawah agar Warna Font Kebalikannya Tetap Tajam */}
        <div
          className={`absolute inset-0 ${
            featured
              ? 'bg-gradient-to-t from-[#041A33] via-[#041A33]/80 to-transparent'
              : 'bg-gradient-to-t from-white via-white/85 to-transparent'
          }`}
        />
      </div>

      {/* Baris Atas: Tombol Bulat Panah di Pojok Kanan Atas */}
      <div className="relative z-10 flex justify-end">
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-300 group-hover:rotate-12 ${
            featured
              ? 'bg-white text-[#0B2545]'
              : 'bg-[#38D46A] text-[#0B2545]'
          }`}
        >
          <ArrowUpRight className="h-5 w-5 stroke-[2.4]" />
        </span>
      </div>

      {/* Baris Bawah: Tinggi Area Teks Dikunci Seragam agar Semua Kartu Sejajar */}
      <div className="relative z-10 mt-auto flex min-h-[88px] flex-col justify-end text-right">
        <h3
          className={`text-lg font-extrabold leading-tight tracking-tight ${
            featured ? 'text-white' : 'text-[#0B2545]'
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-1.5 line-clamp-3 text-xs font-medium leading-relaxed ${
            featured ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
          }`}
        >
          {description}
        </p>
      </div>
    </article>
  );
}