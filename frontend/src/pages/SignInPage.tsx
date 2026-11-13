import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { clerkAppearance } from '../theme/clerkAppearance';

export const SignInPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access municipal heat intelligence and live ward advisories"
    >
      <div id="auth-form-stack" className="w-full flex flex-col items-center">
        <div id="clerk-card-wrapper" className="w-full flex justify-center">
          {!isLoaded ? (
            <div className="w-full h-80 rounded-[10px] bg-raised border border-border flex items-center justify-center text-muted text-xs font-mono animate-pulse">
              Loading authentication...
            </div>
          ) : (
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl={redirectUrl}
              appearance={clerkAppearance}
            />
          )}
        </div>
        <div id="demo-account-block" className="mt-6 pt-5 border-t border-border w-full text-center space-y-2.5">
          <p className="text-xs text-muted leading-relaxed">
            Municipal console access is granted by an administrator after official verification.
          </p>
          <details className="text-xs text-muted pt-1 cursor-pointer text-left">
            <summary className="font-sans hover:text-ink transition-colors select-none font-medium text-center">
              How authority access works
            </summary>
            <p className="mt-2 p-3.5 rounded-[8px] bg-raised border border-border text-muted leading-relaxed font-sans shadow-none text-xs">
              Municipal console access requires verified authorization: an administrator sets <span className="font-mono text-accent font-semibold">publicMetadata.role = &quot;authority&quot;</span> in Clerk after verification.
            </p>
          </details>
        </div>
      </div>
    </AuthLayout>
  );
};
