export interface DynamicQrisResult {
  qrisString: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
}

interface TlvField {
  tag: string;
  value: string;
}

export function computeCrc16Ccitt(payload: string): string {
  const bytes = Buffer.from(payload, 'utf8');
  let crc = 0xffff;

  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseTopLevelTlv(qris: string): TlvField[] {
  const fields: TlvField[] = [];
  let cursor = 0;

  while (cursor + 4 <= qris.length) {
    const tag = qris.slice(cursor, cursor + 2);
    const lenStr = qris.slice(cursor + 2, cursor + 4);
    const length = Number.parseInt(lenStr, 10);

    if (
      Number.isNaN(length) ||
      length < 0 ||
      cursor + 4 + length > qris.length
    ) {
      throw new Error(
        'Format STATIC_QRIS_STRING tidak valid. Pastikan seluruh teks QRIS disalin utuh.'
      );
    }

    const value = qris.slice(cursor + 4, cursor + 4 + length);
    fields.push({ tag, value });
    cursor += 4 + length;
  }

  if (cursor !== qris.length) {
    throw new Error(
      'Format STATIC_QRIS_STRING terpotong atau memiliki karakter ekstra di akhir.'
    );
  }

  return fields;
}

function serializeTlv(fields: TlvField[]): string {
  return fields
    .map((f) => `${f.tag}${String(f.value.length).padStart(2, '0')}${f.value}`)
    .join('');
}

export function generateDynamicQris(
  rawStaticQris: string,
  amountIdr: number
): DynamicQrisResult {
  const cleaned = rawStaticQris.trim().replace(/^["']|["']$/g, '').trim();
  const safeAmount = Math.round(amountIdr);

  if (!cleaned.startsWith('000201')) {
    throw new Error(
      'STATIC_QRIS_STRING harus diawali kode standar EMVCo "000201".'
    );
  }

  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    throw new Error('Nominal QRIS harus lebih besar dari 0.');
  }

  const parsedFields = parseTopLevelTlv(cleaned);

  // Hapus Tag 54 (nominal lama) dan Tag 63 (CRC lama)
  const filtered = parsedFields.filter(
    (f) => f.tag !== '54' && f.tag !== '63'
  );

  // Ubah Tag 01 menjadi '12' (Dinamis)
  let hasPointOfInitiation = false;
  const updatedFields: TlvField[] = filtered.map((f) => {
    if (f.tag === '01') {
      hasPointOfInitiation = true;
      return { tag: '01', value: '12' };
    }
    return f;
  });

  if (!hasPointOfInitiation) {
    updatedFields.splice(1, 0, { tag: '01', value: '12' });
  }

  // Sisipkan Tag 54 (Nominal) tepat sebelum Tag 58 (Kode Negara ID)
  const amountField: TlvField = { tag: '54', value: String(safeAmount) };
  const countryIdx = updatedFields.findIndex((f) => f.tag === '58');

  if (countryIdx !== -1) {
    updatedFields.splice(countryIdx, 0, amountField);
  } else {
    updatedFields.push(amountField);
  }

  const merchantName =
    updatedFields.find((f) => f.tag === '59')?.value || 'NutriFit AI';
  const merchantCity =
    updatedFields.find((f) => f.tag === '60')?.value || 'Indonesia';

  const payloadWithoutCrc = `${serializeTlv(updatedFields)}6304`;
  const crc = computeCrc16Ccitt(payloadWithoutCrc);

  return {
    qrisString: `${payloadWithoutCrc}${crc}`,
    merchantName,
    merchantCity,
    amount: safeAmount,
  };
}