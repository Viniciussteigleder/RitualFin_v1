import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ status: 'error', reason: 'missing_env' }, { status: 500 });
  }

  const { error } = await supabaseServer.from('profiles').select('id').limit(1);
  if (error) {
    return NextResponse.json({ status: 'error', reason: 'supabase_error' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
