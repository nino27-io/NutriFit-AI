'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  X,
  History,
  LogOut,
  QrCode,
  UserCheck,
  Trash2,
  Calendar,
  AlertCircle,
  Ticket,
  RefreshCw,
  Download,
  Clock,
  MessageCircle,
} from 'lucide-react';
import {
  UserTier,
  GoogleAccountProfile,
  HistoryRecord,
  AccessPolicy,
  AuthTierController,
} from '@/lib/authTierService';
import {
  getSubscriptionPlan,
  SubscriptionPlanId,
} from '@/lib/subscriptionConfig';

const USED_COUPONS_STORAGE_KEY = 'nutrifit_used_coupons_v2';

function getLocalUsedCoupons(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USED_COUPONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function markCouponUsedLocally(code: string, email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalUsedCoupons();
    current[code] = email;
    localStorage.setItem(USED_COUPONS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Abaikan jika localStorage penuh
  }
}

interface NormalizedUiPlan {
  id: SubscriptionPlanId;
  title: string;
  priceFormatted: string;
  durationDays: number;
  durationText: string;
  badge?: string;
}

function getNormalizedUiPlan(planId: SubscriptionPlanId): NormalizedUiPlan {
  const raw = getSubscriptionPlan(planId) as unknown as Record<string, unknown>;

  const rawPrice =
    raw.price ?? raw.priceIdr ?? raw.priceIDR ?? raw.amount ?? raw.cost;
  const fallbackPrice = planId === 'monthly' ? 15900 : 5900;
  const numericPrice =
    typeof rawPrice === 'number' && rawPrice > 0
      ? Math.round(rawPrice)
      : fallbackPrice;

  const priceFormatted =
    typeof raw.priceFormatted === 'string' && raw.priceFormatted
      ? raw.priceFormatted
      : `Rp${numericPrice.toLocaleString('id-ID')}`;

  const title =
    typeof raw.title === 'string' && raw.title
      ? raw.title
      : typeof raw.name === 'string' && raw.name
        ? raw.name
        : planId === 'monthly'
          ? 'Paket Bulanan'
          : 'Paket Mingguan';

  const durationDays =
    typeof raw.durationDays === 'number' && raw.durationDays > 0
      ? raw.durationDays
      : planId === 'monthly'
        ? 30
        : 7;

  const durationText =
    typeof raw.durationText === 'string' && raw.durationText
      ? raw.durationText
      : `${durationDays} Hari Akses Penuh`;

  const badge =
    typeof raw.badge === 'string' && raw.badge ? raw.badge : undefined;

  return {
    id: planId,
    title,
    priceFormatted,
    durationDays,
    durationText,
    badge,
  };
}

function getSafeUserPicture(user: GoogleAccountProfile | null): string | null {
  if (!user) return null;
  const raw = user as unknown as Record<string, unknown>;
  return typeof raw.picture === 'string' && raw.picture ? raw.picture : null;
}

function activatePremiumSafe(invoiceLabel: string, durationDays: number): void {
  const fn = AuthTierController.activatePremiumSubscription as unknown as (
    invoice: string,
    days?: number
  ) => void;
  fn(invoiceLabel, durationDays);
}

function normalizeWhatsappNumber(raw?: string): string {
  const digits = (raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function formatCountdown(secondsLeft: number): string {
  const safe = Math.max(0, secondsLeft);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface AccountStatusBarProps {
  tier: UserTier;
  user: GoogleAccountProfile | null;
  historyCount: number;
  onClickLogin: () => void;
  onClickSubscribe: () => void;
  onClickOpenHistory: () => void;
  onClickLogout: () => void;
  onClickDowngradeDemo?: () => void;
}

export function AccountStatusBar({
  tier,
  user,
  historyCount,
  onClickLogin,
  onClickSubscribe,
  onClickOpenHistory,
  onClickLogout,
}: AccountStatusBarProps) {
  const badge = AccessPolicy.getTierBadgeMeta(tier);
  const weeklyPlan = getNormalizedUiPlan('weekly');
  const userPicture = getSafeUserPicture(user);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'expired' | 'invalid';
    text: string;
  } | null>(null);

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode || !user?.email) return;

    setCouponLoading(true);
    setCouponFeedback(null);

    try {
      const localUsed = getLocalUsedCoupons();
      if (localUsed[normalizedCode]) {
        setCouponFeedback({
          type: 'expired',
          text: 'Kupon sudah kedaluwarsa karena telah digunakan sebelumnya.',
        });
        return;
      }

      const res = await fetch('/api/subscription/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalizedCode,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        if (data.status === 'EXPIRED') {
          markCouponUsedLocally(normalizedCode, 'used');
        }
        setCouponFeedback({
          type: data.status === 'EXPIRED' ? 'expired' : 'invalid',
          text: data.message || 'Kode kupon tidak valid.',
        });
        return;
      }

      markCouponUsedLocally(normalizedCode, user.email);
      setCouponCode('');
      setCouponFeedback({
        type: 'success',
        text: data.message || 'Kupon berhasil diaktifkan!',
      });

      activatePremiumSafe(
        `Token: ${String(data.code || normalizedCode)}`,
        Number(data.durationDays) || 30
      );
    } catch {
      setCouponFeedback({
        type: 'invalid',
        text: 'Gagal menghubungi server, silakan periksa koneksi Anda.',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="no-print mb-6 rounded-[1.75rem] border border-white bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            userPicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userPicture}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#05203C] text-xs font-extrabold text-[#38D46A]">
                {user.avatarInitials}
              </div>
            )
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
              <Lock className="h-4 w-4" />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-0.5 text-[11px] font-extrabold ${badge.badgeClass}`}
              >
                {badge.label}
              </span>
              {user ? (
                <span className="text-xs font-extrabold text-[#0B2545]">
                  {user.name} ({user.email})
                </span>
              ) : null}
              {tier === 'premium' && user?.subscriptionInvoice ? (
                <span className="rounded-full bg-[#EEF5FC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B4B84]">
                  {user.subscriptionInvoice}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-[#1E293B]">
              {badge.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClickOpenHistory}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#EEF5FC] px-3.5 py-2 text-xs font-extrabold text-[#0B2545] transition hover:bg-[#DCEBF8]"
          >
            <History className="h-3.5 w-3.5 text-[#0B4B84]" />
            <span>
              {tier === 'guest'
                ? 'Riwayat (Tidak Tercatat)'
                : `Riwayat Akun (${historyCount})`}
            </span>
          </button>

          {tier === 'guest' ? (
            <>
              <button
                type="button"
                onClick={onClickLogin}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm transition hover:bg-slate-50"
              >
                <span className="font-black text-[#0B4B84]">G</span>
                <span>Masuk dengan Google</span>
              </button>
              <button
                type="button"
                onClick={onClickSubscribe}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#05203C] px-4 py-2 text-xs font-extrabold text-[#38D46A] shadow-sm transition hover:bg-[#0B2545]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Beli Premium (Mulai {weeklyPlan.priceFormatted})</span>
              </button>
            </>
          ) : null}

          {tier === 'free_registered' ? (
            <>
              <button
                type="button"
                onClick={onClickSubscribe}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#38D46A] px-4 py-2 text-xs font-extrabold text-[#0B2545] shadow-sm transition hover:brightness-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Beli Premium (Mulai {weeklyPlan.priceFormatted})</span>
              </button>
              <button
                type="button"
                onClick={onClickLogout}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </>
          ) : null}

          {tier === 'premium' ? (
            <button
              type="button"
              onClick={onClickLogout}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          ) : null}
        </div>
      </div>

      {user && tier === 'free_registered' ? (
        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <form
            onSubmit={handleRedeemCoupon}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2545]">
              <Ticket className="h-4 w-4 text-[#0B4B84]" />
              <span>Punya Kode Token Penguji / Kupon Demo?</span>
            </div>

            <div className="flex flex-col gap-1 sm:w-96">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode Token"
                  className="flex-1 rounded-full border border-slate-300 bg-[#EEF5FC]/60 px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-[#0B2545] uppercase placeholder-slate-400 focus:border-[#0B4B84] focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="rounded-full bg-[#05203C] px-4 py-1.5 text-xs font-extrabold text-[#38D46A] transition hover:bg-[#0B2545] disabled:opacity-50"
                >
                  {couponLoading ? 'Mengecek...' : 'Pakai Token'}
                </button>
              </div>
              {couponFeedback ? (
                <p
                  className={`px-2 text-[11px] font-bold ${
                    couponFeedback.type === 'success'
                      ? 'text-emerald-600'
                      : couponFeedback.type === 'expired'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                  }`}
                >
                  {couponFeedback.text}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

interface GoogleLoginModalProps {
  isOpen: boolean;
  pendingSubscriptionIntent: boolean;
  defaultName?: string;
  onClose: () => void;
  onSuccessLogin: (name: string, email: string, picture?: string) => void;
}

export function GoogleLoginModal({
  isOpen,
  pendingSubscriptionIntent,
  onClose,
  onSuccessLogin,
}: GoogleLoginModalProps) {
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim().replace(
      /^["']|["']$/g,
      ''
    ) || '';

  const isClientIdConfigured =
    Boolean(googleClientId) &&
    !googleClientId.includes('MASUKKAN_GOOGLE_CLIENT_ID');

  useEffect(() => {
    if (!isOpen || !isClientIdConfigured) return;

    setAuthError(null);
    let isCancelled = false;

    const initializeGoogleSignIn = () => {
      if (isCancelled || !googleButtonContainerRef.current) return;

      const googleObj = (
        window as unknown as {
          google?: {
            accounts?: {
              id?: {
                initialize: (config: {
                  client_id: string;
                  callback: (response: { credential?: string }) => void;
                  ux_mode?: 'popup';
                }) => void;
                renderButton: (
                  parent: HTMLElement,
                  options: Record<string, string | number>
                ) => void;
              };
            };
          };
        }
      ).google;

      if (!googleObj?.accounts?.id) return;

      googleObj.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: 'popup',
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setAuthError('Login Google dibatalkan.');
            return;
          }

          try {
            setIsVerifying(true);
            setAuthError(null);

            const verifyRes = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = await verifyRes.json();
            if (!verifyRes.ok || !data?.user?.email) {
              throw new Error(
                data?.error || 'Gagal memverifikasi akun Google Anda.'
              );
            }

            setIsVerifying(false);
            onSuccessLogin(
              data.user.name,
              data.user.email,
              data.user.picture
            );
          } catch (err: unknown) {
            setIsVerifying(false);
            setAuthError(
              err instanceof Error
                ? err.message
                : 'Gagal memverifikasi akun Google.'
            );
          }
        },
      });

      googleButtonContainerRef.current.innerHTML = '';
      googleObj.accounts.id.renderButton(googleButtonContainerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 340,
      });
    };

    const existingScript = document.getElementById('google-gsi-client-script');
    if (existingScript) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        if (!isCancelled) {
          setAuthError(
            'Gagal memuat layanan Google Sign-In. Periksa koneksi internet Anda.'
          );
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, isClientIdConfigured, googleClientId, onSuccessLogin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05203C]/65 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B2545] hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF5FC] text-lg font-black text-[#0B4B84]">
            G
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-[#0B4B84] uppercase">
              Google OAuth 2.0 Resmi
            </span>
            <h3 className="text-xl font-extrabold text-[#0B2545]">
              Masuk dengan Akun Google
            </h3>
          </div>
        </div>

        {pendingSubscriptionIntent ? (
          <div className="mt-4 rounded-2xl border border-[#0B4B84]/25 bg-[#EEF5FC] p-4 text-xs font-medium text-[#0B2545]">
            <strong className="block font-extrabold text-[#0B4B84]">
              Langkah 1 dari 2: Login Google Diperlukan
            </strong>
            Silakan masuk dengan akun Google asli Anda terlebih dahulu agar
            riwayat dan status langganan Premium terikat ke akun Google Anda.
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed font-medium text-[#1E293B]">
            Gunakan akun Google resmi Anda. Setelah berhasil masuk, status Anda
            menjadi <strong>Pengguna Biasa (Free Registered)</strong> dan
            seluruh riwayat penggunaan akan tercatat di akun Anda.
          </p>
        )}

        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-[#EEF5FC]/60 p-6">
          {!isClientIdConfigured ? (
            <div className="flex items-start gap-2.5 text-left text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <strong className="block font-extrabold">
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID Belum Diisi
                </strong>
                Masukkan Client ID Google OAuth Anda di file{' '}
                <code>.env.local</code>.
              </div>
            </div>
          ) : (
            <>
              <div
                ref={googleButtonContainerRef}
                className="flex min-h-[44px] items-center justify-center"
              />
              {isVerifying ? (
                <p className="mt-3 text-xs font-extrabold text-[#0B4B84]">
                  Memverifikasi kredensial akun Google Anda...
                </p>
              ) : null}
            </>
          )}
        </div>

        {authError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {authError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ActiveQrisOrderState {
  merchantRef: string;
  qrUrl: string;
  basePriceFormatted: string;
  totalPriceFormatted: string;
  uniqueCode: number;
  planTitle: string;
  durationDays: number;
  merchantName: string;
  expiresAt: string;
}

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  user: GoogleAccountProfile | null;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: string, durationDays?: number) => void;
}

export function SubscriptionPaymentModal({
  isOpen,
  user,
  onClose,
  onConfirmPayment,
}: SubscriptionPaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanId>('weekly');
  const [isGeneratingQris, setIsGeneratingQris] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [qrisOrder, setQrisOrder] = useState<ActiveQrisOrderState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'expired' | 'invalid';
    text: string;
  } | null>(null);

  const hasActivatedRef = useRef(false);

  const planOptions: NormalizedUiPlan[] = [
    getNormalizedUiPlan('weekly'),
    getNormalizedUiPlan('monthly'),
  ];
  const activePlan = getNormalizedUiPlan(selectedPlanId);
  const adminWhatsapp = normalizeWhatsappNumber(
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP
  );

  // Hitung mundur 15 menit
  useEffect(() => {
    if (!isOpen || !qrisOrder?.expiresAt) return;

    const updateTimer = () => {
      const diffSec = Math.floor(
        (new Date(qrisOrder.expiresAt).getTime() - Date.now()) / 1000
      );
      if (diffSec <= 0) {
        setSecondsLeft(0);
        setIsExpired(true);
      } else {
        setSecondsLeft(diffSec);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, qrisOrder]);

  // Auto-polling status PAID setiap 3 detik dari Supabase
  useEffect(() => {
    if (!isOpen || !qrisOrder?.merchantRef || isExpired) return;
    hasActivatedRef.current = false;

    const pollTimer = setInterval(async () => {
      if (hasActivatedRef.current) return;
      try {
        const res = await fetch(
          `/api/checkout?merchantRef=${encodeURIComponent(
            qrisOrder.merchantRef
          )}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (data?.paid && !hasActivatedRef.current) {
          hasActivatedRef.current = true;
          clearInterval(pollTimer);
          onConfirmPayment(
            `${qrisOrder.planTitle} (${qrisOrder.totalPriceFormatted}) • QRIS [${qrisOrder.merchantRef}]`,
            qrisOrder.durationDays
          );
        } else if (data?.status === 'EXPIRED') {
          setIsExpired(true);
          clearInterval(pollTimer);
        }
      } catch {
        // Coba lagi di siklus polling berikutnya
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [isOpen, qrisOrder, isExpired, onConfirmPayment]);

  if (!isOpen || !user) return null;

  const handleGenerateQris = async () => {
    setIsGeneratingQris(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setIsExpired(false);
    hasActivatedRef.current = false;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          planId: activePlan.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.qrUrl) {
        throw new Error(data?.error || 'Gagal membuat kode QRIS Dinamis.');
      }

      setQrisOrder({
        merchantRef: String(data.merchantRef),
        qrUrl: String(data.qrUrl),
        basePriceFormatted: String(
          data.basePriceFormatted || activePlan.priceFormatted
        ),
        totalPriceFormatted: String(
          data.totalPriceFormatted || activePlan.priceFormatted
        ),
        uniqueCode: Number(data.uniqueCode) || 0,
        planTitle: String(data.planTitle || activePlan.title),
        durationDays: Number(data.durationDays) || activePlan.durationDays,
        merchantName: String(data.merchantName || 'NutriFit AI'),
        expiresAt: String(data.expiresAt),
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan saat memuat kode QRIS.'
      );
    } finally {
      setIsGeneratingQris(false);
    }
  };

  const handleCheckPaymentNow = async () => {
    if (!qrisOrder?.merchantRef) return;
    setIsCheckingStatus(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch(
        `/api/checkout?merchantRef=${encodeURIComponent(
          qrisOrder.merchantRef
        )}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data?.paid) {
        hasActivatedRef.current = true;
        onConfirmPayment(
          `${qrisOrder.planTitle} (${qrisOrder.totalPriceFormatted}) • QRIS [${qrisOrder.merchantRef}]`,
          qrisOrder.durationDays
        );
        return;
      }

      if (data?.status === 'EXPIRED') {
        setIsExpired(true);
        setInfoMessage(
          'Masa berlaku kode QRIS telah habis. Silakan buat kode QRIS baru.'
        );
        return;
      }

      setInfoMessage(
        'Pembayaran belum masuk. Setelah transfer berhasil, status akun Anda akan berubah menjadi Premium secara otomatis dalam beberapa detik.'
      );
    } catch {
      setErrorMessage('Gagal memeriksa status transaksi ke server.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const buildFallbackHelpUrl = (): string => {
    if (!qrisOrder) return '#';
    const message = [
      'Halo Admin NutriFit AI, saya sudah membayar QRIS namun status belum berubah setelah 1 menit:',
      `• Email: ${user.email}`,
      `• Paket: ${qrisOrder.planTitle}`,
      `• Total Bayar: ${qrisOrder.totalPriceFormatted}`,
      `• ID Transaksi: ${qrisOrder.merchantRef}`,
    ].join('\n');
    return `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(message)}`;
  };

  const handleModalRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) return;

    setCouponLoading(true);
    setCouponFeedback(null);

    try {
      const localUsed = getLocalUsedCoupons();
      if (localUsed[normalizedCode]) {
        setCouponFeedback({
          type: 'expired',
          text: 'Kupon sudah kedaluwarsa karena telah digunakan sebelumnya.',
        });
        return;
      }

      const res = await fetch('/api/subscription/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalizedCode,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        if (data.status === 'EXPIRED') {
          markCouponUsedLocally(normalizedCode, 'used');
        }
        setCouponFeedback({
          type: data.status === 'EXPIRED' ? 'expired' : 'invalid',
          text: data.message || 'Kode kupon tidak valid.',
        });
        return;
      }

      markCouponUsedLocally(normalizedCode, user.email);
      setCouponCode('');
      onConfirmPayment(
        `Token: ${String(data.code || normalizedCode)}`,
        Number(data.durationDays) || activePlan.durationDays
      );
    } catch {
      setCouponFeedback({
        type: 'invalid',
        text: 'Gagal menghubungi server, silakan periksa koneksi Anda.',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05203C]/65 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B2545] hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FC] px-3 py-1 text-[11px] font-extrabold text-[#0B4B84]">
          <UserCheck className="h-3.5 w-3.5 text-[#38D46A]" />
          <span>Akun Google Terverifikasi: {user.email}</span>
        </div>

        <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0B2545]">
          Pembayaran QRIS Otomatis
        </h3>
        <p className="mt-1 text-xs font-medium text-[#1E293B]">
          Nominal terkunci otomatis. Akun langsung aktif menjadi{' '}
          <strong>Premium</strong> beberapa detik setelah pembayaran berhasil
          tanpa perlu konfirmasi manual.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {planOptions.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const calendarColorClass = isSelected
              ? 'text-[#38D46A]'
              : 'text-[#0B4B84]';

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setQrisOrder(null);
                  setInfoMessage(null);
                  setErrorMessage(null);
                  setIsExpired(false);
                }}
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition ${
                  isSelected
                    ? 'border-[#05203C] bg-[#05203C] text-white shadow-md'
                    : 'border-slate-200 bg-[#EEF5FC]/60 text-[#0B2545] hover:border-[#0B4B84]'
                }`}
              >
                {plan.badge ? (
                  <span className="mb-2 inline-block w-fit rounded-full bg-[#38D46A] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B2545]">
                    {plan.badge}
                  </span>
                ) : null}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold">{plan.title}</span>
                    <Calendar className={`h-4 w-4 ${calendarColorClass}`} />
                  </div>
                  <div
                    className={`mt-1 text-2xl font-extrabold ${
                      isSelected ? 'text-[#38D46A]' : 'text-[#0B2545]'
                    }`}
                  >
                    {plan.priceFormatted}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-[#E0F2FE]' : 'text-[#0B4B84]'
                    }`}
                  >
                    {plan.durationText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {qrisOrder ? (
          <div className="mt-5 rounded-2xl border-2 border-[#0B4B84]/25 bg-[#EEF5FC] p-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#05203C] px-3.5 py-1 text-[11px] font-extrabold text-[#38D46A]">
                <QrCode className="h-3.5 w-3.5" />
                <span>Total Bayar: {qrisOrder.totalPriceFormatted}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                  isExpired
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-white text-[#0B4B84]'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>
                  {isExpired
                    ? 'Kedaluwarsa'
                    : `Sisa ${formatCountdown(secondsLeft)}`}
                </span>
              </span>
            </div>

            <p className="mt-2 text-[11px] font-semibold text-[#1E293B]">
              {qrisOrder.basePriceFormatted} + Rp{qrisOrder.uniqueCode} (kode
              unik verifikasi otomatis)
            </p>

            <div className="mx-auto mt-3 flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrisOrder.qrUrl}
                alt={`QRIS ${qrisOrder.merchantName}`}
                className={`h-full w-full object-contain ${
                  isExpired ? 'opacity-25 grayscale' : ''
                }`}
              />
            </div>

            <p className="mt-2.5 text-xs font-extrabold text-[#0B2545]">
              Merchant: {qrisOrder.merchantName} • ID: {qrisOrder.merchantRef}
            </p>

            {!isExpired ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  Menunggu pembayaran otomatis (halaman jangan ditutup)...
                </span>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              {isExpired ? (
                <button
                  type="button"
                  disabled={isGeneratingQris}
                  onClick={handleGenerateQris}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#38D46A] px-5 py-3 text-xs font-extrabold text-[#0B2545] transition hover:brightness-95"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Buat Kode QRIS Baru</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isCheckingStatus}
                    onClick={handleCheckPaymentNow}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#05203C] px-5 py-3 text-xs font-extrabold text-[#38D46A] transition hover:bg-[#0B2545] disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isCheckingStatus
                        ? 'Memeriksa Status...'
                        : 'Cek Status Pembayaran Sekarang'}
                    </span>
                  </button>

                  <a
                    href={qrisOrder.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`QRIS-${qrisOrder.merchantRef}.png`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-extrabold text-[#0B2545] transition hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5 text-[#0B4B84]" />
                    <span>Simpan Gambar QRIS</span>
                  </a>
                </>
              )}

              {adminWhatsapp ? (
                <a
                  href={buildFallbackHelpUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0B4B84] hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>
                    Sudah bayar tapi belum aktif dalam 1 menit? Hubungi Bantuan
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isGeneratingQris}
            onClick={handleGenerateQris}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#38D46A] px-6 py-3.5 text-sm font-extrabold text-[#0B2545] shadow-lg transition hover:brightness-95 disabled:opacity-60"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>
              {isGeneratingQris
                ? 'Menyiapkan Kode QRIS...'
                : `Bayar dengan QRIS (${activePlan.priceFormatted})`}
            </span>
          </button>
        )}

        {infoMessage ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
            {infoMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 border-t border-slate-200 pt-4">
          <form onSubmit={handleModalRedeemCoupon} className="space-y-2">
            <label className="block text-xs font-extrabold text-[#0B2545]">
              Punya Kode Token Penguji / Kupon Demo?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Masukkan Kode Token"
                className="flex-1 rounded-xl border border-slate-300 bg-[#EEF5FC]/60 px-3.5 py-2 text-xs font-extrabold tracking-wider text-[#0B2545] uppercase focus:border-[#0B4B84] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={couponLoading || !couponCode.trim()}
                className="rounded-xl bg-[#05203C] px-4 py-2 text-xs font-extrabold text-[#38D46A] transition hover:bg-[#0B2545] disabled:opacity-50"
              >
                {couponLoading ? 'Mengecek...' : 'Pakai'}
              </button>
            </div>
            {couponFeedback ? (
              <p
                className={`text-xs font-bold ${
                  couponFeedback.type === 'success'
                    ? 'text-emerald-600'
                    : couponFeedback.type === 'expired'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}
              >
                {couponFeedback.text}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

interface HistoryModalProps {
  isOpen: boolean;
  tier: UserTier;
  user: GoogleAccountProfile | null;
  records: HistoryRecord[];
  onClose: () => void;
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
  onTriggerLogin: () => void;
}

export function HistoryModal({
  isOpen,
  tier,
  user,
  records,
  onClose,
  onSelectRecord,
  onClearHistory,
  onTriggerLogin,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05203C]/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-white bg-white p-6 text-[#0B2545] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B2545] hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] text-[#0B4B84]">
            <History className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-[#0B4B84] uppercase">
              Log Penggunaan Akun
            </span>
            <h3 className="text-xl font-extrabold text-[#0B2545]">
              Riwayat Analisis Biometrik
            </h3>
          </div>
        </div>

        {tier === 'guest' || !user ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center">
            <Lock className="mx-auto h-8 w-8 text-amber-600" />
            <h4 className="mt-2 text-sm font-extrabold text-[#0B2545]">
              Riwayat Tidak Tercatat pada Status Pengunjung (Guest)
            </h4>
            <p className="mt-1 text-xs font-medium text-[#1E293B]">
              Silakan masuk menggunakan akun Google asli Anda terlebih dahulu
              agar setiap riwayat penggunaan tercatat otomatis di dalam akun.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTriggerLogin();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#05203C] px-5 py-2.5 text-xs font-extrabold text-[#38D46A]"
            >
              Masuk dengan Google Sekarang
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#EEF5FC] p-6 text-center text-xs font-semibold text-[#1E293B]">
            Belum ada riwayat penggunaan tercatat pada akun{' '}
            <strong>{user.email}</strong>.
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#1E293B]">
              <span>Akun: {user.email}</span>
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center gap-1 text-rose-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[#EEF5FC]/60 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#05203C] px-2.5 py-0.5 text-[10px] font-extrabold text-[#38D46A]">
                        {rec.createdAt}
                      </span>
                      <span className="text-xs font-extrabold text-[#0B2545]">
                        {rec.input.heightCm} cm • {rec.input.weightKg} kg
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#1E293B]">
                      Berat Ideal: {rec.summary.idealWeightMinKg}–
                      {rec.summary.idealWeightMaxKg} kg • Target:{' '}
                      {rec.summary.targetCalories} kkal (
                      {rec.summary.proteinGrams}g protein)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecord(rec);
                      onClose();
                    }}
                    className="rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0B4B84] shadow-sm hover:bg-[#0B4B84] hover:text-white"
                  >
                    Gunakan Data Ini
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}