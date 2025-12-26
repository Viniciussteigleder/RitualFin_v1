import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="page-placeholder">
      <h1>RitualFin v1</h1>
      <p>Controle financeiro simples: faça upload do seu CSV Miles &amp; More e veja o dashboard.</p>
      <Link href="/login" className="sidebar-link">
        Entrar com sua conta
      </Link>
    </section>
  );
}
