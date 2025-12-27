import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/painel');
  }

  redirect('/login');
}
