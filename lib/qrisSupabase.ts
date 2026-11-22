export interface QrisOrderRow {
  merchant_ref: string;
  email: string;
  name: string;
  plan_id: 'weekly' | 'monthly';
  plan_title: string;
  duration_days: number;
  base_amount: number;
  unique_code: number;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'EXPIRED';
  raw_notification?: string | null;
  created_at: string;
  expires_at: string;
  paid_at?: string | null;
}

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function getSupabaseConfig(): { baseUrl: string; serviceKey: string } {
  const baseUrl = cleanEnv(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  ).replace(/\/+$/, '');
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!baseUrl || !serviceKey) {
    throw new Error(
      'SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diatur di Environment Variables.'
    );
  }

  return { baseUrl, serviceKey };
}

async function supabaseFetch<T>(
  pathWithQuery: string,
  options: RequestInit = {}
): Promise<T> {
  const { baseUrl, serviceKey } = getSupabaseConfig();
  const res = await fetch(`${baseUrl}/rest/v1/${pathWithQuery}`, {
    ...options,
    cache: 'no-store',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase error (${res.status}): ${errText}`);
  }

  if (res.status === 204) {
    return [] as unknown as T;
  }

  return (await res.json()) as T;
}

export async function allocateUniqueCode(baseAmount: number): Promise<number> {
  const nowIso = new Date().toISOString();
  const activeRows = await supabaseFetch<Array<{ total_amount: number }>>(
    `qris_orders?select=total_amount&status=eq.UNPAID&expires_at=gt.${encodeURIComponent(
      nowIso
    )}`
  );

  const activeTotals = new Set(activeRows.map((r) => Number(r.total_amount)));

  // Prioritas kode unik 1 - 99 (Rp5.901–Rp5.999 dan Rp15.901–Rp15.999)
  const primaryCandidates: number[] = [];
  for (let code = 1; code <= 99; code++) {
    if (!activeTotals.has(baseAmount + code)) {
      primaryCandidates.push(code);
    }
  }

  if (primaryCandidates.length > 0) {
    return primaryCandidates[
      Math.floor(Math.random() * primaryCandidates.length)
    ];
  }

  // Cadangan kode unik 101 - 299 jika 99 slot dalam 15 menit penuh bersamaan
  const fallbackCandidates: number[] = [];
  for (let code = 101; code <= 299; code++) {
    if (!activeTotals.has(baseAmount + code)) {
      fallbackCandidates.push(code);
    }
  }

  if (fallbackCandidates.length > 0) {
    return fallbackCandidates[
      Math.floor(Math.random() * fallbackCandidates.length)
    ];
  }

  throw new Error(
    'Antrean transaksi sedang sangat padat. Silakan coba lagi dalam 1 menit.'
  );
}

export async function createQrisOrder(
  order: Omit<QrisOrderRow, 'created_at' | 'paid_at' | 'raw_notification'>
): Promise<QrisOrderRow> {
  const rows = await supabaseFetch<QrisOrderRow[]>('qris_orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(order),
  });

  if (!rows[0]) {
    throw new Error('Gagal menyimpan transaksi QRIS ke database.');
  }

  return rows[0];
}

export async function getQrisOrderByRef(
  merchantRef: string
): Promise<QrisOrderRow | null> {
  const rows = await supabaseFetch<QrisOrderRow[]>(
    `qris_orders?merchant_ref=eq.${encodeURIComponent(merchantRef)}&limit=1`
  );
  return rows[0] || null;
}

export async function matchAndMarkOrderPaid(
  candidateAmounts: number[],
  rawNotification: string
): Promise<QrisOrderRow | null> {
  const cleanAmounts = Array.from(
    new Set(
      candidateAmounts.filter((n) => Number.isInteger(n) && n >= 1000 && n <= 10000000)
    )
  );

  if (cleanAmounts.length === 0) return null;

  const nowIso = new Date().toISOString();
  const inList = cleanAmounts.join(',');

  // Cari transaksi UNPAID yang belum kedaluwarsa dengan total_amount cocok
  const matchedRows = await supabaseFetch<QrisOrderRow[]>(
    `qris_orders?status=eq.UNPAID&expires_at=gt.${encodeURIComponent(
      nowIso
    )}&total_amount=in.(${inList})&order=created_at.desc&limit=1`
  );

  const target = matchedRows[0];
  if (!target) return null;

  const updatedRows = await supabaseFetch<QrisOrderRow[]>(
    `qris_orders?merchant_ref=eq.${encodeURIComponent(
      target.merchant_ref
    )}&status=eq.UNPAID`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'PAID',
        paid_at: nowIso,
        raw_notification: rawNotification.slice(0, 1000),
      }),
    }
  );

  return updatedRows[0] || target;
}