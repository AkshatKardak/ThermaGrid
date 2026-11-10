import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './i18n';
import App from './App';
import './index.css';
import { env } from './config/env';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { clerkAppearance } from './theme/clerkAppearance';

const ConfigMissingScreen: React.FC = () => (
  <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6 font-sans">
    <div className="max-w-md p-6 rounded-[8px] bg-surface border border-border text-center space-y-3">
      <h1 className="text-lg font-bold text-ink font-display">Clerk Configuration Required</h1>
      <p className="text-xs text-muted leading-relaxed">
        VITE_CLERK_PUBLISHABLE_KEY is not configured. Please supply a valid Clerk publishable key in your environment file.
      </p>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in document');
}

const key = env.CLERK_PUBLISHABLE_KEY;

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      {!key ? (
        <ConfigMissingScreen />
      ) : (
        <ClerkProvider
          publishableKey={key}
          appearance={clerkAppearance}
        >
          <App />
        </ClerkProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
