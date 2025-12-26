import type { ReactNode } from 'react';
import '../styles/globals.css';

export const metadata = {
  title: 'RitualFin v1',
  description: 'MVP de controle financeiro com foco em uploads Miles & More'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
