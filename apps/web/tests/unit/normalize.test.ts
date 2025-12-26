import { describe, it, expect } from 'vitest';
import { normalizeDescription } from '@/lib/format/normalize';

describe('normalizeDescription', () => {
  it('lowercases, removes accents, and normalizes whitespace', () => {
    const result = normalizeDescription('  Açúcar  EXTRA  ');
    expect(result).toBe('acucar extra');
  });
});
