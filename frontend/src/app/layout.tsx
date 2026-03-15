/**
 * Root layout for the full Next.js app.
 *
 * This file applies global fonts, global styles, auth state, and shared UI
 * layers that should exist on every page.
 */
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import UISoundLayer from '@/components/UISoundLayer';
import { ErrorBoundary } from '@/components/ClientErrorBoundary';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'Esencelab - Career Intelligence Platform',
  description: 'AI-powered Career Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${playfairDisplay.variable} font-sans bg-background text-primary antialiased selection:bg-accent selection:text-white`}>
      <ErrorBoundary>
        <AuthProvider>
          <UISoundLayer />
          {children}
        </AuthProvider>
      </ErrorBoundary>
      </body>
    </html>
  );
}
