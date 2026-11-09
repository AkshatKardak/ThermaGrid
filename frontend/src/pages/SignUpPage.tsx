import React from 'react';
import { SignUp, useUser } from '@clerk/clerk-react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { DemoAccountPanel } from '../components/auth/DemoAccountPanel';

const clerkAppearance = {
  variables: {
    colorPrimary: '#8FB3D9',
    colorBackground: '#142630',
    colorText: '#D8E8E6',
    colorTextSecondary: '#93A3B0',
    colorInputBackground: '#203A45',
    colorInputText: '#D8E8E6',
    borderRadius: '10px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: 'bg-[#142630] border border-white/[0.075] shadow-2xl rounded-[10px]',
    // Hide Clerk internal header title and subtitle to eliminate duplicate "ThermaGrid" branding
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-[#203A45] border-white/[0.075] text-white hover:bg-white/[0.06] transition-colors',
    formFieldLabel: 'text-[#93A3B0] text-xs font-mono',
    formFieldInput:
      'bg-[#203A45] border-white/[0.075] text-[#D8E8E6] focus:border-[#8FB3D9] focus:ring-2 focus:ring-[#8FB3D9]/20 transition-all text-xs font-mono',
    footerActionLink: 'text-[#8FB3D9] hover:text-[#A5C4E4] transition-colors',
    formButtonPrimary:
      'bg-[#8FB3D9] hover:bg-[#A5C4E4] active:scale-[0.985] text-[#0B141B] font-bold font-mono transition-all',
    dividerLine: 'bg-white/[0.075]',
    dividerText: 'text-[#6B7C8A] text-xs font-mono',
  },
};

export const SignUpPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/app';

  if (isLoaded && isSignedIn) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AuthLayout
      title="Create Workspace Account"
      subtitle="Register to configure personal heat stress alerts and dependent care monitoring."
    >
      <div className="w-full flex flex-col items-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl="/app"
          appearance={clerkAppearance}
        />
        <DemoAccountPanel />
      </div>
    </AuthLayout>
  );
};
