import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'rf-button-sm',
  md: 'rf-button-md',
  lg: 'rf-button-lg'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={clsx('rf-button', `rf-button-${variant}`, sizeMap[size], className)}
      {...props}
    />
  );
}
