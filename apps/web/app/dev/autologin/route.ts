import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';

// DEV/E2E ONLY — DO NOT SHIP TO PROD
const isEnabled =
  process.env.ENABLE_DEV_AUTOLOGIN === 'true' &&
  (process.env.NODE_ENV === 'development' || process.env.E2E_MODE === 'true');

export async function GET(req: NextRequest) {
  if (!isEnabled) {
    return NextResponse.json({ error: 'disabled' }, { status: 404 });
  }

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ error: 'missing_credentials' }, { status: 500 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const redirectUrl = new URL('/painel', req.url);
  return NextResponse.redirect(redirectUrl);
}
