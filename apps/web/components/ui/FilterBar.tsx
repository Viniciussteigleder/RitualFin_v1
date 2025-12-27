import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type FilterBarProps = HTMLAttributes<HTMLDivElement>;

export default function FilterBar({ className, ...props }: FilterBarProps) {
  return <div className={clsx('rf-filter-bar', className)} {...props} />;
}
