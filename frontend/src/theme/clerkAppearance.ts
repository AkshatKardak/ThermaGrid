import { TOKENS } from './tokens';

export const clerkAppearance = {
  variables: {
    colorPrimary: TOKENS.accent, // #1F3A5F
    colorBackground: TOKENS.raised, // #FBF9F4
    colorText: TOKENS.ink, // #1A1E1C
    colorTextSecondary: TOKENS.muted, // #5E645F
    colorInputBackground: TOKENS.raised, // #FBF9F4
    colorInputText: TOKENS.ink, // #1A1E1C
    borderRadius: '8px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '10px',
      width: '100%',
      maxWidth: '480px',
      padding: '36px 32px',
    },
    cardBox: {
      boxShadow: 'none',
      width: '100%',
      maxWidth: '480px',
    },
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: {
      boxShadow: 'none',
      backgroundImage: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '8px',
      height: '48px',
      fontSize: '15px',
      fontWeight: '500',
    },
    formFieldLabel: 'text-muted text-xs font-sans font-medium mb-2',
    formFieldInput: {
      boxShadow: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '8px',
      height: '48px',
      fontSize: '15px',
      padding: '0 16px',
    },
    footerActionLink: 'text-accent hover:text-accent-hover transition-colors font-sans text-xs font-semibold',
    formButtonPrimary: {
      boxShadow: 'none',
      backgroundImage: 'none',
      backgroundColor: TOKENS.accent,
      borderRadius: '8px',
      height: '48px',
      fontSize: '15px',
      fontWeight: '600',
    },
    dividerLine: 'bg-border',
    dividerText: 'text-muted text-xs font-sans',
    footerAction: 'text-xs text-muted pt-2',
  },
};
