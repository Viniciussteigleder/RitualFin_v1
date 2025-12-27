import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import Button from './Button';

type CtaProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export default function Cta({ title, description, actionLabel, onAction, className, ...props }: CtaProps) {
  return (
    <div className={clsx('rf-card rf-card-default', className)} {...props}>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
