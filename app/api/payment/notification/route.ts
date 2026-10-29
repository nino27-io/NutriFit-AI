import { NextResponse } from 'next/server';
import {
  verifyMidtransSignature,
  updateTransactionFromMidtrans,
} from '@/lib/paymentServerStore';
import { getSubscriptionPlan } from '@/lib/subscriptionConfig';

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const orderId = String(payload.order_id || '');
    const statusCode = String(payload.status_code || '');
    const grossAmount = String(payload.gross_amount || '');
    const signatureKey = String(payload.signature_key || '');
    const transactionStatus = String(payload.transaction_status || '');
    const fraudStatus = String(payload.fraud_status || '');
    const paymentType = String(payload.payment_type || 'qris');

    if (!orderId || !signatureKey) {
      return NextResponse.json(
        { error: 'Payload notifikasi tidak lengkap.' },
        { status: 400 }
      );
    }

    const serverKey = sanitizeKey(process.env.MIDTRANS_SERVER_KEY);
    if (!serverKey) {
      return NextResponse.json(
        { error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi.' },
        { status: 500 }
      );
    }

    // 1. Verifikasi Signature Key SHA512 secara ketat
    const isValidSignature = verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey
    );

    if (!isValidSignature) {
      console.error(`Webhook ditolak: Signature tidak valid untuk ${orderId}`);
      return NextResponse.json(
        { error: 'Invalid signature key' },
        { status: 403 }
      );
    }

    // 2. Verifikasi kecocokan nominal gross_amount dengan harga resmi paket
    const expectedPlan = orderId.includes('-M30-')
      ? getSubscriptionPlan('monthly')
      : getSubscriptionPlan('weekly');
    const numericGross = Math.round(Number(grossAmount));

    if (numericGross !== expectedPlan.price) {
      console.error(
        `Webhook ditolak: Nominal ${numericGross} tidak sesuai harga paket ${expectedPlan.price}`
      );
      return NextResponse.json(
        { error: 'Gross amount mismatch' },
        { status: 400 }
      );
    }

    // 3. Perbarui status transaksi secara idempoten
    const result = updateTransactionFromMidtrans({
      orderId,
      transactionStatus,
      fraudStatus,
      paymentType,
      grossAmount: numericGross,
    });

    return NextResponse.json({
      status: 'OK',
      orderId: result.record.orderId,
      lifecycleStatus: result.record.status,
      isSettled: result.isSettled,
      alreadyProcessed: result.alreadyProcessed,
      expiresAt: result.record.expiresAt,
    });
  } catch (error: unknown) {
    console.error('Midtrans Webhook Notification Error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses webhook notifikasi.' },
      { status: 500 }
    );
  }
}