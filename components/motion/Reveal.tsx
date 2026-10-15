'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface RevealProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}

export function Reveal({ children, delayMs = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const showImmediately = reducedMotion || isVisible;

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: reducedMotion ? '0ms' : `${delayMs}ms`,
      }}
      className={`transition-[transform,opacity] duration-700 ease-out will-change-[transform,opacity] ${
        showImmediately
          ? 'translate-y-0 opacity-100'
          : 'translate-y-5 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}