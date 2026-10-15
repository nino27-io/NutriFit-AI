'use client';

import React, { useEffect, useState } from 'react';

interface InlineTitleIconProps {
  src?: string;
  className?: string;
}

export function InlineTitleIcon({
  src = '/images/nuvica-inline-title.webp',
  className = 'h-11 w-11 sm:h-13 sm:w-13',
}: InlineTitleIconProps) {
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Ambil sampel warna latar dari 4 sudut gambar
        const sampleIndices = [
          0,
          (size - 1) * 4,
          (size * (size - 1)) * 4,
          (size * size - 1) * 4,
        ];
        let bgR = 0,
          bgG = 0,
          bgB = 0;
        sampleIndices.forEach((idx) => {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= 4;
        bgG /= 4;
        bgB /= 4;

        // Hapus piksel latar kotak yang mendekati warna sudut atau terlalu terang/pucat
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const distBg = Math.hypot(r - bgR, g - bgG, b - bgB);
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
          const brightness = (r + g + b) / 3;

          // Jika piksel adalah latar belakang kotak (mirip sudut atau sangat terang & saturasi rendah)
          if (distBg < 42 || (brightness > 205 && saturation < 0.22)) {
            data[i + 3] = 0;
          } else if (distBg < 62 || (brightness > 185 && saturation < 0.28)) {
            // Feathering halus di tepi objek 3D
            const alphaFactor = Math.min(Math.max((distBg - 42) / 20, 0.15), 1);
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        if (isMounted) {
          setCutoutUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Fallback jika canvas gagal
      }
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center align-middle select-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cutoutUrl ?? src}
        alt=""
        className={`h-full w-full object-contain filter drop-shadow-[0_6px_10px_rgba(11,75,132,0.25)] transition-opacity duration-200 ${
          cutoutUrl
            ? 'opacity-100'
            : '[mask-image:radial-gradient(circle,black_45%,transparent_68%)]'
        }`}
      />
    </span>
  );
}