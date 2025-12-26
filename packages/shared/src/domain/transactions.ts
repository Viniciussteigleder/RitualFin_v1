export type LedgerTransaction = {
  id: string;
  paymentDate: string;
  amount: number;
  currency: string;
  descRaw: string;
  descNorm: string;
  key: string;
  type?: 'Receita' | 'Despesa';
  fixVar?: 'Fixo' | 'Variável';
  category1?: string;
  category2?: string;
  manualOverride: boolean;
  excludeFromBudget: boolean;
  needsReview: boolean;
  createdAt: string;
};
