import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SupabaseProvider } from '@/lib/supabase/provider';
import '../styles/globals.css';

export const metadata = {
  title: 'RitualFin v1',
  description: 'MVP de controle financeiro com foco em uploads Miles & More'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? '',
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        }
      }
    }
  );
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="pt-BR">
      <body>
        <SupabaseProvider initialSession={session}>
          <div className="app-shell">
            <main>{children}</main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
