import { NextResponse } from 'next/server';
// @ts-expect-error midtrans-client tidak memiliki package types bawaan
import midtransClient from 'midtrans-client';

export type SubscriptionPlanId = 'weekly' | 'monthly';

interface PlanConfig {
  id: string;
  label: string;
  price: number;
  durationLabel: string;
}

const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanConfig> = {
  weekly: {
    id: 'nutrifit-qris-weekly',
    label: 'Langganan Mingguan NutriFit AI (7 Hari)',
    price: 4000,
    durationLabel: '7 Hari (Mingguan)',
  },
  monthly: {
    id: 'nutrifit-qris-monthly',
    label: 'Langganan Bulanan NutriFit AI (30 Hari)',
    price: 12000,
    durationLabel: '30 Hari (Bulanan)',
  },
};

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, planId } = body as {
      name?: string;
      email?: string;
      planId?: SubscriptionPlanId;
    };

    if (!email) {
      return NextResponse.json(
        { error: 'Anda wajib login menggunakan akun Google terlebih dahulu.' },
        { status: 400 }
      );
    }

    const selectedPlan: PlanConfig =
      planId && SUBSCRIPTION_PLANS[planId]
        ? SUBSCRIPTION_PLANS[planId]
        : SUBSCRIPTION_PLANS.weekly;

    const serverKey = sanitizeKey(process.env.MIDTRANS_SERVER_KEY);
    const clientKey = sanitizeKey(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);

    if (!serverKey || serverKey.includes('MASUKKAN_')) {
      return NextResponse.json(
        {
          error:
            'MIDTRANS_SERVER_KEY belum diatur di .env.local. Pastikan sudah diisi lalu restart npm run dev.',
        },
        { status: 500 }
      );
    }

    // Cegah jika pengguna tidak sengaja menempelkan Client Key ke dalam MIDTRANS_SERVER_KEY
    if (serverKey.includes('-client-')) {
      return NextResponse.json(
        {
          error:
            'Key tertukar: Anda memasukkan Client Key ke dalam MIDTRANS_SERVER_KEY. Gunakan kunci yang mengandung kata "-server-".',
        },
        { status: 500 }
      );
    }

    // Deteksi otomatis: Jika berawalan "SB-", berarti Sandbox (false). Jika "Mid-", berarti Production (true).
    const isProduction = !serverKey.startsWith('SB-');

    const snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: serverKey,
      clientKey: clientKey,
    });

    const planCode = planId === 'monthly' ? 'BLN' : 'MGG';
    const orderId = `NF-${planCode}-${Date.now().toString(36).toUpperCase()}`;

    const baseParameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: selectedPlan.price, // Murni Rp4.000 atau Rp12.000 (Biaya Admin Rp0)
      },
      item_details: [
        {
          id: selectedPlan.id,
          price: selectedPlan.price,
          quantity: 1,
          name: selectedPlan.label,
        },
      ],
      customer_details: {
        first_name: name || 'Pengguna NutriFit',
        email: email,
      },
    };

    let transaction;
    try {
      // Prioritaskan hanya metode pembayaran QRIS
      transaction = await snap.createTransaction({
        ...baseParameter,
        enabled_payments: ['other_qris', 'gopay'],
      });
    } catch {
      // Fallback jika channel spesifik belum diaktifkan di dashboard Midtrans
      transaction = await snap.createTransaction(baseParameter);
    }

    const snapScriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId,
      planLabel: selectedPlan.label,
      amount: selectedPlan.price,
      isProduction: isProduction,
      snapScriptUrl: snapScriptUrl,
      clientKey: clientKey,
    });
  } catch (error: unknown) {
    console.error('Midtrans QRIS Snap Error:', error);
    const rawMsg =
      error instanceof Error ? error.message : 'Gagal membuat transaksi Midtrans';

    if (rawMsg.includes('401')) {
      return NextResponse.json(
        {
          error:
            'Midtrans 401 Unauthorized: Server Key ditolak oleh Midtrans. Pastikan Server Key di .env.local disalin utuh dari menu Settings -> Access Keys dan restart npm run dev.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: rawMsg }, { status: 500 });
  }
}