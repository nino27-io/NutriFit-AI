import { NextResponse } from 'next/server';
import {
  getSubscriptionPlan,
  SubscriptionPlanId,
} from '@/lib/subscriptionConfig';
import { generateDynamicQris } from '@/lib/qrisDynamic';
import {
  allocateUniqueCode,
  createQrisOrder,
  getQrisOrderByRef,
} from '@/lib/qrisSupabase';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

interface NormalizedPlanInfo {
  id: 'weekly' | 'monthly';
  title: string;
  baseAmount: number;
  durationDays: number;
}

function resolvePlanDetails(planId?: SubscriptionPlanId): NormalizedPlanInfo {
  const safeId: 'weekly' | 'monthly' =
    planId === 'monthly' ? 'monthly' : 'weekly';
  const rawPlan = getSubscriptionPlan(safeId) as unknown as Record<
    string,
    unknown
  >;

  const rawPrice =
    rawPlan.price ??
    rawPlan.priceIdr ??
    rawPlan.priceIDR ??
    rawPlan.amount ??
    rawPlan.cost;

  // Fallback harga asli sesuai UI NutriFit AI: 5900 (mingguan) & 15900 (bulanan)
  let baseAmount = safeId === 'monthly' ? 15900 : 5900;
  if (typeof rawPrice === 'number' && rawPrice > 0) {
    baseAmount = Math.round(rawPrice);
  } else if (typeof rawPlan.priceFormatted === 'string') {
    const digits = rawPlan.priceFormatted.replace(/[^\d]/g, '');
    const parsed = Number(digits);
    if (parsed > 0) baseAmount = parsed;
  }

  const title =
    typeof rawPlan.title === 'string' && rawPlan.title
      ? rawPlan.title
      : typeof rawPlan.name === 'string' && rawPlan.name
        ? rawPlan.name
        : safeId === 'monthly'
          ? 'Paket Bulanan'
          : 'Paket Mingguan';

  const durationDays =
    typeof rawPlan.durationDays === 'number' && rawPlan.durationDays > 0
      ? rawPlan.durationDays
      : safeId === 'monthly'
        ? 30
        : 7;

  return {
    id: safeId,
    title,
    baseAmount,
    durationDays,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, planId } = body as {
      name?: string;
      email?: string;
      planId?: SubscriptionPlanId;
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || 'Pengguna NutriFit').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Email akun Google tidak valid.' },
        { status: 400 }
      );
    }

    const staticQrisString = cleanEnv(process.env.STATIC_QRIS_STRING);
    if (!staticQrisString) {
      return NextResponse.json(
        {
          error:
            'STATIC_QRIS_STRING belum diatur di .env.local atau Vercel Environment Variables.',
        },
        { status: 500 }
      );
    }

    const plan = resolvePlanDetails(planId);
    const uniqueCode = await allocateUniqueCode(plan.baseAmount);
    const totalAmount = plan.baseAmount + uniqueCode;

    const dynamicQris = generateDynamicQris(staticQrisString, totalAmount);

    const merchantRef = `NF-${Date.now().toString().slice(-6)}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await createQrisOrder({
      merchant_ref: merchantRef,
      email: cleanEmail,
      name: cleanName,
      plan_id: plan.id,
      plan_title: plan.title,
      duration_days: plan.durationDays,
      base_amount: plan.baseAmount,
      unique_code: uniqueCode,
      total_amount: totalAmount,
      status: 'UNPAID',
      expires_at: expiresAt,
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=M&margin=12&data=${encodeURIComponent(
      dynamicQris.qrisString
    )}`;

    return NextResponse.json({
      success: true,
      merchantRef,
      planTitle: plan.title,
      durationDays: plan.durationDays,
      baseAmount: plan.baseAmount,
      uniqueCode,
      totalAmount,
      basePriceFormatted: `Rp${plan.baseAmount.toLocaleString('id-ID')}`,
      totalPriceFormatted: `Rp${totalAmount.toLocaleString('id-ID')}`,
      merchantName: dynamicQris.merchantName,
      expiresAt,
      qrUrl,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Gagal membuat kode QRIS Dinamis.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantRef = (searchParams.get('merchantRef') || '').trim();

    if (!merchantRef) {
      return NextResponse.json(
        { error: 'Parameter merchantRef diperlukan.' },
        { status: 400 }
      );
    }

    const order = await getQrisOrderByRef(merchantRef);
    if (!order) {
      return NextResponse.json(
        { paid: false, status: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (order.status === 'PAID') {
      return NextResponse.json({
        paid: true,
        status: 'PAID',
        paidAt: order.paid_at,
        durationDays: order.duration_days,
        planTitle: order.plan_title,
      });
    }

    const isExpired = Date.now() > new Date(order.expires_at).getTime();
    return NextResponse.json({
      paid: false,
      status: isExpired ? 'EXPIRED' : 'UNPAID',
      expiresAt: order.expires_at,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Gagal memeriksa status transaksi.';
    return NextResponse.json({ paid: false, error: msg }, { status: 500 });
  }
}