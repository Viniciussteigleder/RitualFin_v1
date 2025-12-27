import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RawRow = {
  authorised_on: string;
  processed_on: string | null;
  amount: string;
  currency: string;
  description: string;
  payment_type: string;
  status: string;
  foreign_amount: string | null;
  foreign_currency: string | null;
  exchange_rate: number | null;
};

type PreparedRow = {
  authorisedOn: string;
  keyDesc: string;
  key: string;
  descRaw: string;
  descNorm: string;
  parsedAmount: number;
};

const REQUIRED_COLUMNS = [
  'Authorised on',
  'Processed on',
  'Amount',
  'Currency',
  'Description',
  'Payment type',
  'Status'
];

const COLUMNS_OPTIONAL = ['Amount in foreign currency', 'Currency (foreign)', 'Exchange rate'];

function parseCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function detectDelimiter(headerLine: string) {
  const commaCount = headerLine.split(',').length - 1;
  const semicolonCount = headerLine.split(';').length - 1;
  return semicolonCount > commaCount ? ';' : ',';
}

function normalizeDescription(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(value: string) {
  const [day, month, year] = value.split('.');
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(value: string) {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildKeyDesc(row: RawRow) {
  const base = `${row.description} -- ${row.payment_type} -- ${row.status} -- M&M - Description`;
  if (row.foreign_currency) {
    return `${base} -- compra internacional em ${row.foreign_currency}`;
  }
  return base;
}

function formatMonthRange(paymentDate: string) {
  const [year, month] = paymentDate.split('-');
  const start = `${year}-${month}-01`;
  const endDate = new Date(Number(year), Number(month), 0);
  const endMonth = `${year}-${month}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end: endMonth };
}

function applyRules(descNorm: string, rules: Record<string, string>[]) {
  const matches = rules.filter((rule) => {
    const keywords = rule.keywords
      .split(';')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    return keywords.some((keyword) => descNorm.includes(normalizeDescription(keyword)));
  });

  if (matches.length !== 1) {
    return { needsReview: true, rule: null, conflict: matches.length > 1 };
  }

  return { needsReview: false, rule: matches[0], conflict: false };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao suportado' }), { status: 405 });
  }

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

  const contentType = request.headers.get('content-type') ?? '';
  let csvText = '';
  let filename = 'upload.csv';

  if (contentType.includes('text/csv')) {
    csvText = await request.text();
  } else {
    const body = await request.json().catch(() => null);
    if (!body?.csv) {
      return new Response(JSON.stringify({ error: 'CSV nao encontrado no body' }), { status: 400 });
    }
    csvText = body.csv;
    filename = body.filename ?? filename;
  }

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return new Response(JSON.stringify({ error: 'CSV vazio' }), { status: 400 });
  }

  const delimiter = detectDelimiter(lines[0]);
  const header = parseCsvLine(lines[0], delimiter);
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Header invalido',
        missing,
        expected: [...REQUIRED_COLUMNS, ...COLUMNS_OPTIONAL]
      }),
      { status: 400 }
    );
  }

  const { data: upload } = await supabaseAdmin
    .from('uploads')
    .insert({
      profile_id: user.id,
      filename,
      status: 'processing',
      rows_total: lines.length - 1
    })
    .select()
    .single();

  const uploadId = upload?.id;
  if (!uploadId) {
    return new Response(JSON.stringify({ error: 'Falha ao criar upload' }), { status: 500 });
  }

  const storagePath = `user/${user.id}/uploads/${uploadId}.csv`;
  const { error: storageError } = await supabaseAdmin.storage
    .from('uploads')
    .upload(storagePath, new Blob([csvText], { type: 'text/csv' }), { upsert: true });
  if (storageError) {
    await supabaseAdmin
      .from('uploads')
      .update({ status: 'error', error_message: storageError.message })
      .eq('id', uploadId);
    return new Response(JSON.stringify({ error: storageError.message }), { status: 500 });
  }

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i], delimiter);
    const rowData: Record<string, string> = {};
    header.forEach((column, index) => {
      rowData[column] = values[index] ?? '';
    });
    rows.push({
      authorised_on: rowData['Authorised on'],
      processed_on: rowData['Processed on'] || null,
      amount: rowData['Amount'],
      currency: rowData['Currency'],
      description: rowData['Description'],
      payment_type: rowData['Payment type'],
      status: rowData['Status'],
      foreign_amount: rowData['Amount in foreign currency'] || null,
      foreign_currency: rowData['Currency (foreign)'] || null,
      exchange_rate: rowData['Exchange rate'] ? Number(rowData['Exchange rate']) : null
    });
  }

  const { data: rules } = await supabaseAdmin
    .from('rules')
    .select('id, type, fix_var, category_1, category_2, keywords')
    .eq('profile_id', user.id);

  const ruleList = rules ?? [];
  const batchDescCount = new Map<string, number>();
  const batchMonthDesc = new Map<string, Set<string>>();

  const rowErrors: string[] = [];
  const preparedRaw = rows.map((row, index) => {
    const authorisedOn = parseDate(row.authorised_on);
    if (!authorisedOn) {
      rowErrors.push(`Linha ${index + 2}: data invalida em Authorised on.`);
    }
    const parsedAmount = parseAmount(row.amount);
    if (parsedAmount === null) {
      rowErrors.push(`Linha ${index + 2}: valor invalido em Amount.`);
    }
    if (!authorisedOn || parsedAmount === null) {
      return null;
    }

    const keyDesc = buildKeyDesc(row);
    const key = `${keyDesc} -- ${row.amount} -- ${authorisedOn}`;
    const descRaw = keyDesc;
    const descNorm = normalizeDescription(descRaw);
    const monthKey = `${authorisedOn.slice(0, 7)}-01`;
    batchDescCount.set(descNorm, (batchDescCount.get(descNorm) ?? 0) + 1);
    if (!batchMonthDesc.has(monthKey)) {
      batchMonthDesc.set(monthKey, new Set());
    }
    batchMonthDesc.get(monthKey)?.add(descNorm);

    return {
      authorisedOn,
      keyDesc,
      key,
      descRaw,
      descNorm,
      parsedAmount
    };
  });

  if (rowErrors.length > 0) {
    await supabaseAdmin
      .from('uploads')
      .update({ status: 'error', error_message: rowErrors.slice(0, 5).join(' ') })
      .eq('id', uploadId);
    return new Response(
      JSON.stringify({
        error: 'CSV invalido',
        details: rowErrors.slice(0, 10)
      }),
      { status: 400 }
    );
  }

  const preparedRows = preparedRaw as PreparedRow[];

  const existingDupes = new Set<string>();
  for (const [monthStart, descSet] of batchMonthDesc.entries()) {
    const monthDesc = Array.from(descSet);
    if (monthDesc.length === 0) continue;
    const { start, end } = formatMonthRange(monthStart);
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('desc_norm')
      .eq('profile_id', user.id)
      .gte('payment_date', start)
      .lte('payment_date', end)
      .in('desc_norm', monthDesc);

    existing?.forEach((item) => {
      if (item.desc_norm) existingDupes.add(item.desc_norm);
    });
  }

  const rawInserts = rows.map((row, index) => {
    const meta = preparedRows[index];
    return {
      upload_id: uploadId,
      profile_id: user.id,
      authorised_on: meta.authorisedOn,
      processed_on: row.processed_on ? parseDate(row.processed_on) : null,
      amount: row.amount,
      currency: row.currency,
      description: row.description,
      payment_type: row.payment_type,
      status: row.status,
      foreign_amount: row.foreign_amount,
      foreign_currency: row.foreign_currency,
      exchange_rate: row.exchange_rate,
      fonte: 'M&M',
      key_mm_desc: meta.keyDesc,
      key_mm: meta.key,
      desc_raw: meta.descRaw,
      desc_norm: meta.descNorm
    };
  });

  const { error: rawError } = await supabaseAdmin.from('raw_mm_transactions').insert(rawInserts);
  if (rawError) {
    await supabaseAdmin.from('uploads').update({ status: 'error', error_message: rawError.message }).eq('id', uploadId);
    return new Response(JSON.stringify({ error: rawError.message }), { status: 500 });
  }

  const transactionInserts = rows.map((row, index) => {
    const meta = preparedRows[index];
    const descNorm = meta.descNorm;
    const monthDupes = batchDescCount.get(descNorm) ?? 0;
    const dupes = monthDupes > 1 || existingDupes.has(descNorm);
    const parsedAmount = meta.parsedAmount;
    const ruleResult = applyRules(descNorm, ruleList);
    const appliedRule = ruleResult.rule;
    const isInternal = appliedRule?.category_1 === 'Interno';

    return {
      profile_id: user.id,
      payment_date: meta.authorisedOn,
      account_source: 'M&M',
      desc_raw: meta.descRaw,
      desc_norm: descNorm,
      amount: parsedAmount,
      amount_display: row.amount,
      currency: row.currency,
      foreign_amount: row.foreign_amount ? parseAmount(row.foreign_amount) : null,
      foreign_currency: row.foreign_currency,
      exchange_rate: row.exchange_rate,
      key: meta.key,
      type: appliedRule?.type ?? null,
      fix_var: appliedRule?.fix_var ?? null,
      category_1: appliedRule?.category_1 ?? null,
      category_2: appliedRule?.category_2 ?? null,
      manual_override: false,
      internal_transfer: isInternal,
      exclude_from_budget: isInternal,
      needs_review: ruleResult.needsReview || dupes,
      rule_miss: ruleResult.needsReview && !ruleResult.conflict,
      rule_conflict: ruleResult.conflict,
      duplicate_suspect: dupes,
      rule_id_applied: appliedRule?.id ?? null,
      status: row.status
    };
  });

  const filteredTransactions = transactionInserts as Record<string, unknown>[];
  let insertedCount = 0;
  if (filteredTransactions.length > 0) {
    const keys = filteredTransactions.map((item) => item.key).filter(Boolean) as string[];
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('key')
      .eq('profile_id', user.id)
      .in('key', keys);
    const existingKeys = new Set(existing?.map((row) => row.key) ?? []);
    const newTransactions = filteredTransactions.filter((item) => !existingKeys.has(item.key as string));

    if (newTransactions.length > 0) {
      const { error: txError } = await supabaseAdmin.from('transactions').insert(newTransactions);
      if (txError) {
        await supabaseAdmin
          .from('uploads')
          .update({ status: 'error', error_message: txError.message })
          .eq('id', uploadId);
        return new Response(JSON.stringify({ error: txError.message }), { status: 500 });
      }
      insertedCount = newTransactions.length;
    }
  }

  await supabaseAdmin
    .from('uploads')
    .update({ status: 'ready', rows_imported: insertedCount, finished_at: new Date().toISOString() })
    .eq('id', uploadId);

  await supabaseAdmin.from('audit_log').insert({
    profile_id: user.id,
    actor: user.email ?? 'user',
    action: 'mm_import',
    payload: {
      upload_id: uploadId,
      rows_total: rows.length,
      rows_imported: insertedCount
    }
  });

  return new Response(
    JSON.stringify({ uploadId, rowsImported: filteredTransactions.length, rowsTotal: rows.length }),
    { status: 200 }
  );
});
