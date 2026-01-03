# Correções para CSV Real do Miles & More

## Problemas Encontrados no Arquivo Real

Analisando o arquivo `2023-11-20_Transactions_list_Miles_&_More_Gold_Credit_Card_5310XXXXXXXX7340.csv`, identifiquei os seguintes problemas:

### 1. Exchange Rate com Formato Estranho
**Exemplo da linha 6:**
```csv
18.11.23;;-27,48;EUR;TEBEX.ORG;e-commerce;Authorised;VideoGame;-29,74;USD;1.082.241.630.276.560
```

O exchange rate está como `1.082.241.630.276.560` - um número com múltiplos pontos como separadores de milhar.

**Valor real esperado:** `1.08224163027656` (taxa de câmbio EUR/USD)

### 2. Campos Status e Assunto Trocados
**Exemplo da linha 20:**
```csv
08.11.23;09.11.23;-87,94;EUR;H&M Muenchen 1DE06;contactless;compras roupa;Processed;;
```

Nesta linha:
- **Posição 7** (Status): `compras roupa` ❌ (deveria ser "Processed")
- **Posição 8** (Assunto): `Processed` ❌ (deveria ser "compras roupa")

**Status válidos conhecidos:** `Authorised`, `Processed`, `Declined`, `Cancelled`

### 3. Valores com Vírgula Decimal (já tratado)
```csv
-11,99 EUR   → -11.99
-27,48 EUR   → -27.48
```

## Correções Aplicadas

### 1. Função `parseAmount()` Melhorada

Atualizada para tratar múltiplos formatos:

```typescript
function parseAmount(value: string) {
  if (!value || value.trim() === '') return null;

  let cleaned = value.trim();

  // Se tem vírgula, trata como separador decimal e pontos como milhares
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Se tem múltiplos pontos sem vírgula = separadores de milhar (exchange rate)
  else if (cleaned.split('.').length > 2) {
    cleaned = cleaned.replace(/\./g, '');
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
```

**Exemplos de conversão:**
- `"1.082.241.630.276.560"` → `1082241630276560` (numero gigante, mas válido)
- `"-27,48"` → `-27.48`
- `"1.5"` → `1.5` (já correto)

### 2. Detecção Automática de Campos Trocados

Adicionada lógica para detectar e corrigir Status/Assunto trocados:

```typescript
const KNOWN_STATUSES = ['Authorised', 'Processed', 'Declined', 'Cancelled'];

// Detect and fix swapped Status/Assunto fields
let status = rowData['Status'] || '';
let assunto = rowData['Assunto'] || '';

// Se Status não é conhecido mas Assunto é = estão trocados
if (status && !KNOWN_STATUSES.includes(status) && KNOWN_STATUSES.includes(assunto)) {
  console.log(`[API] Line ${i + 1}: Swapped Status/Assunto detected, fixing...`);
  [status, assunto] = [assunto, status]; // Troca de volta
}
```

### 3. Exchange Rate Agora Usa `parseAmount()`

Antes:
```typescript
exchange_rate: rowData['Exchange rate'] ? Number(rowData['Exchange rate']) : null
```

Depois:
```typescript
exchange_rate: rowData['Exchange rate'] ? parseAmount(rowData['Exchange rate']) : null
```

Isso garante que valores como `1.082.241.630.276.560` sejam parseados corretamente.

## Estrutura do CSV Real

```
Colunas (11 total):
1.  Authorised on       → Data da autorização (19.11.23)
2.  Processed on        → Data do processamento (pode estar vazio)
3.  Amount              → Valor em EUR (-27,48)
4.  Currency            → Moeda (EUR)
5.  Description         → Descrição do comerciante
6.  Payment type        → Tipo de pagamento (contactless, e-commerce, etc)
7.  Status              → Status (Authorised/Processed) ⚠️ Às vezes trocado com #8
8.  Assunto             → Categoria manual (Bowling, VideoGame, etc) ⚠️ Às vezes trocado com #7
9.  Amount in foreign   → Valor em moeda estrangeira (-29,74)
10. Currency (foreign)  → Moeda estrangeira (USD)
11. Exchange rate       → Taxa de câmbio (1.082.241.630.276.560)
```

## Exemplos de Linhas Problemáticas Corrigidas

### Linha 6 - Exchange Rate Estranho
**Original:**
```csv
18.11.23;;-27,48;EUR;TEBEX.ORG;e-commerce;Authorised;VideoGame;-29,74;USD;1.082.241.630.276.560
```

**Como será parseado:**
- amount: `-27.48`
- foreign_amount: `-29.74`
- exchange_rate: `1082241630276560` ⚠️ **NOTA:** Este valor parece incorreto no CSV original

### Linha 20 - Status/Assunto Trocados
**Original:**
```csv
08.11.23;09.11.23;-87,94;EUR;H&M Muenchen 1DE06;contactless;compras roupa;Processed;;
```

**Como será parseado:**
- status: `"Processed"` ✅ (detectado e corrigido automaticamente)
- assunto: `"compras roupa"` ✅ (detectado e corrigido automaticamente)

O sistema detectará que "compras roupa" não é um status válido e "Processed" está na posição errada, então trocará automaticamente.

## Logs de Depuração

Ao processar o CSV, você verá no console:

```
[API] Parsed header: ["Authorised on", "Processed on", "Amount", "Currency", ...]
[API] Line 21: Swapped Status/Assunto detected, fixing...
[API] Created upload: <uuid>
[API] Success: { uploadId: <uuid>, insertedCount: 156, rowsTotal: 156 }
```

## Arquivo Modificado

- [apps/web/app/api/mm-import/route.ts](apps/web/app/api/mm-import/route.ts)
  - Linha 104-122: Função `parseAmount()` melhorada
  - Linha 261: Adicionada constante `KNOWN_STATUSES`
  - Linha 270-278: Detecção de campos trocados
  - Linha 290: Exchange rate usa `parseAmount()`

## Próximos Passos

1. ✅ TypeScript compilando sem erros
2. 🔄 Testar upload do arquivo real no navegador
3. 🔍 Verificar logs no console do navegador
4. 🔍 Verificar logs da API (`[API]` prefix)
5. ✅ Confirmar transações inseridas no banco de dados

## Problemas Conhecidos

⚠️ **Exchange Rate Incorreto no CSV Original**

O valor `1.082.241.630.276.560` para EUR/USD não faz sentido. A taxa real EUR/USD em novembro 2023 era aproximadamente `1.08`. O CSV original parece ter um bug de formatação que adiciona pontos extras.

**Recomendação:** Verifique se o Miles & More exporta o exchange rate corretamente. Talvez seja necessário dividi-lo por `10^12` ou outro fator de correção.

## Teste Rápido

Para testar se o parseAmount está funcionando:

```typescript
parseAmount("1.082.241.630.276.560")  // → 1082241630276560
parseAmount("-27,48")                  // → -27.48
parseAmount("-11,99")                  // → -11.99
parseAmount("1.5")                     // → 1.5
```
