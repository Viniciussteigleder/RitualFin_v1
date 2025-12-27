import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { supabaseServer } from '@/lib/supabase/server';

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
  const signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (signInResult.error) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    const canUseAdmin = Boolean(serviceKey && !serviceKey.startsWith('sb_publishable_'));

    if (canUseAdmin) {
      const createResult = await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (createResult.error) {
        const { data: listData } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = listData?.users?.find((user) => user.email === email);
        if (existing) {
          await supabaseServer.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true
          });
        } else {
          return NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
      }

      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
    } else {
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            locale: 'pt-BR',
            currency: 'EUR'
          }
        }
      });

      if (signUpResult.error) {
        return NextResponse.json({ error: signUpResult.error.message }, { status: 500 });
      }

      if (!signUpResult.data.session) {
        return NextResponse.json({ error: 'email_confirmation_required' }, { status: 500 });
      }
    }
  }

  const redirectUrl = new URL('/painel', req.url);
  return NextResponse.redirect(redirectUrl);
}
