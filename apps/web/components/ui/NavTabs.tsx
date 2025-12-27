import Link from 'next/link';
import clsx from 'clsx';

type Tab = {
  label: string;
  href: string;
  active?: boolean;
};

export default function NavTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="dashboard-tabs">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={clsx(tab.active && 'active')}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
