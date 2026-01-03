import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function normalizeDuplicateColumns(columns: string[]): string[] {
  const seen = new Map<string, number>();
  return columns.map((col) => {
    const trimmed = col.trim();
    const count = seen.get(trimmed) ?? 0;
    seen.set(trimmed, count + 1);

    if (count === 0) {
      return trimmed;
    }

    // Handle known duplicates intelligently
    if (trimmed === 'Currency' && count === 1) {
      return 'Currency (foreign)';
    }

    // Generic fallback for other duplicates
    return `${trimmed} (${count})`;
  });
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
  if (!value || value.trim() === '') return null;

  const [day, month, year] = value.split('.');
  if (!day || !month || !year) return null;

  // Handle both dd.MM.yy and dd.MM.yyyy formats
  let fullYear = year;
  if (year.length === 2) {
    // Convert 2-digit year to 4-digit (20xx for now, adjust threshold as needed)
    const yearNum = parseInt(year, 10);
    fullYear = yearNum >= 0 && yearNum <= 50 ? `20${year}` : `19${year}`;
  }

  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(value: string) {
  if (!value || value.trim() === '') return null;

  // Handle European format: 1.234,56 -> 1234.56
  // Also handle weird exchange rates like: 1.082.241.630.276.560
  let cleaned = value.trim();

  // If there's a comma, treat it as decimal separator and dots as thousand separators
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.split('.').length > 2) {
    // Multiple dots without comma = thousand separators (exchange rate case)
    cleaned = cleaned.replace(/\./g, '');
  }
  // Single dot = already in correct format

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

function applyRules(descNorm: string, rules: Record<string, any>[]) {
  const matches = rules.filter((rule) => {
    const keywords = rule.keywords
      .split(';')
      .map((keyword: string) => keyword.trim())
      .filter(Boolean);
    return keywords.some((keyword: string) => descNorm.includes(normalizeDescription(keyword)));
  });

  if (matches.length !== 1) {
    return { needsReview: true, rule: null, conflict: matches.length > 1 };
  }

  return { needsReview: false, rule: matches[0], conflict: false };
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] mm-import called');

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

    console.log('[API] Env check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      keyPrefix: supabaseServiceKey.substring(0, 20)
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase envs ausentes' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Bearer token ausente' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const {
      data: { user },
      error: authError
    } = await supabaseAdmin.auth.getUser(token);

    console.log('[API] Auth result:', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalido', details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const csvText = body.csv;
    const filename = body.filename ?? 'upload.csv';

    console.log('[API] Processing CSV:', { filename, size: csvText.length });

    if (!csvText) {
      return NextResponse.json(
        { error: 'CSV nao encontrado no body' },
        { status: 400 }
      );
    }

    const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'CSV vazio' }, { status: 400 });
    }

    // Detect header line (Miles & More exports may have title line first)
    let headerLineIndex = 0;
    const delimiter = detectDelimiter(lines[0]);

    // Check if first line looks like a header or a title
    const firstLineParsed = parseCsvLine(lines[0], delimiter);
    const hasRequiredColumns = REQUIRED_COLUMNS.some((col) => firstLineParsed.includes(col));

    if (!hasRequiredColumns && lines.length > 1) {
      // First line is probably a title (e.g., "Miles & More Gold Credit Card;5310XXXXXXXX7340")
      // Try second line as header
      const secondLineParsed = parseCsvLine(lines[1], delimiter);
      const secondHasRequired = REQUIRED_COLUMNS.some((col) => secondLineParsed.includes(col));

      if (secondHasRequired) {
        console.log('[API] Detected title line, using line 2 as header');
        headerLineIndex = 1;
      }
    }

    const rawHeader = parseCsvLine(lines[headerLineIndex], delimiter);
    const header = normalizeDuplicateColumns(rawHeader);
    console.log('[API] Parsed header:', header);
    const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'Header invalido',
          missing,
          expected: [...REQUIRED_COLUMNS, ...COLUMNS_OPTIONAL]
        },
        { status: 400 }
      );
    }

    const { data: upload } = await supabaseAdmin
      .from('uploads')
      .insert({
        profile_id: user.id,
        filename,
        status: 'processing',
        rows_total: lines.length - headerLineIndex - 1
      })
      .select()
      .single();

    const uploadId = upload?.id;
    if (!uploadId) {
      return NextResponse.json(
        { error: 'Falha ao criar upload' },
        { status: 500 }
      );
    }

    console.log('[API] Created upload:', uploadId);

    // Parse rows (start after header line)
    const rows: RawRow[] = [];
    const KNOWN_STATUSES = ['Authorised', 'Processed', 'Declined', 'Cancelled'];
    const dataStartIndex = headerLineIndex + 1;

    for (let i = dataStartIndex; i < lines.length; i += 1) {
      const values = parseCsvLine(lines[i], delimiter);
      const rowData: Record<string, string> = {};
      header.forEach((column, index) => {
        rowData[column] = values[index] ?? '';
      });

      // Detect and fix swapped Status/Assunto fields
      let status = rowData['Status'] || '';
      let assunto = rowData['Assunto'] || '';

      // If Status is not a known value but Assunto is, they're swapped
      if (status && !KNOWN_STATUSES.includes(status) && KNOWN_STATUSES.includes(assunto)) {
        console.log(`[API] Line ${i + 1}: Swapped Status/Assunto detected, fixing...`);
        [status, assunto] = [assunto, status];
      }

      rows.push({
        authorised_on: rowData['Authorised on'],
        processed_on: rowData['Processed on'] || null,
        amount: rowData['Amount'],
        currency: rowData['Currency'],
        description: rowData['Description'],
        payment_type: rowData['Payment type'],
        status,
        foreign_amount: rowData['Amount in foreign currency'] || null,
        foreign_currency: rowData['Currency (foreign)'] || null,
        exchange_rate: rowData['Exchange rate'] ? parseAmount(rowData['Exchange rate']) : null
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
      return NextResponse.json(
        {
          error: 'CSV invalido',
          details: rowErrors.slice(0, 10)
        },
        { status: 400 }
      );
    }

    const preparedRows = preparedRaw as PreparedRow[];

    // Check for duplicates
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

      existing?.forEach((item: any) => {
        if (item.desc_norm) existingDupes.add(item.desc_norm);
      });
    }

    // Insert raw transactions
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
      return NextResponse.json({ error: rawError.message }, { status: 500 });
    }

    // Insert transactions
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
      const existingKeys = new Set(existing?.map((row: any) => row.key) ?? []);
      const newTransactions = filteredTransactions.filter((item) => !existingKeys.has(item.key as string));

      if (newTransactions.length > 0) {
        const { error: txError } = await supabaseAdmin.from('transactions').insert(newTransactions);
        if (txError) {
          await supabaseAdmin
            .from('uploads')
            .update({ status: 'error', error_message: txError.message })
            .eq('id', uploadId);
          return NextResponse.json({ error: txError.message }, { status: 500 });
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

    console.log('[API] Success:', { uploadId, insertedCount, rowsTotal: rows.length });

    return NextResponse.json({
      uploadId,
      rowsImported: insertedCount,
      rowsTotal: rows.length
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
