import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
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
        <div id="demo-account-block" className="mt-4 pt-4 border-t border-border w-full text-center space-y-2">
          <p className="text-xs text-muted">
            Municipal access is granted by an administrator after verification.
          </p>
          <details className="text-[11px] text-muted pt-1 cursor-pointer text-left">
            <summary className="font-sans hover:text-ink transition-colors select-none font-medium text-center">
              How authority access works
            </summary>
            <p className="mt-1.5 p-2.5 rounded-[6px] bg-raised border border-border text-muted leading-relaxed font-sans shadow-none">
              Municipal console access requires verified authorization: an administrator sets <span className="font-mono text-accent">publicMetadata.role = &quot;authority&quot;</span> in Clerk after verification.
            </p>
          </details>
        </div>
      </div>
    </AuthLayout>
  );
};
