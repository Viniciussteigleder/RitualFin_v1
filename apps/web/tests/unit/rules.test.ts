import { describe, it, expect } from 'vitest';
import { matchRules } from '@/lib/rules/engine';
import { normalizeDescription } from '@/lib/format/normalize';

describe('rules engine', () => {
  it('returns a single match when exactly one rule matches', () => {
    const desc = normalizeDescription('Pagamento AMAZON marketplace');
    const result = matchRules(desc, [{ id: '1', keywords: 'amazon; amzn' }]);
    expect(result.needsReview).toBe(false);
    expect(result.match?.id).toBe('1');
  });

  it('returns conflict when multiple rules match', () => {
    const desc = normalizeDescription('Mercado REWE');
    const result = matchRules(desc, [
      { id: '1', keywords: 'rewe; edeka' },
      { id: '2', keywords: 'rewe' }
    ]);
    expect(result.needsReview).toBe(true);
    expect(result.conflict).toBe(true);
  });

  it('returns needs review when no rules match', () => {
    const desc = normalizeDescription('Descricao sem match');
    const result = matchRules(desc, [{ id: '1', keywords: 'amazon' }]);
    expect(result.needsReview).toBe(true);
    expect(result.match).toBe(null);
  });
});
