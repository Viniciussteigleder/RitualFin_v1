'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableContainer } from '@/components/ui/Table';
import Tag from '@/components/ui/Tag';

type RuleRecord = {
  id: string;
  type: string;
  fix_var: string;
  category_1: string;
  category_2: string | null;
  keywords: string;
  created_at: string;
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

export default function RegrasPage() {
  const supabaseClient = useSupabaseClient();
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [type, setType] = useState('Despesa');
  const [fixVar, setFixVar] = useState('Variável');
  const [category1, setCategory1] = useState('Outros');
  const [category2, setCategory2] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => keywords.trim().length > 0, [keywords]);

  const loadRules = useCallback(async () => {
    const { data, error } = await supabaseClient.from('rules').select('*').order('created_at', {
      ascending: false
    });
    if (error) {
      setError(error.message);
      return;
    }
    setRules((data ?? []) as RuleRecord[]);
  }, [supabaseClient]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setMessage('');
    setError('');

    const { data, error } = await supabaseClient.from('rules').insert({
      type,
      fix_var: fixVar,
      category_1: category1,
      category_2: category2.trim() ? category2.trim() : null,
      keywords: keywords.trim()
    }).select().single();

    if (error) {
      setError(error.message);
    } else {
      const user = await supabaseClient.auth.getUser();
      if (user.data.user) {
        await supabaseClient.from('audit_log').insert({
          profile_id: user.data.user.id,
          actor: user.data.user.email ?? 'user',
          action: 'rule_created',
          payload: { rule_id: data?.id, keywords: keywords.trim() }
        });
      }
      setMessage('Regra adicionada com sucesso.');
      setKeywords('');
      setCategory2('');
      await loadRules();
    }

    setIsSubmitting(false);
  };

  const handleExport = async () => {
    setMessage('');
    setError('');
    const { data, error } = await supabaseClient.functions.invoke('rules-export-md');
    if (error) {
      setError(error.message);
      return;
    }
    const markdown = data?.markdown ?? '';
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'regras.md';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Exportado regras.md.');
  };

  return (
    <section className="rules-page">
      <header className="rules-header">
        <div>
          <h1>Gerenciar Regras</h1>
          <p className="muted">Defina como o RitualFin organiza suas importações automaticamente.</p>
        </div>
        <div className="rules-actions">
          <Button variant="secondary" onClick={handleExport}>
            Exportar Markdown
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            Nova Regra
          </Button>
        </div>
      </header>
      <Card className="rf-card-default">
        <div className="rules-grid">
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="Despesa">Despesa</option>
            <option value="Receita">Receita</option>
          </Select>
          <Select value={fixVar} onChange={(event) => setFixVar(event.target.value)}>
            <option value="Fixo">Fixo</option>
            <option value="Variável">Variável</option>
          </Select>
          <Select value={category1} onChange={(event) => setCategory1(event.target.value)}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input value={category2} onChange={(event) => setCategory2(event.target.value)} placeholder="Categoria II" />
        </div>
        <Input
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="Keywords (separadas por ;)"
        />
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Adicionar regra'}
        </Button>
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </Card>
      <Card className="rf-card-default">
        <div className="rules-header">
          <h2>Regras cadastradas</h2>
          <div className="rf-filter-bar">
            <Input variant="search" placeholder="Buscar por palavra-chave ou categoria..." />
            <Select variant="pill">
              <option>Tipo: Todos</option>
            </Select>
            <Select variant="pill">
              <option>Fixo/Var: Todos</option>
            </Select>
          </div>
        </div>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Keywords</th>
                <th>Categoria aplicada</th>
                <th>Tipo</th>
                <th>Recorrência</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={4}>Nenhuma regra cadastrada.</td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.keywords}</td>
                    <td>
                      <Tag tone="green">{rule.category_1}</Tag>
                      {rule.category_2 && <span className="muted"> · {rule.category_2}</span>}
                    </td>
                    <td>{rule.type}</td>
                    <td>{rule.fix_var}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
    </section>
  );
}
