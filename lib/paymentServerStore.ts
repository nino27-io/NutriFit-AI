import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { SubscriptionPlanId, getSubscriptionPlan } from './subscriptionConfig';

export type TransactionLifecycleStatus =
  | 'pending'
  | 'settlement'
  | 'expire'
  | 'cancel'
  | 'deny';

export interface ServerTransactionRecord {
  orderId: string;
  email: string;
  planId: SubscriptionPlanId;
  grossAmount: number;
  durationDays: number;
  status: TransactionLifecycleStatus;
  paymentType?: string;
  createdAt: string;
  settledAt?: string;
  expiresAt?: string;
}

const STORE_FILE_PATH = path.join(
  process.cwd(),
  '.nutrifit-transactions.json'
);

function readStore(): Record<string, ServerTransactionRecord> {
  try {
    if (!fs.existsSync(STORE_FILE_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as Record<string, ServerTransactionRecord>;
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, ServerTransactionRecord>): void {
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Abaikan jika filesystem read-only pada serverless tertentu
  }
}

/**
 * Validasi Signature Key SHA512 resmi Midtrans:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  incomingSignature: string
): boolean {
  if (!orderId || !statusCode || !grossAmount || !serverKey || !incomingSignature) {
    return false;
  }
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = crypto.createHash('sha512').update(payload).digest('hex');
  return computedHash.toLowerCase() === incomingSignature.trim().toLowerCase();
}

/**
 * Ekstrak Plan ID dari format Order ID (NFPROD-W7-... atau NFSBOX-M30-...)
 */
export function resolvePlanFromOrderId(orderId: string): SubscriptionPlanId {
  if (orderId.includes('-M30-')) {
    return 'monthly';
  }
  return 'weekly';
}

export function registerPendingTransaction(params: {
  orderId: string;
  email: string;
  planId: SubscriptionPlanId;
  grossAmount: number;
  durationDays: number;
}): ServerTransactionRecord {
  const store = readStore();
  const record: ServerTransactionRecord = {
    orderId: params.orderId,
    email: params.email.trim().toLowerCase(),
    planId: params.planId,
    grossAmount: params.grossAmount,
    durationDays: params.durationDays,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store[params.orderId] = record;
  writeStore(store);
  return record;
}

/**
 * Memperbarui status transaksi secara idempoten (mencegah aktivasi ganda)
 */
export function updateTransactionFromMidtrans(params: {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  paymentType?: string;
  grossAmount?: number;
  customerEmail?: string;
}): {
  record: ServerTransactionRecord;
  isSettled: boolean;
  alreadyProcessed: boolean;
} {
  const store = readStore();
  const existing = store[params.orderId];

  // Proteksi Idempotensi: Jika sudah berstatus settlement sebelumnya, jangan hitung ulang masa aktif
  if (existing && existing.status === 'settlement' && existing.expiresAt) {
    return {
      record: existing,
      isSettled: true,
      alreadyProcessed: true,
    };
  }

  const planId = existing?.planId ?? resolvePlanFromOrderId(params.orderId);
  const planConfig = getSubscriptionPlan(planId);

  let mappedStatus: TransactionLifecycleStatus = 'pending';
  const rawStatus = params.transactionStatus?.toLowerCase();
  const fraud = params.fraudStatus?.toLowerCase();

  if (rawStatus === 'capture') {
    mappedStatus = fraud === 'accept' || !fraud ? 'settlement' : 'deny';
  } else if (rawStatus === 'settlement') {
    mappedStatus = 'settlement';
  } else if (rawStatus === 'expire') {
    mappedStatus = 'expire';
  } else if (rawStatus === 'cancel') {
    mappedStatus = 'cancel';
  } else if (rawStatus === 'deny') {
    mappedStatus = 'deny';
  }

  const now = new Date();
  const isSettled = mappedStatus === 'settlement';
  const expiresAt = isSettled
    ? new Date(
        now.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000
      ).toISOString()
    : undefined;

  const updatedRecord: ServerTransactionRecord = {
    orderId: params.orderId,
    email: existing?.email || params.customerEmail || 'verified@nutrifit.ai',
    planId: planConfig.id,
    grossAmount: existing?.grossAmount ?? params.grossAmount ?? planConfig.price,
    durationDays: planConfig.durationDays,
    status: mappedStatus,
    paymentType: params.paymentType || existing?.paymentType || 'qris',
    createdAt: existing?.createdAt || now.toISOString(),
    settledAt: isSettled ? now.toISOString() : existing?.settledAt,
    expiresAt: expiresAt || existing?.expiresAt,
  };

  store[params.orderId] = updatedRecord;
  writeStore(store);

  return {
    record: updatedRecord,
    isSettled,
    alreadyProcessed: false,
  };
}