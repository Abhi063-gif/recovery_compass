import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
  message?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  message = 'Please sign in or register to access this section.',
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8103E]" />
      </div>
    );
  }

  // Strictly block unauthenticated access across all protected services
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message,
        }}
      />
    );
  }

  // Role restriction enforcement (e.g. ASHA / ANM exclusive routes)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase();
    const allowed = allowedRoles.map((r) => r.toUpperCase());
    if (!allowed.includes(userRole)) {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            message: 'Access restricted: This portal is reserved for verified ASHA workers and ANM supervisors.',
          }}
        />
      );
    }
  }

  return children;
};


