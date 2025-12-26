import { CategoryI } from './categories';

export type Rule = {
  id: string;
  profileId: string;
  type: 'Receita' | 'Despesa';
  fixVar: 'Fixo' | 'Variável';
  category1: CategoryI;
  category2?: string;
  keywords: string;
  internalTransfer?: boolean;
  excludeFromBudget?: boolean;
};
