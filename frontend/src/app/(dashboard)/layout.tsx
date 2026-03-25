'use client';

/**
 * Shared dashboard layout.
 *
 * This wraps all authenticated pages with the common navbar and layout
 * spacing so each role-based page starts from the same shell.
 */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/Loading';
import Navbar from '@/components/Navbar';
import { getLoginHref } from '@/lib/routeAccess';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(getLoginHref(pathname));
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Loading text="Redirecting to sign in..." fullScreen />;
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <Navbar />
      <main className="w-full pb-10">
        {children}
      </main>
    </div>
  );
}
