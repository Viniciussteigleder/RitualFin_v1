'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children, initialSession }: { children: ReactNode; initialSession: Session | null }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      supabase,
      session,
      isLoading
    }),
    [session, isLoading]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabaseClient() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('SupabaseProvider is missing');
  }
  return context.supabase;
}

export function useSession() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('SupabaseProvider is missing');
  }
  return context.session;
}

export function useSupabaseLoading() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('SupabaseProvider is missing');
  }
  return context.isLoading;
}
