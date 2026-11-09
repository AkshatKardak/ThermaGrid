import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    card: 'bg-[#1F3445] border border-white/10 shadow-2xl rounded-[14px]',
    headerTitle: 'text-white font-bold',
    headerSubtitle: 'text-[#8B9AA8]',
    socialButtonsBlockButton: 'bg-[#101820] border-white/10 text-white hover:bg-[#263E50] transition-colors',
    formFieldLabel: 'text-[#8B9AA8]',
    formFieldInput: 'bg-[#101820] border-white/10 text-white focus:border-[#7FA6C9] transition-colors',
    footerActionLink: 'text-[#7FA6C9] hover:text-[#5C82A3] transition-colors',
    formButtonPrimary: 'bg-gradient-to-r from-[#7FA6C9] to-[#5C82A3] hover:opacity-95 text-[#101820] font-semibold font-mono',
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full flex flex-col items-center"
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
      </motion.div>
    </AuthLayout>
  );
};
