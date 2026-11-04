import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullPageSkeleton } from './FullPageSkeleton';
import { env } from '../../config/env';

export interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  // Graceful fallback if clerk key is absent in test/offline setup
  if (!env.CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <FullPageSkeleton />;
  }

  if (!isSignedIn) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect_url=${redirectUrl}`} replace />;
  }

  return <>{children}</>;
}
