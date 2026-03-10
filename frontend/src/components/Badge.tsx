/**
 * Small status badge.
 *
 * Use this for compact state labels such as success, warning, and error so
 * those states stay visually consistent across pages.
 */
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export default function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const variants = {
    primary: 'bg-[#f0f0f0] text-[#111111] border border-[#d4d4d4]',
    secondary: 'bg-white/68 text-secondary border border-white/72',
    success: 'bg-[#f0f0f0] text-[#3a3a3a] border border-[#d4d4d4]',
    warning: 'bg-[#f4f4f4] text-[#3a3a3a] border border-[#d4d4d4]',
    error: 'bg-[#f4f4f4] text-[#3a3a3a] border border-[#d4d4d4]',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

