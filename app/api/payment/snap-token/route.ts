import { NextResponse } from 'next/server';
// @ts-expect-error midtrans-client tidak memiliki package types bawaan
import midtransClient from 'midtrans-client';
import {
  SubscriptionPlanId,
  getSubscriptionPlan,
} from '@/lib/subscriptionConfig';
import { registerPendingTransaction } from '@/lib/paymentServerStore';

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

    if (planId && planId !== 'weekly' && planId !== 'monthly') {
      return NextResponse.json(
        { error: 'Paket langganan tidak valid.' },
        { status: 400 }
      );
    }

    const selectedPlan = getSubscriptionPlan(planId);

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

    if (serverKey.includes('-client-')) {
      return NextResponse.json(
        {
          error:
            'Key tertukar: Anda memasukkan Client Key ke dalam MIDTRANS_SERVER_KEY. Gunakan kunci yang mengandung kata "-server-".',
        },
        { status: 500 }
      );
    }

    const isProduction = !serverKey.startsWith('SB-');

    const snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: serverKey,
      clientKey: clientKey,
    });

    const envPrefix = isProduction ? 'NFPROD' : 'NFSBOX';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `${envPrefix}-${selectedPlan.orderCode}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const baseParameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: selectedPlan.price,
      },
      item_details: [
        {
          id: selectedPlan.itemId,
          price: selectedPlan.price,
          quantity: 1,
          name: selectedPlan.invoiceLabel,
        },
      ],
      customer_details: {
        first_name: (name || 'Pengguna NutriFit').slice(0, 50),
        email: email.trim().toLowerCase(),
      },
    };

    let transaction;
    try {
      transaction = await snap.createTransaction({
        ...baseParameter,
        enabled_payments: ['other_qris', 'gopay'],
      });
    } catch {
      transaction = await snap.createTransaction(baseParameter);
    }

    // Catat pesanan berstatus 'pending' di penyimpanan server
    registerPendingTransaction({
      orderId,
      email,
      planId: selectedPlan.id,
      grossAmount: selectedPlan.price,
      durationDays: selectedPlan.durationDays,
    });

    const snapScriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId,
      planId: selectedPlan.id,
      planLabel: selectedPlan.invoiceLabel,
      durationDays: selectedPlan.durationDays,
      amount: selectedPlan.price,
      priceFormatted: selectedPlan.priceFormatted,
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
            'Midtrans 401 Unauthorized: Server Key ditolak oleh Midtrans. Pastikan Server Key di .env.local sesuai dengan mode akun dan restart npm run dev.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: rawMsg }, { status: 500 });
  }
}