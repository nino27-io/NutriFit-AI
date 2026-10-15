'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

type AppRouterInstance = ReturnType<typeof useRouter>;

/**
 * 1. Class EasingMath
 * Menyediakan fungsi kurva matematika untuk pergerakan scroll yang natural (cepat di awal, melambat halus di akhir).
 */
class EasingMath {
  public static easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }
}

/**
 * 2. Class RafSmoothScrollEngine
 * Mesin scroll berbasis requestAnimationFrame (60/120fps) yang tidak bergantung pada CSS scroll-behavior bawaan OS.
 */
class RafSmoothScrollEngine {
  private animationFrameId: number | null = null;
  private readonly headerOffsetPx: number;
  private readonly defaultDurationMs: number;
  private readonly cancelHandler: () => void;

  constructor(headerOffsetPx = 92, defaultDurationMs = 750) {
    this.headerOffsetPx = headerOffsetPx;
    this.defaultDurationMs = defaultDurationMs;
    this.cancelHandler = this.stopOngoingScroll.bind(this);
  }

  public stopOngoingScroll(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('wheel', this.cancelHandler);
    window.removeEventListener('touchmove', this.cancelHandler);
  }

  public animateScrollTo(targetY: number, durationMs = this.defaultDurationMs, onComplete?: () => void): void {
    if (typeof window === 'undefined') return;

    this.stopOngoingScroll();

    const startY = window.scrollY || window.pageYOffset;
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clampedTargetY = Math.min(Math.max(0, targetY), maxScrollY);
    const distance = clampedTargetY - startY;

    // Jika jarak sangat dekat (< 4px), langsung selesaikan
    if (Math.abs(distance) < 4 || durationMs <= 0) {
      window.scrollTo(0, clampedTargetY);
      onComplete?.();
      return;
    }

    // Izinkan pengguna membatalkan animasi jika mereka memutar roda mouse di tengah jalan
    window.addEventListener('wheel', this.cancelHandler, { passive: true, once: true });
    window.addEventListener('touchmove', this.cancelHandler, { passive: true, once: true });

    let startTime: number | null = null;

    const step = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = EasingMath.easeOutQuart(progress);

      window.scrollTo(0, Math.round(startY + distance * easedProgress));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.stopOngoingScroll();
        onComplete?.();
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  public scrollToTop(instant = false): void {
    if (instant) {
      this.stopOngoingScroll();
      window.scrollTo(0, 0);
      return;
    }
    this.animateScrollTo(0, this.defaultDurationMs);
  }

  public scrollToElementId(elementId: string): boolean {
    if (typeof document === 'undefined' || !elementId) return false;

    const cleanId = decodeURIComponent(elementId.replace(/^#/, ''));
    const targetEl = document.getElementById(cleanId);
    if (!targetEl) return false;

    const rect = targetEl.getBoundingClientRect();
    const absoluteTop = rect.top + (window.scrollY || window.pageYOffset);
    const destinationY = Math.max(0, absoluteTop - this.headerOffsetPx);

    this.animateScrollTo(destinationY, this.defaultDurationMs, () => {
      // Fokus dipindahkan HANYA SETELAH scroll selesai agar browser tidak melompat
      targetEl.setAttribute('tabindex', '-1');
      targetEl.focus({ preventScroll: true });
    });

    return true;
  }
}

/**
 * 3. Class RouteTransitionController
 * Mengelola intersepsi klik menu navbar (#hash) dan perpindahan halaman (/, /input, /result).
 */
class RouteTransitionController {
  private router: AppRouterInstance;
  private currentPathname: string;
  private scroller: RafSmoothScrollEngine;
  private readonly boundClickHandler: (e: MouseEvent) => void;

  constructor(router: AppRouterInstance, pathname: string) {
    this.router = router;
    this.currentPathname = pathname;
    this.scroller = new RafSmoothScrollEngine(92, 750);
    this.boundClickHandler = this.handleDocumentClick.bind(this);
  }

  public mount(): void {
    document.addEventListener('click', this.boundClickHandler, { capture: true });
  }

  public destroy(): void {
    this.scroller.stopOngoingScroll();
    document.removeEventListener('click', this.boundClickHandler, { capture: true });
  }

  public syncRoute(router: AppRouterInstance, pathname: string): void {
    const isRouteChanged = this.currentPathname !== pathname;
    this.router = router;
    this.currentPathname = pathname;

    if (isRouteChanged) {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        // Jika datang dari halaman lain menuju #section (misal /result -> /#sumber-belajar)
        window.scrollTo(0, 0);
        setTimeout(() => {
          this.scroller.scrollToElementId(hash);
        }, 120);
      } else {
        // Pindah halaman normal: reset ke atas secara instan
        this.scroller.scrollToTop(true);
        setTimeout(() => {
          const heading = document.querySelector('h1');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }
        }, 80);
      }
    }
  }

  private runViewTransition(action: () => void): void {
    const doc = document as DocumentWithViewTransition;
    if (!doc.startViewTransition) {
      action();
      return;
    }
    doc.startViewTransition(() => {
      action();
    });
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const anchor = (e.target as HTMLElement | null)?.closest('a');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href');
    if (
      !rawHref ||
      rawHref.startsWith('http') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      anchor.target === '_blank' ||
      anchor.hasAttribute('download')
    ) {
      return;
    }

    // KASUS 1: Klik menu Navbar dengan #hash (baik "#layanan" maupun "/#layanan")
    if (rawHref.includes('#')) {
      const [pathPart, hashPart] = rawHref.split('#');
      const targetPath = pathPart || this.currentPathname;

      // Jika kita sudah berada di halaman tersebut (misal sedang di "/" dan klik "#layanan" atau "/#layanan")
      if (targetPath === this.currentPathname) {
        e.preventDefault();
        e.stopPropagation();

        if (!hashPart) {
          this.scroller.scrollToTop(false);
          window.history.pushState(null, '', this.currentPathname);
          return;
        }

        const scrolled = this.scroller.scrollToElementId(hashPart);
        if (scrolled) {
          window.history.pushState(null, '', `#${hashPart}`);
        }
        return;
      }

      // Jika klik link ber-hash menuju halaman lain (misal dari "/result" klik "/#sumber-belajar")
      e.preventDefault();
      e.stopPropagation();
      this.runViewTransition(() => {
        this.router.push(rawHref);
      });
      return;
    }

    // KASUS 2: Klik menu "Beranda" ("/") saat sudah berada di "/" -> Geser halus ke paling atas
    if (rawHref === this.currentPathname) {
      e.preventDefault();
      e.stopPropagation();
      this.scroller.scrollToTop(false);
      return;
    }

    // KASUS 3: Perpindahan antar halaman (/, /input, /result)
    if (rawHref.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      this.runViewTransition(() => {
        this.router.push(rawHref);
      });
    }
  }
}

export function ViewTransitionHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const controllerRef = useRef<RouteTransitionController | null>(null);

  useEffect(() => {
    const controller = new RouteTransitionController(router, pathname);
    controller.mount();
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.syncRoute(router, pathname);
  }, [pathname, router]);

  return null;
}