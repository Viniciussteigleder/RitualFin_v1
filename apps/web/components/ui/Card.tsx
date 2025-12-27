import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'kpi' | 'outlined';
};

export default function Card({ variant = 'default', className, ...props }: CardProps) {
  return <div className={clsx('rf-card', `rf-card-${variant}`, className)} {...props} />;
}
