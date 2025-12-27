'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Tag from '@/components/ui/Tag';
import { Table, TableContainer } from '@/components/ui/Table';

type TransactionRecord = {
  id: string;
  payment_date: string;
  desc_raw: string;
  amount: number;
  amount_display: string | null;
  currency: string;
  type: string | null;
  fix_var: string | null;
  category_1: string | null;
  category_2: string | null;
  exclude_from_budget: boolean;
  needs_review: boolean;
  rule_miss: boolean;
  rule_conflict: boolean;
  duplicate_suspect: boolean;
  status: string | null;
};

type EditState = {
  type: string;
  fixVar: string;
  category1: string;
  category2: string;
  excludeFromBudget: boolean;
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

const TYPE_OPTIONS = ['Despesa', 'Receita'];
const FIXVAR_OPTIONS = ['Fixo', 'Variável'];

export default function ConfirmarPage() {
  const supabaseClient = useSupabaseClient();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<Record<string, EditState>>({});
  const [month, setMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('Processed');
  const [batchType, setBatchType] = useState('');
  const [batchFixVar, setBatchFixVar] = useState('');
  const [batchCategory1, setBatchCategory1] = useState('');
  const [batchCategory2, setBatchCategory2] = useState('');
  const [batchExclude, setBatchExclude] = useState(false);
  const [createRule, setCreateRule] = useState(true);
  const [ruleKeywords, setRuleKeywords] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const buildUpdatePayload = (state: Partial<EditState>) => {
    const payload: Record<string, string | boolean | null> = {};
    if (state.type) payload.type = state.type;
    if (state.fixVar) payload.fix_var = state.fixVar;
    if (state.category1) payload.category_1 = state.category1;
    if (state.category2 !== undefined) payload.category_2 = state.category2 || null;
    if (typeof state.excludeFromBudget === 'boolean') {
      payload.exclude_from_budget = state.excludeFromBudget;
    }
    if (state.category1 === 'Interno') {
      payload.internal_transfer = true;
      payload.exclude_from_budget = true;
    }
    payload.manual_override = true;
    payload.needs_review = false;
    payload.rule_miss = false;
    payload.rule_conflict = false;
    payload.duplicate_suspect = false;
    return payload;
  };

  const loadTransactions = useCallback(async () => {
    setError('');
    const query = supabaseClient
      .from('transactions')
      .select(
        'id, payment_date, desc_raw, amount, amount_display, currency, type, fix_var, category_1, category_2, exclude_from_budget, needs_review, rule_miss, rule_conflict, duplicate_suspect, status'
      )
      .eq('needs_review', true)
      .order('payment_date', { ascending: false });

    if (month) {
      const [year, monthValue] = month.split('-');
      if (year && monthValue) {
        const start = `${year}-${monthValue}-01`;
        const endDate = new Date(Number(year), Number(monthValue), 0);
        const end = `${year}-${monthValue}-${String(endDate.getDate()).padStart(2, '0')}`;
        query.gte('payment_date', start).lte('payment_date', end);
      }
    }

    if (statusFilter) {
      query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      return;
    }

    const rows = (data ?? []) as TransactionRecord[];
    setTransactions(rows);
    const nextEditState: Record<string, EditState> = {};
    rows.forEach((row) => {
      nextEditState[row.id] = {
        type: row.type ?? '',
        fixVar: row.fix_var ?? '',
        category1: row.category_1 ?? '',
        category2: row.category_2 ?? '',
        excludeFromBudget: row.exclude_from_budget ?? false
      };
    });
    setEditState(nextEditState);
  }, [month, statusFilter, supabaseClient]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdateRow = async (id: string) => {
    setIsSaving(true);
    setMessage('');
    setError('');
    const state = editState[id];
    const payload = buildUpdatePayload(state);
    const { error } = await supabaseClient.from('transactions').update(payload).eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      const user = await supabaseClient.auth.getUser();
      if (user.data.user) {
        await supabaseClient.from('audit_log').insert({
          profile_id: user.data.user.id,
          actor: user.data.user.email ?? 'user',
          action: 'confirm_single',
          payload: { transaction_id: id, payload }
        });
      }
      setMessage('Linha atualizada.');
      await loadTransactions();
    }
    setIsSaving(false);
  };

  const handleBatchApply = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    setMessage('');
    setError('');

    let ruleId: string | null = null;
    if (createRule && ruleKeywords.trim()) {
      const { data, error } = await supabaseClient
        .from('rules')
        .insert({
          type: batchType || 'Despesa',
          fix_var: batchFixVar || 'Variável',
          category_1: batchCategory1 || 'Outros',
          category_2: batchCategory2.trim() ? batchCategory2.trim() : null,
          keywords: ruleKeywords.trim()
        })
        .select()
        .single();
      if (error) {
        setError(error.message);
        setIsSaving(false);
        return;
      }
      ruleId = data?.id ?? null;
      const user = await supabaseClient.auth.getUser();
      if (user.data.user && ruleId) {
        await supabaseClient.from('audit_log').insert({
          profile_id: user.data.user.id,
          actor: user.data.user.email ?? 'user',
          action: 'rule_created',
          payload: { rule_id: ruleId, keywords: ruleKeywords.trim() }
        });
      }
    }

    const payload = buildUpdatePayload({
      type: batchType,
      fixVar: batchFixVar,
      category1: batchCategory1,
      category2: batchCategory2,
      excludeFromBudget: batchExclude
    });
    if (ruleId) {
      payload.rule_id_applied = ruleId;
    }

    const { error } = await supabaseClient
      .from('transactions')
      .update(payload)
      .in('id', Array.from(selectedIds));
    if (error) {
      setError(error.message);
    } else {
      const user = await supabaseClient.auth.getUser();
      if (user.data.user) {
        await supabaseClient.from('audit_log').insert({
          profile_id: user.data.user.id,
          actor: user.data.user.email ?? 'user',
          action: 'confirm_batch',
          payload: { ids: Array.from(selectedIds), payload }
        });
      }
      setMessage('Itens confirmados em lote.');
      setSelectedIds(new Set());
      await loadTransactions();
    }
    setIsSaving(false);
  };

  const selectedCount = selectedIds.size;
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) => tx.desc_raw.toLowerCase().includes(term));
  }, [transactions, searchTerm]);
  const getTags = (tx: TransactionRecord) => {
    const tags: Array<{ label: string; tone: 'amber' | 'red' | 'blue' }> = [];
    if (tx.needs_review) {
      if (tx.rule_miss) {
        tags.push({ label: 'Sem match', tone: 'amber' });
      }
      if (tx.rule_conflict) {
        tags.push({ label: 'Conflito', tone: 'red' });
      }
      if (tx.duplicate_suspect) {
        tags.push({ label: 'Duplicado?', tone: 'blue' });
      }
    }
    return tags;
  };

  return (
    <section className="confirm-page">
      <header className="confirm-header">
        <div>
          <h1>Pedidos de Confirmação</h1>
          <p className="muted">Analise os itens ambíguos para garantir a precisão do orçamento mensal.</p>
        </div>
        <div className="confirm-filters">
          <Input
            variant="search"
            placeholder="Buscar transações, categorias..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="Processed">Processed</option>
            <option value="">Todos</option>
            <option value="Pending">Pending</option>
            <option value="Declined">Declined</option>
          </Select>
        </div>
      </header>

      <div className="dashboard-cards">
        <Card variant="kpi">
          <span className="muted">Total pendente</span>
          <span className="dashboard-kpi-value">{transactions.length}</span>
        </Card>
        <Card variant="kpi">
          <span className="muted">Sem categoria</span>
          <span className="dashboard-kpi-value">{transactions.filter((t) => t.rule_miss).length}</span>
        </Card>
        <Card variant="kpi">
          <span className="muted">Conflitos</span>
          <span className="dashboard-kpi-value">{transactions.filter((t) => t.rule_conflict).length}</span>
        </Card>
      </div>

      <Card className="rf-card-default">
        <h2>Aplicar em lote</h2>
        <div className="confirm-grid">
          <Select value={batchType} onChange={(event) => setBatchType(event.target.value)}>
            <option value="">Tipo</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select value={batchFixVar} onChange={(event) => setBatchFixVar(event.target.value)}>
            <option value="">Fixo/Var</option>
            {FIXVAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select value={batchCategory1} onChange={(event) => setBatchCategory1(event.target.value)}>
            <option value="">Categoria</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input placeholder="Categoria II" value={batchCategory2} onChange={(event) => setBatchCategory2(event.target.value)} />
          <label className="confirm-toggle">
            <input
              type="checkbox"
              checked={batchExclude}
              onChange={(event) => setBatchExclude(event.target.checked)}
            />
            Excluir do orçamento
          </label>
        </div>
        <div className="confirm-rule">
          <label className="confirm-toggle">
            <input type="checkbox" checked={createRule} onChange={(event) => setCreateRule(event.target.checked)} />
            Criar/atualizar regra automática
          </label>
          <Input
            placeholder="Keyword para regra (ex: AMAZON; AMZN)"
            value={ruleKeywords}
            onChange={(event) => setRuleKeywords(event.target.value)}
          />
        </div>
        <Button onClick={handleBatchApply} disabled={selectedCount === 0 || isSaving}>
          {isSaving ? 'Salvando...' : `Confirmar ${selectedCount} itens`}
        </Button>
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </Card>

      <Card className="rf-card-default">
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th />
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Tags</th>
                <th>Confirmar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8}>Nenhuma exceção encontrada.</td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const state = editState[transaction.id];
                  const tags = getTags(transaction);
                  return (
                    <tr key={transaction.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${transaction.desc_raw}`}
                          checked={selectedIds.has(transaction.id)}
                          onChange={() => handleSelect(transaction.id)}
                        />
                      </td>
                      <td>{new Date(transaction.payment_date).toLocaleDateString('pt-BR')}</td>
                      <td>{transaction.desc_raw}</td>
                      <td>
                        {transaction.amount_display ?? transaction.amount} {transaction.currency}
                      </td>
                      <td>
                        {transaction.rule_conflict ? (
                          <Badge tone="warning">Conflito</Badge>
                        ) : transaction.rule_miss ? (
                          <Badge tone="info">Sem categoria</Badge>
                        ) : (
                          <Badge tone="neutral">Sugestão</Badge>
                        )}
                      </td>
                      <td>
                        <Select
                          value={state?.category1 ?? ''}
                          onChange={(event) =>
                            setEditState((prev) => ({
                              ...prev,
                              [transaction.id]: { ...prev[transaction.id], category1: event.target.value }
                            }))
                          }
                        >
                          <option value="">Selecionar</option>
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td>
                        {tags.length === 0
                          ? '-'
                          : tags.map((tag) => (
                              <Tag key={tag.label} tone={tag.tone}>
                                {tag.label}
                              </Tag>
                            ))}
                      </td>
                      <td>
                        <Button size="sm" onClick={() => handleUpdateRow(transaction.id)} disabled={isSaving}>
                          Salvar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
    </section>
  );
}
