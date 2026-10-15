import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, Clock } from 'lucide-react';
import type { ResourceItem } from '@/lib/content/resources';

interface ResourceCardProps {
  item: ResourceItem;
}

const CATEGORY_BADGE_STYLES: Record<ResourceItem['category'], string> = {
  'Pola Makan': 'bg-[#E3F7EB] text-[#156C36]',
  Olahraga: 'bg-[#DCEBF8] text-[#0B4B84]',
  'Gaya Hidup': 'bg-[#FEF3C7] text-amber-900',
};

export function ResourceCard({ item }: ResourceCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sky-900/10 bg-white shadow-sm transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAF3FB]">
        {/* // TODO: ganti dengan foto asli berformat WebP (<= 80 KB, maks lebar 640px) */}
        <Image
          src={item.image}
          alt={item.imageAlt}
          width={640}
          height={400}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                CATEGORY_BADGE_STYLES[item.category]
              }`}
            >
              {item.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {item.readTime}
            </span>
          </div>

          <h3 className="mt-3.5 font-serif text-lg font-bold leading-snug text-[#0B2545] group-hover:text-[#0B4B84]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {item.summary}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <a
            href="#sumber-belajar"
            aria-label={`Baca artikel: ${item.title}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B4B84] transition-colors hover:text-[#0B2545] focus:outline-none focus-visible:underline"
          >
            <span>Baca Selengkapnya</span>
          </a>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84] transition-colors group-hover:bg-[#38D46A] group-hover:text-slate-900"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}