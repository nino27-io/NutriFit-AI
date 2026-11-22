import { NextResponse } from 'next/server';
import { matchAndMarkOrderPaid } from '@/lib/qrisSupabase';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function extractCandidateIdrAmounts(rawText: string): number[] {
  // Hapus akhiran sen seperti ,00 atau .00 agar tidak ikut tergabung jadi ratusan ribu
  const normalized = rawText.replace(/([.,]00)(?!\d)/g, '');
  const amounts = new Set<number>();

  // 1. Pola eksplisit setelah "Rp" atau "IDR" (misal: Rp5.942, Rp 15.937, IDR 15,937)
  const currencyRegex = /(?:rp|idr)\.?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,7})/gi;
  let match: RegExpExecArray | null;
  while ((match = currencyRegex.exec(normalized)) !== null) {
    const digits = match[1].replace(/[^\d]/g, '');
    const value = Number.parseInt(digits, 10);
    if (Number.isFinite(value) && value >= 1000) {
      amounts.add(value);
    }
  }

  // 2. Pola ribuan bertitik/berkoma (misal: 5.942 atau 15.937)
  const formattedRegex = /\b([0-9]{1,3}(?:[.,][0-9]{3})+)\b/g;
  while ((match = formattedRegex.exec(normalized)) !== null) {
    const digits = match[1].replace(/[^\d]/g, '');
    const value = Number.parseInt(digits, 10);
    if (Number.isFinite(value) && value >= 1000) {
      amounts.add(value);
    }
  }

  // 3. Pola angka polos 4-6 digit (misal: 5942 atau 15937)
  const plainRegex = /\b([0-9]{4,6})\b/g;
  while ((match = plainRegex.exec(normalized)) !== null) {
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value >= 1000) {
      amounts.add(value);
    }
  }

  return Array.from(amounts);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = cleanEnv(process.env.QRIS_WEBHOOK_SECRET);
    if (!expectedSecret) {
      return NextResponse.json(
        { success: false, message: 'QRIS_WEBHOOK_SECRET belum dikonfigurasi.' },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    let parsedBody: Record<string, unknown> = {};
    try {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsedBody = { text: rawBody };
    }

    // Cek kunci rahasia via header x-webhook-secret atau properti body.secret
    const providedSecret = (
      request.headers.get('x-webhook-secret') ||
      (typeof parsedBody.secret === 'string' ? parsedBody.secret : '')
    ).trim();

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized webhook secret.' },
        { status: 401 }
      );
    }

    const appName = typeof parsedBody.app === 'string' ? parsedBody.app : '';
    const title = typeof parsedBody.title === 'string' ? parsedBody.title : '';
    const text = typeof parsedBody.text === 'string' ? parsedBody.text : '';
    const combinedText = `${appName} | ${title} | ${text}`.trim();

    const candidateAmounts = extractCandidateIdrAmounts(`${title} ${text}`);
    if (candidateAmounts.length === 0) {
      return NextResponse.json({
        success: true,
        matched: false,
        message: 'Tidak ada nominal rupiah yang terdeteksi pada notifikasi.',
      });
    }

    const updatedOrder = await matchAndMarkOrderPaid(
      candidateAmounts,
      combinedText
    );

    if (!updatedOrder) {
      return NextResponse.json({
        success: true,
        matched: false,
        detectedAmounts: candidateAmounts,
        message: 'Nominal tidak cocok dengan transaksi UNPAID aktif.',
      });
    }

    return NextResponse.json({
      success: true,
      matched: true,
      merchantRef: updatedOrder.merchant_ref,
      email: updatedOrder.email,
      totalAmount: updatedOrder.total_amount,
      status: 'PAID',
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Gagal memproses webhook QRIS.';
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'NutriFit AI Automated QRIS Notification Webhook',
  });
}