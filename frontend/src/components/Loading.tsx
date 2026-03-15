'use client';

import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ 
  text = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin text-primary`} 
      aria-hidden="true"
    />
  );

  if (fullScreen) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background"
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        {spinner}
        {text && <p className="text-muted-foreground">{text}</p>}
        <span className="sr-only">{text}</span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center gap-4 py-12"
      role="status"
      aria-live="polite"
    >
      {spinner}
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
      <span className="sr-only">{text}</span>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading text="Loading page..." />
    </div>
  );
}

export function InlineLoading({ text }: { text?: string }) {
  return (
    <span 
      className="inline-flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {text && <span className="text-sm">{text}</span>}
      <span className="sr-only">{text || 'Loading'}</span>
    </span>
  );
}
