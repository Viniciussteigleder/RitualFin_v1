import { serve } from 'https://deno.land/std@0.230.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RuleRecord = {
  id: string;
  type: string;
  fix_var: string;
  category_1: string;
  category_2: string | null;
  keywords: string;
};

const CATEGORY_ORDER = [
  'Receitas',
  'Moradia',
  'Mercado',
  'Compras Online',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros',
  'Interno'
];

function renderRulesMarkdown(rules: RuleRecord[]) {
  const grouped = new Map<string, RuleRecord[]>();
  rules.forEach((rule) => {
    const key = rule.category_1 || 'Outros';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(rule);
  });

  const sections = CATEGORY_ORDER.filter((category) => grouped.has(category)).concat(
    Array.from(grouped.keys()).filter((category) => !CATEGORY_ORDER.includes(category))
  );

  let markdown = '# RitualFin — Regras de Categorizacao (v1)\n\n';
  markdown += '## Categorias (Categoria I)\n';
  CATEGORY_ORDER.forEach((category) => {
    markdown += `- ${category}\n`;
  });
  markdown += '\n## Matching (v1)\n';
  markdown += '- Campo de match: desc_norm\n';
  markdown += '- Tipo: contains, case-insensitive\n';
  markdown += '- Keywords separadas por ;\n';
  markdown += '- 2+ regras: needs_review\n\n';

  sections.forEach((category) => {
    const rulesForCategory = grouped.get(category) ?? [];
    markdown += `## Regras — ${category}\n`;
    markdown += '| Tipo | Fixo/Var | Categoria I | Categoria II | Keywords |\n';
    markdown += '|---|---|---|---|---|\n';
    rulesForCategory.forEach((rule) => {
      const category2 = rule.category_2 ?? '';
      markdown += `| ${rule.type} | ${rule.fix_var} | ${rule.category_1} | ${category2} | ${rule.keywords} |\n`;
    });
    markdown += '\n';
  });

  return markdown;
}

serve(async (request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase envs ausentes' }), { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Bearer token ausente' }), { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const {
    data: { user },
    error: authError
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token invalido' }), { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('rules')
    .select('id, type, fix_var, category_1, category_2, keywords')
    .eq('profile_id', user.id)
    .order('category_1', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const markdown = renderRulesMarkdown((data ?? []) as RuleRecord[]);
  return new Response(JSON.stringify({ markdown }), { status: 200 });
});
