'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

type ProfileRecord = {
  id: string;
  locale: string;
  currency: string;
  name: string | null;
};

export default function ConfiguracoesPage() {
  const supabaseClient = useSupabaseClient();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
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

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
        <h1>Configurações</h1>
        <p>Perfil e exportação de dados.</p>
      </header>
      <div className="settings-card">
        <h2>Perfil</h2>
        <div className="settings-grid">
          <div>
            <span>Email</span>
            <strong>{email || 'Usuário'}</strong>
          </div>
          <div>
            <span>Locale</span>
            <strong>{profile?.locale ?? 'pt-BR'}</strong>
          </div>
          <div>
            <span>Moeda</span>
            <strong>{profile?.currency ?? 'EUR'}</strong>
          </div>
        </div>
      </div>
      <div className="settings-card">
        <h2>Exportar CSV</h2>
        <div className="settings-export">
          <label>
            Mês
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <button type="button" onClick={handleExport}>
            Exportar Ledger
          </button>
        </div>
      </div>
      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}
    </section>
  );
}
