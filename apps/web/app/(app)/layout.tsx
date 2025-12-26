import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import Sidebar from '@/components/layout/Sidebar';
import SupabaseProvider from '../providers/SupabaseProvider';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/(auth)/login');
  }

  return (
    <SupabaseProvider initialSession={session}>
      <div className="dashboard-shell">
        <Sidebar />
        <section className="dashboard-main">{children}</section>
      </div>
    </SupabaseProvider>
  );
}
