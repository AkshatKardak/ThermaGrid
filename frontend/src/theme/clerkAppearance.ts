import { TOKENS } from './tokens';

export const clerkAppearance = {
  variables: {
    colorPrimary: TOKENS.accent, // #1F3A5F
    colorBackground: TOKENS.raised, // #FBF9F4 (on --raised with 1px border)
    colorText: TOKENS.ink, // #1A1E1C
    colorTextSecondary: TOKENS.muted, // #5E645F
    colorInputBackground: TOKENS.raised, // #FBF9F4
    colorInputText: TOKENS.ink, // #1A1E1C
    borderRadius: '6px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: {
      boxShadow: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '10px',
      width: '100%',
      padding: '32px 28px',
    },
    cardBox: {
      boxShadow: 'none',
      width: '100%',
    },
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: {
      boxShadow: 'none',
      backgroundImage: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '8px',
      height: '46px',
      fontSize: '14px',
      fontWeight: '500',
    },
    formFieldLabel: 'text-muted text-xs font-sans font-medium mb-1.5',
    formFieldInput: {
      boxShadow: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '8px',
      height: '46px',
      fontSize: '15px',
      padding: '0 14px',
    },
    footerActionLink: 'text-accent hover:text-accent-hover transition-colors font-sans text-xs font-semibold',
    formButtonPrimary: {
      boxShadow: 'none',
      backgroundImage: 'none',
      backgroundColor: TOKENS.accent,
      borderRadius: '8px',
      height: '46px',
      fontSize: '15px',
      fontWeight: '600',
    },
    dividerLine: 'bg-border',
    dividerText: 'text-muted text-xs font-sans',
    footerAction: 'text-xs text-muted',
  },
};
