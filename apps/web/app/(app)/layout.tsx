import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import Sidebar from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <section className="dashboard-main">{children}</section>
    </div>
  );
}
