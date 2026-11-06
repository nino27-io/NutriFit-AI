import { NextResponse } from 'next/server';
import { redeemSingleUseCoupon } from '@/lib/couponConfig';

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        valid: false,
        status: 'INVALID',
        message: 'Format permintaan tidak sesuai.',
      });
    }

    const rawCode = String(body.code || '');
    const userEmail = String(body.email || '');

    if (!rawCode.trim()) {
      return NextResponse.json({
        valid: false,
        status: 'INVALID',
        message: 'Masukkan kode token terlebih dahulu.',
      });
    }

    const result = redeemSingleUseCoupon(rawCode, userEmail);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        status: result.status,
        message: result.message,
      });
    }

    return NextResponse.json({
      valid: true,
      status: 'SETTLED',
      code: result.coupon.code,
      planId: result.coupon.planId,
      durationDays: result.coupon.durationDays,
      description: result.coupon.description,
      redeemedBy: result.usage.redeemedByEmail,
      message: `Berhasil! ${result.coupon.description} telah aktif.`,
    });
  } catch {
    return NextResponse.json({
      valid: false,
      status: 'INVALID',
      message: 'Token tidak dapat diproses saat ini, silakan coba lagi.',
    });
  }
}