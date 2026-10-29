import { NextResponse } from 'next/server';
import {
  updateTransactionFromMidtrans,
  resolvePlanFromOrderId,
} from '@/lib/paymentServerStore';
import { getSubscriptionPlan } from '@/lib/subscriptionConfig';

function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

export async function POST(request: Request) {
  try {
    const { orderId, email } = (await request.json()) as {
      orderId?: string;
      email?: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID wajib disertakan untuk verifikasi.' },
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

    const isProduction = !serverKey.startsWith('SB-');
    const baseUrl = isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    // Panggil langsung Midtrans Core API untuk mengecek status asli transaksi
    const statusRes = await fetch(
      `${baseUrl}/v2/${encodeURIComponent(orderId)}/status`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        cache: 'no-store',
      }
    );

    const midtransData = await statusRes.json();

    if (!statusRes.ok || midtransData.status_code === '404') {
      return NextResponse.json(
        {
          verified: false,
          status: 'not_found',
          message:
            'Transaksi belum tercatat atau Anda belum memindai kode QRIS.',
        },
        { status: 200 }
      );
    }

    const transactionStatus = String(midtransData.transaction_status || '');
    const fraudStatus = String(midtransData.fraud_status || '');
    const paymentType = String(midtransData.payment_type || 'qris');
    const grossAmount = Math.round(Number(midtransData.gross_amount || 0));

    const planId = resolvePlanFromOrderId(orderId);
    const planConfig = getSubscriptionPlan(planId);

    // Pastikan nominal yang dibayarkan sesuai dengan harga resmi paket
    if (grossAmount !== planConfig.price) {
      return NextResponse.json(
        {
          verified: false,
          status: 'invalid_amount',
          message: 'Nominal transaksi tidak sesuai dengan ketentuan paket.',
        },
        { status: 400 }
      );
    }

    const updated = updateTransactionFromMidtrans({
      orderId,
      transactionStatus,
      fraudStatus,
      paymentType,
      grossAmount,
      customerEmail: email,
    });

    if (updated.isSettled) {
      return NextResponse.json({
        verified: true,
        status: 'settlement',
        orderId: updated.record.orderId,
        planId: planConfig.id,
        planTitle: planConfig.title,
        priceFormatted: planConfig.priceFormatted,
        durationDays: planConfig.durationDays,
        expiresAt: updated.record.expiresAt,
        invoiceLabel: `${updated.record.orderId} (${planConfig.title} ${planConfig.priceFormatted} • QRIS)`,
        message: 'Pembayaran terverifikasi lunas oleh server Midtrans.',
      });
    }

    return NextResponse.json({
      verified: false,
      status: updated.record.status,
      orderId: updated.record.orderId,
      message:
        updated.record.status === 'pending'
          ? 'Pembayaran masih berstatus Menunggu (Pending). Silakan selesaikan pembayaran QRIS Anda terlebih dahulu.'
          : `Pembayaran tidak berhasil (Status: ${updated.record.status.toUpperCase()}).`,
    });
  } catch (error: unknown) {
    console.error('Midtrans Verify Error:', error);
    return NextResponse.json(
      { error: 'Gagal memverifikasi status pembayaran ke server Midtrans.' },
      { status: 500 }
    );
  }
}