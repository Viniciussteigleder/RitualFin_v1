import { serve } from 'https://deno.land/std@0.230.0/http/server.ts';

serve(async () => {
  return new Response(JSON.stringify({ message: 'rules-export-md stub' }), { status: 501 });
});
