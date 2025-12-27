import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'search';
};

export default function Input({ variant = 'default', className, ...props }: InputProps) {
  return <input className={clsx('rf-input', `rf-input-${variant}`, className)} {...props} />;
}
