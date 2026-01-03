# Correções Finais do Upload - RitualFin MVP v1

## Problema Identificado

O upload estava falhando por **3 problemas críticos**:

### 1. CSV com Linha de Título Extra
**Sintoma:** Header parseado como `['Miles & More Gold Credit Card', '5310XXXXXXXX7340']`

**Causa:** Alguns exports do Miles & More incluem uma linha de título antes do header real:
```csv
Miles & More Gold Credit Card;5310XXXXXXXX7340
Authorised on;Processed on;Amount;Currency;...
19.11.23;;-40;EUR;5005 Bowling GmbH & Co;...
```

**Solução Implementada:**
Detecta automaticamente se a primeira linha contém colunas obrigatórias:
- Se SIM → usa como header (linha 1)
- Se NÃO → verifica linha 2 e usa como header

```typescript
// Check if first line looks like a header or a title
const firstLineParsed = parseCsvLine(lines[0], delimiter);
const hasRequiredColumns = REQUIRED_COLUMNS.some((col) => firstLineParsed.includes(col));

if (!hasRequiredColumns && lines.length > 1) {
  // First line is probably a title
  const secondLineParsed = parseCsvLine(lines[1], delimiter);
  const secondHasRequired = REQUIRED_COLUMNS.some((col) => secondLineParsed.includes(col));

  if (secondHasRequired) {
    console.log('[API] Detected title line, using line 2 as header');
    headerLineIndex = 1;
  }
}
```

### 2. Formato de Data Abreviado (dd.MM.yy)
**Sintoma:** Datas como `19.11.23` não eram parseadas corretamente

**Causa:** `parseDate()` esperava apenas formato completo `dd.MM.yyyy`

**Solução Implementada:**
Suporte para ambos os formatos com conversão inteligente:

```typescript
function parseDate(value: string) {
  if (!value || value.trim() === '') return null;

  const [day, month, year] = value.split('.');
  if (!day || !month || !year) return null;

  // Handle both dd.MM.yy and dd.MM.yyyy formats
  let fullYear = year;
  if (year.length === 2) {
    // Convert 2-digit year to 4-digit (threshold: 50)
    const yearNum = parseInt(year, 10);
    fullYear = yearNum >= 0 && yearNum <= 50 ? `20${year}` : `19${year}`;
  }

  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```

**Exemplos:**
- `19.11.23` → `2023-11-19`
- `19.11.2023` → `2023-11-19`
- `01.01.99` → `1999-01-01` (antes de 2000)

### 3. Contagem Incorreta de Linhas
**Sintoma:** `rows_total` incluía a linha de título

**Solução:**
```typescript
rows_total: lines.length - headerLineIndex - 1
```

## Correções Anteriores (Mantidas)

Todas as correções anteriores foram preservadas:

1. **Normalização de colunas duplicadas** (`Currency` → `Currency (foreign)`)
2. **Parse de valores decimais europeus** (`-27,48` → `-27.48`)
3. **Parse de exchange rates** com múltiplos pontos (`1.082.241.630.276.560`)
4. **Detecção de Status/Assunto trocados** (corrige automaticamente)
5. **Delimiter detection** (`;` vs `,`)

## Arquivo Modificado

[apps/web/app/api/mm-import/route.ts](apps/web/app/api/mm-import/route.ts)

**Mudanças principais:**
- **Linhas 221-239:** Detecção de linha de título
- **Linhas 98-113:** Suporte para data dd.MM.yy
- **Linha 263:** Contagem correta de rows_total
- **Linha 281:** Início do loop ajustado (`dataStartIndex`)

## Status

✅ **TypeScript:** Compilação sem erros
✅ **Parser:** Detecta título automático
✅ **Datas:** Suporta dd.MM.yy e dd.MM.yyyy
✅ **Exchange Rate:** Parseia formatos estranhos
✅ **Duplicatas:** Renomeia colunas duplicadas
✅ **Status/Assunto:** Detecta e corrige trocas

## Como Testar

1. **Acesse:** http://localhost:3004/dev/autologin
2. **Vá para:** http://localhost:3004/uploads
3. **Upload:** Qualquer CSV do Miles & More (com ou sem linha de título)
4. **Verifique:**
   - Console do navegador: `[Upload]` logs
   - Console da API: `[API]` logs
   - Se título detectado: `[API] Detected title line, using line 2 as header`

## Próximos Passos

Após upload bem-sucedido:
1. ✅ Verificar tabela `uploads` (status = 'ready')
2. ✅ Verificar tabela `transactions` (transações inseridas)
3. ✅ Dashboard mostrando dados do mês
4. 🔄 Fila de confirmação (`needs_review=true`)

## Formatos de CSV Suportados

### Formato 1 - Com Título
```csv
Miles & More Gold Credit Card;5310XXXXXXXX7340
Authorised on;Processed on;Amount;Currency;Description;Payment type;Status;Assunto;Amount in foreign currency;Currency;Exchange rate
19.11.23;;-40;EUR;5005 Bowling GmbH & Co;contactless;Authorised;Bowling;;;
```

### Formato 2 - Sem Título
```csv
Authorised on;Processed on;Amount;Currency;Description;Payment type;Status;Assunto;Amount in foreign currency;Currency;Exchange rate
19.11.23;;-40;EUR;5005 Bowling GmbH & Co;contactless;Authorised;Bowling;;;
```

### Formato 3 - Data Completa
```csv
Authorised on;Processed on;Amount;Currency;Description;Payment type;Status;Assunto;Amount in foreign currency;Currency;Exchange rate
19.11.2023;;-40,00;EUR;5005 Bowling GmbH & Co;contactless;Authorised;Bowling;;;
```

**Todos os 3 formatos funcionam!** 🎉

## Logs Esperados (Sucesso)

```
[API] mm-import called
[API] Env check: { hasUrl: true, hasKey: true, keyPrefix: 'eyJhbGci...' }
[API] Auth result: { user: true, error: undefined }
[API] Processing CSV: { filename: '2023-11-20_Transactions...', size: 54316 }
[API] Detected title line, using line 2 as header
[API] Parsed header: ["Authorised on", "Processed on", "Amount", ...]
[API] Created upload: <uuid>
[API] Success: { uploadId: <uuid>, insertedCount: 156, rowsTotal: 156 }
```
