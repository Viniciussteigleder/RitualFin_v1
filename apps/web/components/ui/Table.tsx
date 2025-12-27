import type { HTMLAttributes, TableHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={clsx('rf-table', className)} {...props} />;
}

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rf-table-container', className)} {...props} />;
}
