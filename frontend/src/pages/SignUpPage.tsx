import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { DemoAccountPanel } from '../components/auth/DemoAccountPanel';

const clerkAppearance = {
  variables: {
    colorPrimary: '#9B6FD8',
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
    formFieldInput: 'bg-[#101820] border-white/10 text-white focus:border-[#9B6FD8]',
    footerActionLink: 'text-[#9B6FD8] hover:text-[#7F56BD]',
  },
};

export const SignUpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join ThermaGrid for ward-level thermal forecasts, indoor heat advisories, and custom alerts."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={redirectUrl}
        appearance={clerkAppearance}
      />
      <DemoAccountPanel />
    </AuthLayout>
  );
};
