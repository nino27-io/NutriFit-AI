'use client';

export type UserTier = 'guest' | 'free_registered' | 'premium';

export interface GoogleAccountProfile {
  email: string;
  name: string;
  picture?: string;
  avatarInitials: string;
  loggedInAt: string;
  subscriptionInvoice?: string;
  subscribedAt?: string;
  expiresAt?: string;
}

export interface AssessmentInputSnapshot {
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'fat_loss' | 'maintenance' | 'muscle_gain';
  budgetTier: 'hemat' | 'seimbang' | 'fleksibel';
  sleepHours: number;
}

export interface HistoryRecord {
  id: string;
  createdAt: string;
  input: AssessmentInputSnapshot;
  summary: {
    idealWeightMinKg: number;
    idealWeightMaxKg: number;
    targetCalories: number;
    proteinGrams: number;
    bmi: number;
    bodyFat: number;
  };
}

export class AccessPolicy {
  public static canViewFullResult(tier: UserTier): boolean {
    return tier === 'premium';
  }

  public static canRecordHistory(tier: UserTier): boolean {
    return tier === 'free_registered' || tier === 'premium';
  }

  public static getTierBadgeMeta(tier: UserTier): {
    label: string;
    description: string;
    badgeClass: string;
  } {
    switch (tier) {
      case 'premium':
        return {
          label: 'Pengguna Premium',
          description:
            'Akses penuh seluruh hasil analisis, program AI 7 hari & riwayat tercatat',
          badgeClass: 'bg-[#38D46A] text-[#0B2545]',
        };
      case 'free_registered':
        return {
          label: 'Pengguna Biasa (Free Registered)',
          description:
            'Hasil terbatas (Berat Ideal, Kalori & Protein) • Riwayat tercatat di akun Google',
          badgeClass: 'bg-[#0B4B84] text-white',
        };
      default:
        return {
          label: 'Pengunjung (Guest)',
          description:
            'Hasil terbatas (Berat Ideal, Kalori & Protein) • Riwayat tidak tercatat',
          badgeClass: 'bg-slate-200 text-[#0B2545]',
        };
    }
  }
}

export class HistoryRepository {
  private static getStorageKey(email: string): string {
    return `nutrifit_history_${email.trim().toLowerCase()}`;
  }

