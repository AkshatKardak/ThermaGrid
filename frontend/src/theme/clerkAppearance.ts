import { TOKENS } from './tokens';

export const clerkAppearance = {
  variables: {
    colorPrimary: TOKENS.accent, // #1F3A5F
    colorBackground: TOKENS.surface, // #EAE5DA
    colorText: TOKENS.ink, // #1A1E1C
    colorTextSecondary: TOKENS.muted, // #5E645F
    colorInputBackground: TOKENS.raised, // #FBF9F4
    colorInputText: TOKENS.ink, // #1A1E1C
    borderRadius: '6px',
    fontFamily: 'IBM Plex Sans, sans-serif',
  },
  elements: {
    card: 'bg-surface border border-border rounded-[8px] p-6 sm:p-7 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-raised border border-border text-ink hover:bg-bg transition-colors rounded-[6px] text-xs font-sans font-medium h-9',
    formFieldLabel: 'text-muted text-xs font-sans font-normal',
    formFieldInput:
      'bg-raised border border-border text-ink focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-xs font-sans rounded-[6px] h-9',
    footerActionLink: 'text-accent hover:text-accent-hover transition-colors font-sans text-xs',
    formButtonPrimary:
      'bg-accent hover:bg-accent-hover active:scale-[0.98] text-on-accent font-medium font-sans text-xs transition-colors rounded-[6px] h-9',
    dividerLine: 'bg-border',
    dividerText: 'text-muted text-xs font-sans',
    footerAction: 'text-xs text-muted',
  },
};
