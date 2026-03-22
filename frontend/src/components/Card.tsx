/**
 * Shared card container.
 *
 * Most dashboard sections render inside this component so spacing, surfaces,
 * and optional click behavior are reused consistently.
 */
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  onClick?: () => void;
}

export default function Card({ children, className = '', hoverable = true, title, subtitle, action, onClick }: CardProps) {
  const baseClass = hoverable ? 'glass-card' : 'glass-card-no-hover';
  const isInteractive = typeof onClick === 'function';
  return (
    <div
      className={`${baseClass} min-w-0 overflow-hidden ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            {title && <h3 className="text-xl font-semibold text-primary">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-secondary/90">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
