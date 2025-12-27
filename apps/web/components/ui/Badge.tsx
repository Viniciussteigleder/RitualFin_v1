import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
};

export default function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={clsx('rf-badge', `rf-badge-${tone}`, className)} {...props} />;
}
