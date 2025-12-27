import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: 'default' | 'pill';
};

export default function Select({ variant = 'default', className, ...props }: SelectProps) {
  return <select className={clsx('rf-select', `rf-select-${variant}`, className)} {...props} />;
}
