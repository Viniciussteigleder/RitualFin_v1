# CSV Header Validation Fix

## Issue
The CSV upload was failing with "Header invalido" error because the Miles & More export file has:
1. **Semicolon delimiters** (`;`) instead of commas
2. **Duplicate "Currency" column** appearing twice in the header

## Actual CSV Header
```
Authorised on;Processed on;Amount;Currency;Description;Payment type;Status;Assunto;Amount in foreign currency;Currency;Exchange rate
```

Notice that "Currency" appears at positions 4 and 10.

## Root Cause
The original CSV parsing logic couldn't handle duplicate column names. When two columns have the same name, the second one would overwrite the first in the row data mapping, causing data loss and validation errors.

## Solution Applied

### 1. Added `normalizeDuplicateColumns` Function
Created a new function to intelligently rename duplicate columns:

```typescript
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
```

This function:
- Tracks how many times each column name appears
- Keeps the first occurrence unchanged
- Renames the second "Currency" to "Currency (foreign)" (matches our expected schema)
- Has a generic fallback for any other duplicates

### 2. Updated Header Parsing
Modified the CSV processing to use the normalization function:

```typescript
const delimiter = detectDelimiter(lines[0]);
const rawHeader = parseCsvLine(lines[0], delimiter);
const header = normalizeDuplicateColumns(rawHeader);
console.log('[API] Parsed header:', header);
```

## Result
The normalized header becomes:
```
[
  "Authorised on",
  "Processed on",
  "Amount",
  "Currency",
  "Description",
  "Payment type",
  "Status",
  "Assunto",
  "Amount in foreign currency",
  "Currency (foreign)",  // ← Renamed from duplicate "Currency"
  "Exchange rate"
]
```

This now matches all required columns:
- ✅ Authorised on
- ✅ Processed on
- ✅ Amount
- ✅ Currency
- ✅ Description
- ✅ Payment type
- ✅ Status
- ✅ Amount in foreign currency
- ✅ Currency (foreign)
- ✅ Exchange rate

## Files Modified
- `apps/web/app/api/mm-import/route.ts`
  - Added `normalizeDuplicateColumns()` function at line 68
  - Updated header parsing at line 208-210
  - Added debug logging for parsed header

## Testing
- ✅ TypeScript compilation passes
- ✅ Next.js build completes successfully
- ✅ API route ready to handle Miles & More CSV files with semicolon delimiters and duplicate columns

## Next Steps
The upload functionality should now work correctly with your actual Miles & More CSV files. Try uploading a file and check:
1. Browser console for `[Upload]` logs showing the upload process
2. Network tab to verify the API call succeeds (status 200)
3. Supabase database to confirm transactions are inserted
4. Uploads page to see the import in the history table
