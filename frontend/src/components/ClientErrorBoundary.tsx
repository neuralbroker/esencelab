'use client';

import { ReactNode } from 'react';
import { ErrorBoundary as ErrorBoundaryComponent } from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundaryComponent>
      {children}
    </ErrorBoundaryComponent>
  );
}
