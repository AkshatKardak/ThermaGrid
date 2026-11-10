import React from 'react';
import { SignUp, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { DemoAccountPanel } from '../components/auth/DemoAccountPanel';
import { clerkAppearance } from '../theme/clerkAppearance';

export const SignUpPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  if (!isLoaded) {
    return (
      <AuthLayout
        title="Create an account"
        subtitle="Configure personal heat stress alerts and dependent care monitoring"
      >
        <div className="w-full flex justify-center py-12 text-muted text-xs font-mono">
          Loading authentication state...
        </div>
      </AuthLayout>
    );
  }

  if (isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Configure personal heat stress alerts and dependent care monitoring"
    >
      <div className="w-full flex flex-col items-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={redirectUrl}
          appearance={clerkAppearance}
        />
        <DemoAccountPanel />
      </div>
    </AuthLayout>
  );
};
