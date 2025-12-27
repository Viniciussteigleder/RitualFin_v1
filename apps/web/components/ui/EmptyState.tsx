import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import Button from './Button';

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
};

export default function EmptyState({
  title,
  description,
  ctaLabel,
  onCtaClick,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={clsx('rf-empty', className)} {...props}>
      <div className="rf-empty-hero" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {ctaLabel && <Button onClick={onCtaClick}>{ctaLabel}</Button>}
    </div>
  );
}
