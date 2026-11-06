import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CouponDefinition {
  code: string;
  planId: 'weekly' | 'monthly';
  durationDays: number;
  description: string;
}

export interface CouponUsageRecord {
  code: string;
  redeemedByEmail: string;
  redeemedAt: string;
}

export type CouponRedeemResult =
  | {
      valid: true;
      status: 'SUCCESS';
      coupon: CouponDefinition;
      usage: CouponUsageRecord;
    }
  | {
      valid: false;
      status: 'INVALID' | 'EXPIRED' | 'AUTH_REQUIRED';
      message: string;
    };

export const VALID_COUPONS: Record<string, CouponDefinition> = {
  NTR7FIT26AI: {
    code: 'NTR7FIT26AI',
    planId: 'monthly',
    durationDays: 30,
    description: 'Akses Evaluasi Dosen & Penguji (30 Hari)',
  },
  NFIT94AI26: {
    code: 'NFIT94AI26',
    planId: 'weekly',
    durationDays: 7,
    description: 'Akses Demo NutriFit AI (7 Hari)',
  },
  NUTR1F1T88AI: {
    code: 'NUTR1F1T88AI',
    planId: 'monthly',
    durationDays: 30,
    description: 'Akses Khusus Tim & Reviewer (30 Hari)',
  },
};

const STORE_FILE_PATH = path.join(os.tmpdir(), 'nutrifit_used_coupons_v2.json');

declare global {
  // eslint-disable-next-line no-var
  var __nutrifitUsedCouponsV2: Record<string, CouponUsageRecord> | undefined;
}

function getUsedCouponsStore(): Record<string, CouponUsageRecord> {
  if (globalThis.__nutrifitUsedCouponsV2) {
    return globalThis.__nutrifitUsedCouponsV2;
  }

  let initialStore: Record<string, CouponUsageRecord> = {};
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        initialStore = parsed as Record<string, CouponUsageRecord>;
      }
    }
  } catch {
    // Abaikan jika gagal membaca di environment serverless
  }

  globalThis.__nutrifitUsedCouponsV2 = initialStore;
  return initialStore;
}

function saveUsedCouponsStore(store: Record<string, CouponUsageRecord>): void {
  globalThis.__nutrifitUsedCouponsV2 = store;
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Abaikan jika filesystem read-only
  }
}

export function redeemSingleUseCoupon(
  rawCode?: string,
  rawEmail?: string
): CouponRedeemResult {
  const code = (rawCode || '').trim().toUpperCase();
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return {
      valid: false,
      status: 'AUTH_REQUIRED',
      message: 'Silakan login dengan akun Google terlebih dahulu.',
    };
  }

  const coupon = VALID_COUPONS[code];
  if (!coupon) {
    return {
      valid: false,
      status: 'INVALID',
      message: 'Kode token tidak valid atau tidak terdaftar.',
    };
  }

  const usedStore = getUsedCouponsStore();
  if (usedStore[code]) {
    return {
      valid: false,
      status: 'EXPIRED',
      message: 'Kupon sudah kedaluwarsa karena telah digunakan sebelumnya.',
    };
  }

  const usageRecord: CouponUsageRecord = {
    code,
    redeemedByEmail: email,
    redeemedAt: new Date().toISOString(),
  };

  usedStore[code] = usageRecord;
  saveUsedCouponsStore(usedStore);

  return {
    valid: true,
    status: 'SUCCESS',
    coupon,
    usage: usageRecord,
  };
}