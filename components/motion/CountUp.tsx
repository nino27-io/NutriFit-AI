'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface CountUpProps {
  to: number;
  decimals?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  formatThousands?: boolean;
  className?: string;
}

export function CountUp({
  to,
  decimals = 0,
  durationMs = 750,
  prefix = '',
  suffix = '',
  formatThousands = false,
  className = '',
}: CountUpProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [currentValue, setCurrentValue] = useState<number>(
    reducedMotion ? to : 0
  );
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentValue(to);
      return;
    }

    const node = spanRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, to]);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentValue(to);
      return;
    }

    if (!isInView) return;

    let animationFrameId = 0;
    let startTime: number | null = null;

    function step(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentValue(to * eased);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCurrentValue(to);
      }
    }

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isInView, reducedMotion, to, durationMs]);

  const formattedNumber = (() => {
    const fixed = currentValue.toFixed(decimals);
    if (!formatThousands) return fixed;
    const num = Number(fixed);
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  })();

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}