  public static getRecords(email?: string): HistoryRecord[] {
    if (typeof window === 'undefined' || !email) return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey(email));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static saveRecord(
    tier: UserTier,
    email: string | undefined,
    record: Omit<HistoryRecord, 'id' | 'createdAt'>
  ): HistoryRecord[] {
    if (!AccessPolicy.canRecordHistory(tier) || !email) {
      return [];
    }

    const existing = this.getRecords(email);
    const latest = existing[0];
    if (
      latest &&
      latest.input.weightKg === record.input.weightKg &&
      latest.input.heightCm === record.input.heightCm &&
      latest.input.waistCm === record.input.waistCm &&
      latest.input.goal === record.input.goal &&
      latest.summary.targetCalories === record.summary.targetCalories
    ) {
      return existing;
    }

    const newEntry: HistoryRecord = {
      ...record,
      id: `HIST-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = [newEntry, ...existing].slice(0, 15);
    try {
      localStorage.setItem(this.getStorageKey(email), JSON.stringify(updated));
    } catch {
      // Abaikan jika penyimpanan penuh
    }
    return updated;
  }

  public static clearRecords(email?: string): void {
    if (typeof window === 'undefined' || !email) return;
    localStorage.removeItem(this.getStorageKey(email));
  }
}

export class AuthTierController {
  private static readonly AUTH_STORAGE_KEY = 'nutrifit_auth_session_v2';
  private static readonly EVENT_NAME = 'nutrifit-auth-changed';

  // Kunci versi baru (V2) untuk memutus status langganan uji coba/sandbox lama
  private static getPremiumKey(email: string): string {
    return `nutrifit_premium_prod_v2_${email.trim().toLowerCase()}`;
  }

  public static getSession(): {
    tier: UserTier;
    user: GoogleAccountProfile | null;
  } {
    if (typeof window === 'undefined') {
      return { tier: 'guest', user: null };
    }
    try {
      const raw = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (!raw) return { tier: 'guest', user: null };
      const parsed = JSON.parse(raw);
      if (!parsed?.user?.email) return { tier: 'guest', user: null };
      return {
        tier: parsed.tier === 'premium' ? 'premium' : 'free_registered',
        user: parsed.user,
      };
    } catch {
      return { tier: 'guest', user: null };
    }
  }

  public static loginWithGoogle(
    name: string,
    email: string,
    picture?: string
  ): {
    tier: UserTier;
    user: GoogleAccountProfile;
  } {
    const cleanName = name.trim() || 'Pengguna NutriFit';
    const cleanEmail = email.trim().toLowerCase();

    // Hapus sisa cache uji coba V1 jika masih ada di browser
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`nutrifit_premium_status_${cleanEmail}`);
      localStorage.removeItem('nutrifit_auth_session_v1');
    }

    const premiumKey = this.getPremiumKey(cleanEmail);
    const savedPremiumRaw =
      typeof window !== 'undefined' ? localStorage.getItem(premiumKey) : null;
    const savedPremium = savedPremiumRaw ? JSON.parse(savedPremiumRaw) : null;

    const initials = cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    // Cek apakah langganan aktif & belum kedaluwarsa
    let isCurrentlyActive = false;
    if (savedPremium?.active) {
      if (savedPremium.expiresAt) {
        isCurrentlyActive = new Date(savedPremium.expiresAt).getTime() > Date.now();
      } else {
        isCurrentlyActive = true;
      }
    }

    const tier: UserTier = isCurrentlyActive ? 'premium' : 'free_registered';
    const user: GoogleAccountProfile = {
      name: cleanName,
      email: cleanEmail,
      picture: picture || undefined,
      avatarInitials: initials || 'NF',
      loggedInAt: new Date().toISOString(),
      subscriptionInvoice: isCurrentlyActive ? savedPremium?.invoice : undefined,
      subscribedAt: isCurrentlyActive ? savedPremium?.subscribedAt : undefined,
      expiresAt: isCurrentlyActive ? savedPremium?.expiresAt : undefined,
    };

    this.saveSession({ tier, user });
    return { tier, user };
  }

  public static activatePremiumSubscription(
    paymentMethod: string,
    durationDays = 7
  ): {
    tier: UserTier;
    user: GoogleAccountProfile | null;
  } {
    const current = this.getSession();
    if (!current.user) {
      return { tier: 'guest', user: null };
    }

    const invoice = `INV-NF-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const subscribedAt = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const expireDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const expiresAt = expireDate.toISOString();

    const updatedUser: GoogleAccountProfile = {
      ...current.user,
      subscriptionInvoice: `${invoice} (${paymentMethod})`,
      subscribedAt,
      expiresAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        this.getPremiumKey(current.user.email),
        JSON.stringify({
          active: true,
          invoice: updatedUser.subscriptionInvoice,
          subscribedAt,
          expiresAt,
        })
      );
    }

    const nextState = { tier: 'premium' as UserTier, user: updatedUser };
    this.saveSession(nextState);
    return nextState;
  }

  /**
   * Reset status langganan kembali ke Free Registered secara instan untuk pengujian
   */
  public static resetSubscriptionStatus(email?: string): void {
    const current = this.getSession();
    const targetEmail = (email || current.user?.email || '').trim().toLowerCase();

    if (typeof window !== 'undefined' && targetEmail) {
      localStorage.removeItem(this.getPremiumKey(targetEmail));
      localStorage.removeItem(`nutrifit_premium_status_${targetEmail}`);
    }

    if (current.user) {
      const updatedUser: GoogleAccountProfile = {
        ...current.user,
        subscriptionInvoice: undefined,
        subscribedAt: undefined,
        expiresAt: undefined,
      };
      this.saveSession({ tier: 'free_registered', user: updatedUser });
    }
  }

  public static cancelPremiumForDemo(): void {
    this.resetSubscriptionStatus();
  }

  public static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.AUTH_STORAGE_KEY);
    localStorage.removeItem('nutrifit_auth_session_v1');
    window.dispatchEvent(new Event(this.EVENT_NAME));
  }

  private static saveSession(state: {
    tier: UserTier;
    user: GoogleAccountProfile | null;
  }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(this.EVENT_NAME));
  }

  public static subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(this.EVENT_NAME, callback);
    return () => window.removeEventListener(this.EVENT_NAME, callback);
  }
}