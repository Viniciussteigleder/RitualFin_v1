import { serve } from 'https://deno.land/std@0.230.0/http/server.ts';

serve(async () => {
  return new Response(JSON.stringify({ message: 'mm-import function stub' }), { status: 501 });
});
