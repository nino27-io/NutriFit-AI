export type SubscriptionPlanId = 'weekly' | 'monthly';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  itemId: string;
  orderCode: 'W7' | 'M30';
  title: string;
  invoiceLabel: string;
  durationDays: number;
  durationText: string;
  price: number;
  priceFormatted: string;
  badge?: string;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlanId,
  SubscriptionPlanConfig
> = {
  weekly: {
    id: 'weekly',
    itemId: 'nutrifit-qris-weekly-5900',
    orderCode: 'W7',
    title: 'Langganan Mingguan',
    invoiceLabel: 'Langganan Mingguan NutriFit AI (7 Hari)',
    durationDays: 7,
    durationText: 'Aktif 7 Hari',
    price: 5900,
    priceFormatted: 'Rp5.900',
    description:
      'Cocok untuk uji coba program nutrisi AI & latihan 1 minggu penuh.',
  },
  monthly: {
    id: 'monthly',
    itemId: 'nutrifit-qris-monthly-16900',
    orderCode: 'M30',
    title: 'Langganan Bulanan',
    invoiceLabel: 'Langganan Bulanan NutriFit AI (30 Hari)',
    durationDays: 30,
    durationText: 'Aktif 30 Hari',
    price: 16900,
    priceFormatted: 'Rp16.900',
    badge: 'Lebih Hemat 28%',
    description:
      'Setara ±Rp4.225/minggu untuk pemantauan komposisi tubuh sebulan penuh.',
  },
};

export const SUBSCRIPTION_PLAN_LIST: SubscriptionPlanConfig[] = [
  SUBSCRIPTION_PLANS.weekly,
  SUBSCRIPTION_PLANS.monthly,
];

export const STARTING_PRICE_TEXT = SUBSCRIPTION_PLANS.weekly.priceFormatted;

export function getSubscriptionPlan(
  planId?: string | null
): SubscriptionPlanConfig {
  if (planId === 'monthly') {
    return SUBSCRIPTION_PLANS.monthly;
  }
  return SUBSCRIPTION_PLANS.weekly;
}