import { normalizeDescription } from '../format/normalize';

type Rule = {
  id: string;
  keywords: string;
};

export function matchRules(descNorm: string, rules: Rule[]) {
  const matches = rules.filter((rule) => {
    const keywords = rule.keywords
      .split(';')
      .map((keyword) => normalizeDescription(keyword.trim()))
      .filter(Boolean);
    return keywords.some((keyword) => descNorm.includes(keyword));
  });

  if (matches.length !== 1) {
    return { match: null, needsReview: true, conflict: matches.length > 1 };
  }

  return { match: matches[0], needsReview: false, conflict: false };
}
