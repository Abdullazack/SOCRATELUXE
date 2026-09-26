import * as React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  accent: 'bg-primary text-primary-foreground',
};

function Badge({ className, variant = 'default', ...props }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)} {...props} />;
}

export { Badge };