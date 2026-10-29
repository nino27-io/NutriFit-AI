'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  History,
  LogOut,
  QrCode,
  UserCheck,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  UserTier,
  GoogleAccountProfile,
  HistoryRecord,
  AccessPolicy,
} from '@/lib/authTierService';
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLAN_LIST,
  STARTING_PRICE_TEXT,
  getSubscriptionPlan,
} from '@/lib/subscriptionConfig';

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
  onClickDowngradeDemo,
}: AccountStatusBarProps) {
  const badge = AccessPolicy.getTierBadgeMeta(tier);

  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
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
              <span>Berlangganan (Mulai {STARTING_PRICE_TEXT})</span>
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
              <span>Upgrade Premium (Mulai {STARTING_PRICE_TEXT})</span>
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
          <>
            {onClickDowngradeDemo ? (
              <button
                type="button"
                onClick={onClickDowngradeDemo}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#1E293B] hover:bg-slate-100"
              >
                Simulasi Kembali ke Free
              </button>
            ) : null}
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
      </div>
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
            Anda saat ini berstatus <strong>Pengunjung (Guest)</strong>. Silakan
            masuk dengan akun Google asli Anda terlebih dahulu agar riwayat dan
            status langganan Premium terikat ke akun Google Anda.
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
                <code>.env.local</code> lalu jalankan ulang{' '}
                <code>npm run dev</code>.
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

        <p className="mt-5 text-center text-[11px] font-medium text-slate-500">
          Autentikasi diamankan langsung oleh Google Identity Services.
        </p>
      </div>
    </div>
  );
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const activePlan = getSubscriptionPlan(selectedPlanId);

  /**
   * Meminta backend memverifikasi ke server Midtrans apakah order_id benar-benar sudah 'settlement'
   */
  const verifyPaymentWithServer = async (orderIdToVerify: string) => {
    setIsVerifyingStatus(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderIdToVerify,
          email: user.email,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.verified) {
        setPendingOrderId(null);
        setIsVerifyingStatus(false);
        onConfirmPayment(
          `${verifyData.planTitle} (${verifyData.priceFormatted}) • QRIS [${verifyData.orderId}]`,
          verifyData.durationDays
        );
        return;
      }

      setIsVerifyingStatus(false);
      setInfoMessage(
        verifyData.message ||
          'Pembayaran masih menunggu penyelesaian. Jika menggunakan Sandbox, silakan simulasikan pembayaran di Simulator QRIS Midtrans lalu klik tombol Cek Status di bawah.'
      );
    } catch {
      setIsVerifyingStatus(false);
      setErrorMessage(
        'Gagal menghubungi server untuk memverifikasi status pembayaran.'
      );
    }
  };

  const triggerMidtransQrisPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/payment/snap-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          planId: activePlan.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Gagal menyiapkan transaksi QRIS.');
      }

      setPendingOrderId(data.orderId);

      const snapScriptUrl: string =
        data.snapScriptUrl ||
        process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
        'https://app.sandbox.midtrans.com/snap/snap.js';
      const clientKey: string =
        data.clientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

      const loadSnapScript = () => {
        return new Promise<void>((resolve, reject) => {
          const existingScript = document.getElementById(
            'midtrans-snap-script'
          ) as HTMLScriptElement | null;

          if (existingScript && existingScript.src !== snapScriptUrl) {
            existingScript.remove();
            delete (window as unknown as { snap?: unknown }).snap;
          }

          if (
            typeof window !== 'undefined' &&
            (window as unknown as { snap?: unknown }).snap
          ) {
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.id = 'midtrans-snap-script';
          script.src = snapScriptUrl;
          script.setAttribute('data-client-key', clientKey);
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error('Gagal memuat modul Snap Midtrans.'));
          document.body.appendChild(script);
        });
      };

      await loadSnapScript();

      const snapInstance = (
        window as unknown as {
          snap: {
            pay: (
              token: string,
              callbacks: {
                onSuccess: () => void;
                onPending: () => void;
                onError: () => void;
                onClose: () => void;
              }
            ) => void;
          };
        }
      ).snap;

      snapInstance.pay(data.token, {
        onSuccess: function () {
          setIsProcessing(false);
          // Wajib verifikasi ke server Midtrans sebelum mengaktifkan Premium!
          verifyPaymentWithServer(data.orderId);
        },
        onPending: function () {
          setIsProcessing(false);
          // TIDAK ADA LAGI AUTO-APPROVE TANPA BAYAR!
          verifyPaymentWithServer(data.orderId);
        },
        onError: function () {
          setIsProcessing(false);
          setErrorMessage('Pembayaran QRIS gagal atau ditolak.');
        },
        onClose: function () {
          setIsProcessing(false);
          setInfoMessage(
            `Pop-up ditutup. Jika Anda sudah memindai dan membayar QRIS (Order ID: ${data.orderId}), tekan tombol "Verifikasi Status Pembayaran" di bawah.`
          );
        },
      });
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi Midtrans.';
      setErrorMessage(msg);
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
          Pilih Paket Langganan Premium
        </h3>
        <p className="mt-1 text-xs font-medium text-[#1E293B]">
          Status Premium hanya aktif otomatis setelah pembayaran QRIS
          terverifikasi lunas oleh server Midtrans.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUBSCRIPTION_PLAN_LIST.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setPendingOrderId(null);
                  setInfoMessage(null);
                  setErrorMessage(null);
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
                    <Calendar
                      className={`h-4 w-4 ${
                        isSelected ? 'text-[#38D46A]' : 'text-[#0B4B84]'
                      }`}
                    />
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

                <p
                  className={`mt-2.5 text-[11px] leading-snug ${
                    isSelected ? 'text-[#E0F2FE]' : 'text-[#1E293B]'
                  }`}
                >
                  {plan.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-[#0B4B84]/20 bg-[#EEF5FC] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#05203C] text-[#38D46A]">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#0B2545]">
                    Metode Pembayaran: QRIS Instan
                  </span>
                  <span className="rounded-full bg-[#38D46A] px-2 py-0.5 text-[10px] font-extrabold text-[#0B2545]">
                    Biaya Admin Rp0
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#1E293B]">
                  Mendukung GoPay, DANA, OVO, ShopeePay, & Mobile Banking tanpa
                  potongan admin.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 space-y-1 border-t border-slate-200/80 pt-3 text-xs">
            <div className="flex justify-between font-semibold text-[#1E293B]">
              <span>
                Harga {activePlan.title} ({activePlan.durationText})
              </span>
              <span>{activePlan.priceFormatted}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#1E293B]">
              <span>Biaya Admin QRIS</span>
              <span className="font-extrabold text-[#0B4B84]">
                Rp0 (Gratis)
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-extrabold text-[#0B2545]">
              <span>Total Pembayaran Bersih</span>
              <span className="text-[#0B4B84]">
                {activePlan.priceFormatted}
              </span>
            </div>
          </div>
        </div>

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

        {pendingOrderId ? (
          <button
            type="button"
            disabled={isVerifyingStatus}
            onClick={() => verifyPaymentWithServer(pendingOrderId)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#05203C] bg-white px-6 py-3 text-xs font-extrabold text-[#05203C] transition hover:bg-[#EEF5FC] disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#0B4B84]" />
            <span>
              {isVerifyingStatus
                ? 'Memeriksa Status ke Server Midtrans...'
                : `Verifikasi Status Pembayaran (${pendingOrderId})`}
            </span>
          </button>
        ) : null}

        <button
          type="button"
          disabled={isProcessing || isVerifyingStatus}
          onClick={triggerMidtransQrisPayment}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#38D46A] px-6 py-3.5 text-sm font-extrabold text-[#0B2545] shadow-lg transition hover:brightness-95 disabled:opacity-60"
        >
          <ShieldCheck className="h-5 w-5" />
          <span>
            {isProcessing
              ? 'Menyiapkan Kode QRIS Midtrans...'
              : `Bayar ${activePlan.priceFormatted} dengan QRIS (Admin Rp0)`}
          </span>
        </button>
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