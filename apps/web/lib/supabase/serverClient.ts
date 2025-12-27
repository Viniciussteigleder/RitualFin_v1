import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    '';

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Cookie modification in Server Components is not allowed
        }
      },
      remove(name: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Cookie modification in Server Components is not allowed
        }
      }
    }
  });
}
