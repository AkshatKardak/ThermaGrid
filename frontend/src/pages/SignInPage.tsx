import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { DemoAccountPanel } from '../components/auth/DemoAccountPanel';

const clerkAppearance = {
  variables: {
    colorPrimary: '#7FA6C9',
    colorBackground: '#1F3445',
    colorText: '#D7E0E7',
    borderRadius: '14px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: 'bg-[#1F3445] border border-white/10 shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-[#8B9AA8]',
    socialButtonsBlockButton: 'bg-[#101820] border-white/10 text-white hover:bg-[#263E50]',
    formFieldLabel: 'text-[#8B9AA8]',
    formFieldInput: 'bg-[#101820] border-white/10 text-white focus:border-[#7FA6C9]',
    footerActionLink: 'text-[#7FA6C9] hover:text-[#5C82A3]',
  },
};

export const SignInPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  if (isLoaded && isSignedIn) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to view today's hyperlocal heat stress and ward safety telemetry."
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl="/app"
        appearance={clerkAppearance}
      />
      <DemoAccountPanel />
    </AuthLayout>
  );
};
