import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
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
    borderRadius: '8px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: 'bg-[#142630] border border-white/[0.075] rounded-[14px] shadow-none p-6 sm:p-7 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-[#203A45] border border-white/[0.075] text-[#D8E8E6] hover:bg-white/[0.06] transition-colors rounded-[8px] text-xs font-sans font-medium h-9',
    formFieldLabel: 'text-[#93A3B0] text-xs font-sans font-normal',
    formFieldInput:
      'bg-[#203A45] border border-white/[0.075] text-[#D8E8E6] focus:border-[#8FB3D9] focus:ring-1 focus:ring-[#8FB3D9] transition-colors text-xs font-sans rounded-[8px] h-9',
    footerActionLink: 'text-[#8FB3D9] hover:text-[#A5C4E4] transition-colors font-sans text-xs',
    formButtonPrimary:
      'bg-[#8FB3D9] hover:bg-[#A5C4E4] active:scale-[0.98] text-[#0B141B] font-medium font-sans text-xs transition-colors rounded-[8px] h-9',
    dividerLine: 'bg-white/[0.075]',
    dividerText: 'text-[#6B7C8A] text-xs font-sans',
    footerAction: 'text-xs text-[#93A3B0]',
  },
};

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
        <div className="w-full flex justify-center py-12 text-[#6B7C8A] text-xs">
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
      <div className="w-full flex flex-col items-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={redirectUrl}
          appearance={clerkAppearance}
        />
        <DemoAccountPanel />
      </div>
    </AuthLayout>
  );
};
