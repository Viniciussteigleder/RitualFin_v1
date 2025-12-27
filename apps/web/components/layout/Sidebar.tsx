'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useSupabaseClient, useSession } from '@/lib/supabase/provider';

const NAV_ITEMS = [
  { label: 'Painel', href: '/painel' },
  { label: 'Uploads', href: '/uploads' },
  { label: 'Confirmar', href: '/confirmar' },
  { label: 'Regras', href: '/regras' },
  { label: 'Configurações', href: '/configuracoes' }
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseClient = useSupabaseClient();
  const session = useSession();

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const email = session?.user?.email;

  return (
    <aside className="rf-sidebar">
      <div className="rf-sidebar-brand">
        <div className="rf-logo">R</div>
        <div>
          <div className="rf-sidebar-title">RitualFin</div>
          <div className="muted">{email || 'Gestão financeira'}</div>
        </div>
      </div>
      <nav className="rf-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('rf-sidebar-link', pathname.startsWith(item.href) && 'is-active')}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="rf-sidebar-footer">
        <div className="rf-sidebar-brand">
          <div className="rf-avatar">{email ? email[0].toUpperCase() : 'R'}</div>
          <div>
            <div className="rf-sidebar-title">{email || 'Usuário'}</div>
            <div className="muted">Plano MVP</div>
          </div>
        </div>
        <button type="button" className="rf-button rf-button-secondary rf-button-sm" onClick={handleSignOut}>
          Logout
        </button>
      </div>
    </aside>
  );
}
