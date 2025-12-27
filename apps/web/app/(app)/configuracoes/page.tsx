'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableContainer } from '@/components/ui/Table';

type ProfileRecord = {
  id: string;
  locale: string;
  currency: string;
  name: string | null;
};

type AuditRecord = {
  id: string;
  actor: string;
  action: string;
  created_at: string;
};

export default function ConfiguracoesPage() {
  const supabaseClient = useSupabaseClient();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditRecord[]>([]);
  const [email, setEmail] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    const authUser = await supabaseClient.auth.getUser();
    setEmail(authUser.data.user?.email ?? '');
    const { data, error } = await supabaseClient.from('profiles').select('*').single();
    if (error) {
      setError(error.message);
      return;
    }
    setProfile(data as ProfileRecord);
  }, [supabaseClient]);

  const loadAudit = useCallback(async () => {
    const { data, error } = await supabaseClient
      .from('audit_log')
      .select('id, actor, action, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      setError(error.message);
      return;
    }
    setAuditEntries((data ?? []) as AuditRecord[]);
  }, [supabaseClient]);

  useEffect(() => {
    loadProfile();
    loadAudit();
  }, [loadProfile, loadAudit]);

  const handleExport = async () => {
    setMessage('');
    setError('');
    const [year, monthValue] = month.split('-');
    const start = `${year}-${monthValue}-01`;
    const endDate = new Date(Number(year), Number(monthValue), 0);
    const end = `${year}-${monthValue}-${String(endDate.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabaseClient
      .from('transactions')
      .select('payment_date, desc_raw, amount, currency, category_1, category_2, type, fix_var, status')
      .gte('payment_date', start)
      .lte('payment_date', end)
      .order('payment_date', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    const rows = data ?? [];
    const header = [
      'payment_date',
      'desc_raw',
      'amount',
      'currency',
      'category_1',
      'category_2',
      'type',
      'fix_var',
      'status'
    ];
    const csvRows = [header.join(',')];
    rows.forEach((row) => {
      const values = header.map((key) => {
        const value = row[key as keyof typeof row] ?? '';
        const stringValue = String(value).replace(/\"/g, '""');
        return `"${stringValue}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ritualfin-ledger-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    const user = await supabaseClient.auth.getUser();
    if (user.data.user) {
      await supabaseClient.from('audit_log').insert({
        profile_id: user.data.user.id,
        actor: user.data.user.email ?? 'user',
        action: 'export_ledger',
        payload: { month }
      });
    }

    setMessage('Export CSV gerado.');
  };

  return (
    <section className="settings-page">
      <header className="settings-header">
        <h1>Preferências da Conta</h1>
        <p className="muted">Gerencie sua conta, segurança e personalização do RitualFin.</p>
      </header>
      <Card className="rf-card-default">
        <h2>Informações Pessoais</h2>
        <div className="settings-grid">
          <div>
            <span className="muted">E-mail</span>
            <strong>{email || 'Usuário'}</strong>
          </div>
          <div>
            <span className="muted">Locale</span>
            <strong>{profile?.locale ?? 'pt-BR'}</strong>
          </div>
          <div>
            <span className="muted">Moeda</span>
            <strong>{profile?.currency ?? 'EUR'}</strong>
          </div>
        </div>
      </Card>
      <Card className="rf-card-default">
        <h2>Exportar CSV</h2>
        <div className="settings-export">
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <Button onClick={handleExport}>Exportar Ledger</Button>
        </div>
      </Card>
      <Card className="rf-card-default">
        <h2>Preferências Regionais</h2>
        <div className="settings-grid">
          <Select defaultValue="pt-BR">
            <option value="pt-BR">Português (Brasil)</option>
          </Select>
          <Select defaultValue="EUR">
            <option value="EUR">Euro (EUR)</option>
          </Select>
        </div>
      </Card>
      <Card className="rf-card-default">
        <h2>Audit Log</h2>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Ação</th>
                <th>Quem</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nenhuma alteração registrada ainda.</td>
                </tr>
              ) : (
                auditEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.created_at).toLocaleString('pt-BR')}</td>
                    <td>{entry.action}</td>
                    <td>{entry.actor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}
    </section>
  );
}
