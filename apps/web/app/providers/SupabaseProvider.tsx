'use client';

import { SessionContextProvider, type Session } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase/client';
import type { ReactNode } from 'react';

type SupabaseProviderProps = {
  children: ReactNode;
  initialSession: Session | null;
};

export default function SupabaseProvider({ children, initialSession }: SupabaseProviderProps) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
