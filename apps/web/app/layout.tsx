import type { ReactNode } from 'react';
import { SupabaseProvider } from '@/lib/supabase/provider';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import '../styles/globals.css';

export const metadata = {
  title: 'RitualFin v1',
  description: 'MVP de controle financeiro com foco em uploads Miles & More'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
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
