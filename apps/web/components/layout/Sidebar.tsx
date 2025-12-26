'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';

const NAV_ITEMS = [
  { label: 'Painel', href: '/painel' },
  { label: 'Uploads', href: '/uploads' },
  { label: 'Confirmar', href: '/confirmar' },
  { label: 'Regras', href: '/regras' },
  { label: 'Configurações', href: '/configuracoes' }
];

export default function Sidebar() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const {
    data: { session }
  } = useSessionContext();

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/(auth)/login');
  };

  const email = session?.user?.email;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-title">RitualFin</p>
        <p className="sidebar-subtitle">Bem-vindo{email ? `, ${email}` : ''}</p>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="sidebar-link">
            {item.label}
          </Link>
        ))}
      </nav>
      <button type="button" className="sidebar-logout" onClick={handleSignOut}>
        Logout
      </button>
    </aside>
  );
}
