'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface MacroSegment {
  label: string;
  percentage: number;
  grams: number;
  color: string;
}

interface ProgressRingProps {
  segments: MacroSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function ProgressRing({
  segments,
  size = 180,
  strokeWidth = 20,
  centerLabel = 'Makro',
  centerSubLabel = 'Harian',
}: ProgressRingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [animateNow, setAnimateNow] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setAnimateNow(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setAnimateNow(entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const active = reducedMotion || animateNow;

  let cumulativePct = 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Grafik cincin distribusi makronutrien"
          className="-rotate-90 transform"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E5EFFA"
            strokeWidth={strokeWidth}
          />

          {segments.map((seg) => {
            const segmentLength = (seg.percentage / 100) * circumference;
            const rotationDeg = (cumulativePct / 100) * 360;
            cumulativePct += seg.percentage;

            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={active ? 0 : segmentLength}
                strokeLinecap="butt"
                style={{
                  transformOrigin: '50% 50%',
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 750ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-serif text-lg font-bold text-[#0B4B84]">
            {centerLabel}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {centerSubLabel}
          </span>
        </div>
      </div>

      {/* Legenda Makronutrien */}
      <div className="w-full space-y-2.5 sm:w-auto">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="flex items-center justify-between gap-4 rounded-xl bg-[#F2F7FC] px-3.5 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
                aria-hidden="true"
              />
              <span className="font-semibold text-[#0B2545]">{seg.label}</span>
            </div>
            <span className="font-medium text-slate-600">
              {seg.grams}g ({seg.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}