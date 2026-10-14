import { createHash, randomBytes } from 'crypto';

// Alfabet tanpa 0, O, 1, I, L untuk menghindari salah baca di kertas/kartu stan
const CLAIM_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Menghasilkan hash SHA-256 hex (64 karakter) yang identik dengan
 * encode(digest(trim(code), 'sha256'), 'hex') di PostgreSQL.
 */
export function sha256Hex(plainText: string): string {
  const normalized = plainText.trim();
  if (!normalized) {
    throw new Error('Input yang akan di-hash tidak boleh kosong.');
  }
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Membuat kode klaim sekali pakai untuk pengunjung stan (default 8 karakter, misal: "NF7K9P2M")
 * beserta nilai hash SHA-256 yang siap disimpan ke kolom subjects.claim_code_hash.
 */
export function generateClaimCode(length = 8): {
  code: string;
  codeHash: string;
  expiresAtIso: string;
} {
  if (length < 6 || length > 16) {
    throw new Error('Panjang kode klaim harus antara 6 hingga 16 karakter.');
  }

  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CLAIM_ALPHABET[bytes[i] % CLAIM_ALPHABET.length];
  }

  // Berlaku selama 7 hari sejak pengukuran di stan
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    code,
    codeHash: sha256Hex(code),
    expiresAtIso: expiresAt.toISOString(),
  };
}

/**
 * Membuat token acak panjang (64 karakter hex) untuk berbagi tautan laporan (report_shares)
 * beserta nilai hash SHA-256 yang disimpan ke kolom report_shares.token_hash.
 */
export function generateShareToken(validHours = 72): {
  token: string;
  tokenHash: string;
  expiresAtIso: string;
} {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validHours * 60 * 60 * 1000);

  return {
    token,
    tokenHash: sha256Hex(token),
    expiresAtIso: expiresAt.toISOString(),
  };
}