export const CATEGORY_I = [
  'Receitas',
  'Moradia',
  'Mercado',
  'Compras Online',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros',
  'Interno'
] as const;

export type CategoryI = (typeof CATEGORY_I)[number];
