import { describe, expect, it } from 'vitest';
import {
  generateClaimCode,
  generateShareToken,
  sha256Hex,
} from '../crypto';

describe('Utilitas Keamanan Token & Kode Klaim (lib/supabase/crypto)', () => {
  it('menghasilkan hash SHA-256 yang konsisten dan mengabaikan spasi tepi (trim)', () => {
    const hash1 = sha256Hex('NF2026XY');
    const hash2 = sha256Hex('  NF2026XY  ');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('membuat kode klaim stan tanpa karakter ambigu (0, O, 1, I, L)', () => {
    const { code, codeHash, expiresAtIso } = generateClaimCode(8);

    expect(code).toHaveLength(8);
    expect(code).not.toMatch(/[0O1IL]/);
    expect(codeHash).toBe(sha256Hex(code));
    expect(new Date(expiresAtIso).getTime()).toBeGreaterThan(Date.now());
  });

  it('membuat token berbagi laporan sepanjang 64 karakter hex dengan hash yang cocok', () => {
    const { token, tokenHash, expiresAtIso } = generateShareToken(48);

    expect(token).toHaveLength(64);
    expect(tokenHash).toBe(sha256Hex(token));
    expect(new Date(expiresAtIso).getTime()).toBeGreaterThan(Date.now());
  });
});