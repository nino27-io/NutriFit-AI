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

// Menangani ping tes atau verifikasi URL dari Midtrans
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'NutriFit Midtrans Notification Webhook is active and reachable.',
  });
}

export async function POST(request: Request) {
  try {
    let payload: Record<string, unknown> = {};
    try {
      payload = await request.json();
    } catch {
      // Jika Midtrans mengirim body kosong saat tombol "Test notification URL" ditekan
      return NextResponse.json({
        status: 'OK',
        message: 'Ping test acknowledged',
      });
    }

    const orderId = String(payload.order_id || '');
    const statusCode = String(payload.status_code || '');
    const grossAmount = String(payload.gross_amount || '');
    const signatureKey = String(payload.signature_key || '');
    const transactionStatus = String(payload.transaction_status || '');
    const fraudStatus = String(payload.fraud_status || '');
    const paymentType = String(payload.payment_type || 'qris');

    // Jika ini adalah payload uji coba dummy dari dashboard Midtrans
    if (!orderId || !signatureKey) {
      return NextResponse.json({
        status: 'OK',
        message: 'Test notification received successfully',
      });
    }

    const serverKey = sanitizeKey(process.env.MIDTRANS_SERVER_KEY);
    if (!serverKey) {
      return NextResponse.json(
        { error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi.' },
        { status: 500 }
      );
    }

    // 1. Verifikasi Signature Key SHA-512 resmi Midtrans
    const isValidSignature = verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey
    );

    if (!isValidSignature) {
      console.warn(`Webhook: Signature key tidak valid untuk order ${orderId}`);
      // Tetap kembalikan 200 OK agar Midtrans tidak melakukan retry spam, tapi jangan ubah status database
      return NextResponse.json(
        { status: 'IGNORED', message: 'Invalid signature key' },
        { status: 200 }
      );
    }

    // 2. Verifikasi kecocokan nominal gross_amount dengan harga resmi paket
    const expectedPlan = orderId.includes('-M30-')
      ? getSubscriptionPlan('monthly')
      : getSubscriptionPlan('weekly');
    const numericGross = Math.round(Number(grossAmount));

    if (numericGross !== expectedPlan.price) {
      console.warn(
        `Webhook: Nominal ${numericGross} tidak sesuai harga paket ${expectedPlan.price}`
      );
      return NextResponse.json(
        { status: 'IGNORED', message: 'Gross amount mismatch' },
        { status: 200 }
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