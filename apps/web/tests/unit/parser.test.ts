import { describe, it, expect } from 'vitest';
import { buildKeyDesc, parseAmount, parseDate } from '@/lib/pipeline/mmParser';

describe('M&M parser helpers', () => {
  it('parses dd.MM.yyyy into ISO date', () => {
    expect(parseDate('05.02.2024')).toBe('2024-02-05');
  });

  it('parses comma decimal into number', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });

  it('builds key description with foreign currency', () => {
    const key = buildKeyDesc('AMAZON', 'Card', 'Processed', 'USD');
    expect(key).toContain('compra internacional em USD');
  });
});
