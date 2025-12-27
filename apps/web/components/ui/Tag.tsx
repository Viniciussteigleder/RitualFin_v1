import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'gray';
};

export default function Tag({ tone = 'gray', className, ...props }: TagProps) {
  return <span className={clsx('rf-tag', `rf-tag-${tone}`, className)} {...props} />;
}
