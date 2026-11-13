import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { DemoAccountPanel } from '../components/auth/DemoAccountPanel';
import { clerkAppearance } from '../theme/clerkAppearance';

export const SignInPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  // Wait for Clerk to finish loading before evaluating navigation
  if (!isLoaded) {
    return (
      <AuthLayout
        title="Sign in"
        subtitle="Access municipal heat intelligence and live ward advisories"
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
      title="Sign in"
      subtitle="Access municipal heat intelligence and live ward advisories"
    >
      <div id="auth-form-stack" className="w-full flex flex-col items-center">
        <div id="clerk-card-wrapper" className="w-full flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl={redirectUrl}
            appearance={clerkAppearance}
          />
        </div>
        <DemoAccountPanel />
      </div>
    </AuthLayout>
  );
};
