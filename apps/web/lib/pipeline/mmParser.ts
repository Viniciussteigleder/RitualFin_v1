export function parseDate(value: string) {
  const [day, month, year] = value.split('.');
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function parseAmount(value: string) {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildKeyDesc(description: string, paymentType: string, status: string, foreignCurrency?: string | null) {
  const base = `${description} -- ${paymentType} -- ${status} -- M&M - Description`;
  if (foreignCurrency) {
    return `${base} -- compra internacional em ${foreignCurrency}`;
  }
  return base;
}
