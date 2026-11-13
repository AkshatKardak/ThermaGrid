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
      borderRadius: '8px',
      width: '100%',
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
      borderRadius: '6px',
    },
    formFieldLabel: 'text-muted text-xs font-sans font-normal',
    formFieldInput: {
      boxShadow: 'none',
      backgroundColor: TOKENS.raised,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: '6px',
    },
    footerActionLink: 'text-accent hover:text-accent-hover transition-colors font-sans text-xs',
    formButtonPrimary: {
      boxShadow: 'none',
      backgroundImage: 'none',
      backgroundColor: TOKENS.accent,
      borderRadius: '6px',
    },
    dividerLine: 'bg-border',
    dividerText: 'text-muted text-xs font-sans',
    footerAction: 'text-xs text-muted',
  },
};
