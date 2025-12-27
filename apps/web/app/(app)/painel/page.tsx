'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import { formatCurrency } from '@/lib/format/money';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableContainer } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import Tag from '@/components/ui/Tag';
import NavTabs from '@/components/ui/NavTabs';

type TransactionRecord = {
  id: string;
  payment_date: string;
  desc_raw: string | null;
  amount: number;
  currency: string;
  type: string | null;
  fix_var: string | null;
  category_1: string | null;
  exclude_from_budget: boolean;
  status: string | null;
};

type BudgetRecord = {
  id: string;
  month: string;
  category_1: string | null;
  amount: number;
};

const CATEGORY_OPTIONS = [
  'Receitas',
  'Moradia',
  'Mercado',
  'Compras Online',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros',
  'Interno'
];

function getMonthRange(yyyyMm: string) {
  const [year, monthValue] = yyyyMm.split('-');
  const start = `${year}-${monthValue}-01`;
  const endDate = new Date(Number(year), Number(monthValue), 0);
  const end = `${year}-${monthValue}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function PainelPage() {
  const supabaseClient = useSupabaseClient();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('Processed');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Mercado');
  const [search, setSearch] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('Mercado');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setError('');
    const range = getMonthRange(month);

    const txQuery = supabaseClient
      .from('transactions')
      .select(
        'id, payment_date, desc_raw, amount, currency, type, fix_var, category_1, exclude_from_budget, status'
      )
      .gte('payment_date', range.start)
      .lte('payment_date', range.end)
      .order('payment_date', { ascending: false });

    if (statusFilter) {
      txQuery.eq('status', statusFilter);
    }

    const [txResult, budgetResult] = await Promise.all([
      txQuery,
      supabaseClient.from('budgets').select('id, month, category_1, amount').eq('month', range.start)
    ]);

    if (txResult.error) {
      setError(txResult.error.message);
      return;
    }
    if (budgetResult.error) {
      setError(budgetResult.error.message);
      return;
    }

    setTransactions((txResult.data ?? []) as TransactionRecord[]);
    setBudgets((budgetResult.data ?? []) as BudgetRecord[]);
  }, [month, statusFilter, supabaseClient]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const spent = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'Despesa' && !tx.exclude_from_budget)
      .reduce((sum, tx) => sum + -tx.amount, 0);
  }, [transactions]);

  const receitas = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'Receita' && !tx.exclude_from_budget)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [budgets]);

  const remaining = totalBudget - spent;

  const categorySpend = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type !== 'Despesa' || tx.exclude_from_budget) return;
      const category = tx.category_1 ?? 'Outros';
      const current = map.get(category) ?? 0;
      map.set(category, current + -tx.amount);
    });
    return map;
  }, [transactions]);

  const orderedCategories = useMemo(() => {
    return CATEGORY_OPTIONS.map((category) => ({
      category,
      spent: categorySpend.get(category) ?? 0
    }))
      .filter((entry) => entry.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [categorySpend]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  const drilldownTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedCategory && tx.category_1 !== selectedCategory) return false;
      if (!search) return true;
      return tx.desc_raw?.toLowerCase().includes(search.toLowerCase());
    });
  }, [transactions, selectedCategory, search]);

  const projection = useMemo(() => {
    const now = new Date();
    const range = getMonthRange(month);
    const monthStart = new Date(range.start);
    const monthEnd = new Date(range.end);
    const today = now > monthEnd ? monthEnd : now;
    const daysElapsed = Math.max(1, daysBetween(monthStart, today) + 1);
    const daysRemaining = daysBetween(today, monthEnd);

    const spentSoFar = spent;
    const fixedRemaining = transactions
      .filter(
        (tx) =>
          tx.type === 'Despesa' &&
          !tx.exclude_from_budget &&
          tx.fix_var === 'Fixo' &&
          new Date(tx.payment_date) > today
      )
      .reduce((sum, tx) => sum + -tx.amount, 0);

    const variableSoFar = transactions
      .filter(
        (tx) =>
          tx.type === 'Despesa' &&
          !tx.exclude_from_budget &&
          tx.fix_var === 'Variável' &&
          new Date(tx.payment_date) <= today
      )
      .reduce((sum, tx) => sum + -tx.amount, 0);

    const variableRunRate = variableSoFar / daysElapsed;
    const projection = spentSoFar + fixedRemaining + variableRunRate * daysRemaining;

    return {
      spentSoFar,
      fixedRemaining,
      variableRunRate,
      daysRemaining,
      projection
    };
  }, [month, spent, transactions]);

  const handleAddBudget = async () => {
    setMessage('');
    setError('');
    const amount = Number(budgetAmount.replace(',', '.'));
    if (!Number.isFinite(amount)) {
      setError('Valor de orçamento inválido.');
      return;
    }
    const range = getMonthRange(month);
    const { error } = await supabaseClient.from('budgets').insert({
      month: range.start,
      category_1: budgetCategory,
      amount
    });
    if (error) {
      setError(error.message);
      return;
    }
    setBudgetAmount('');
    setMessage('Orçamento adicionado.');
    await loadDashboard();
  };

  const handleDeleteBudget = async (id: string) => {
    setMessage('');
    setError('');
    const { error } = await supabaseClient.from('budgets').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('Orçamento removido.');
    await loadDashboard();
  };

  const totalSpent = orderedCategories.reduce((sum, entry) => sum + entry.spent, 0);
  const donutStyle = {
    background: totalSpent
      ? `conic-gradient(#22c55e 0deg ${Math.min(360, (orderedCategories[0]?.spent ?? 0) / totalSpent * 360)}deg, #bbf7d0 0deg 240deg, #dcfce7 0deg 300deg, #e5e7eb 0deg)`
      : undefined
  };

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Painel Financeiro</h1>
          <p className="muted">Visão geral das suas finanças este mês.</p>
          <NavTabs
            tabs={[
              { label: 'Painel', href: '/painel', active: true },
              { label: 'Transações', href: '/confirmar' },
              { label: 'Orçamento', href: '/regras' }
            ]}
          />
        </div>
        <div className="dashboard-actions">
          <Button variant="primary" onClick={() => (window.location.href = '/uploads')}>
            Upload CSV
          </Button>
          <div className="dashboard-filters">
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="Processed">Processed</option>
              <option value="">Todos</option>
              <option value="Pending">Pending</option>
              <option value="Declined">Declined</option>
            </Select>
          </div>
        </div>
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          title="Vamos começar o seu ritual financeiro"
          description="Este painel está vazio porque ainda não temos dados. Envie o extrato Miles & More para começar."
          ctaLabel="Enviar extrato agora"
          onCtaClick={() => (window.location.href = '/uploads')}
        />
      ) : (
        <>
          <div className="dashboard-cards">
            <Card variant="kpi">
              <span className="muted">Gasto até agora</span>
              <span className="dashboard-kpi-value">{formatCurrency(spent)}</span>
              <Tag tone="green">+12% vs mês anterior</Tag>
            </Card>
            <Card variant="kpi">
              <span className="muted">Receitas do mês</span>
              <span className="dashboard-kpi-value">{formatCurrency(receitas)}</span>
              <Tag tone="green">+5% vs mês anterior</Tag>
            </Card>
            <Card variant="kpi">
              <span className="muted">Orçamento</span>
              <span className="dashboard-kpi-value">{formatCurrency(totalBudget)}</span>
              <Tag tone="blue">Remaining {formatCurrency(remaining)}</Tag>
            </Card>
            <Card variant="kpi">
              <span className="muted">Projeção do mês</span>
              <span className="dashboard-kpi-value">{formatCurrency(projection.projection)}</span>
              <span className="muted">
                {formatCurrency(projection.spentSoFar)} + {formatCurrency(projection.fixedRemaining)} +{' '}
                {formatCurrency(projection.variableRunRate)} x {projection.daysRemaining} dias
              </span>
            </Card>
          </div>

          <div className="dashboard-grid">
            <Card className="rf-card-default">
              <h2>Gastos por Categoria</h2>
              <div className="donut" style={donutStyle}>
                <div className="donut-center">Total {formatCurrency(totalSpent)}</div>
              </div>
              <div className="category-list">
                {orderedCategories.length === 0 ? (
                  <p className="muted">Nenhuma despesa categorizada no período.</p>
                ) : (
                  orderedCategories.map((entry) => (
                    <button
                      key={entry.category}
                      type="button"
                      className={entry.category === selectedCategory ? 'active' : ''}
                      onClick={() => setSelectedCategory(entry.category)}
                    >
                      <span>{entry.category}</span>
                      <span>{formatCurrency(entry.spent)}</span>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="rf-card-default">
              <h2>Transações Recentes</h2>
              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.payment_date).toLocaleDateString('pt-BR')}</td>
                        <td>{tx.desc_raw}</td>
                        <td>
                          <Tag tone="green">{tx.category_1 ?? 'Outros'}</Tag>
                        </td>
                        <td>{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </Card>
          </div>

          <div className="dashboard-grid">
            <Card className="rf-card-default">
              <h2>Drill-down</h2>
              <Input
                variant="search"
                placeholder="Buscar descrição"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <TableContainer>
                <Table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drilldownTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Nenhuma transação encontrada.</td>
                      </tr>
                    ) : (
                      drilldownTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.desc_raw}</td>
                          <td>{new Date(tx.payment_date).toLocaleDateString('pt-BR')}</td>
                          <td>{formatCurrency(tx.amount)}</td>
                          <td>{tx.status ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableContainer>
            </Card>

            <Card className="rf-card-default">
              <h2>Orçamentos</h2>
              <div className="budget-form">
                <Select value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="Valor"
                  value={budgetAmount}
                  onChange={(event) => setBudgetAmount(event.target.value)}
                />
                <Button onClick={handleAddBudget}>Adicionar</Button>
              </div>
              <ul className="budget-list">
                {budgets.map((budget) => (
                  <li key={budget.id}>
                    <span>{budget.category_1 ?? 'Total'}</span>
                    <span>{formatCurrency(budget.amount)}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteBudget(budget.id)}>
                      Remover
                    </Button>
                  </li>
                ))}
                {budgets.length === 0 && <li>Nenhum orçamento definido.</li>}
              </ul>
            </Card>
          </div>
        </>
      )}

      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}
    </section>
  );
}
