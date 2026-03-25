'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getDefaultWorkspacePath } from '@/lib/routeAccess';

interface UseRoleAccessOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const useRoleAccess = ({ allowedRoles, redirectTo }: UseRoleAccessOptions) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const hasAllowedRole = useMemo(() => {
    return !!user && allowedRoles.includes(user.role);
  }, [allowedRoles, user]);

  const shouldRedirect = !isLoading && !!user && !hasAllowedRole;

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace(redirectTo || getDefaultWorkspacePath(user?.role));
  }, [redirectTo, router, shouldRedirect, user?.role]);

  return {
    user,
    hasAllowedRole,
    isCheckingAccess: isLoading || !user || shouldRedirect,
  };
};
