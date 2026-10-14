export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url) {
    throw new Error(
      'Konfigurasi NEXT_PUBLIC_SUPABASE_URL belum diatur di .env.local'
    );
  }

  if (!anonKey) {
    throw new Error(
      'Konfigurasi NEXT_PUBLIC_SUPABASE_ANON_KEY atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diatur di .env.local'
    );
  }

  return { url, anonKey };
}