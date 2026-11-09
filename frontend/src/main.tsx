import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import * as Sentry from '@sentry/react';
import './i18n';
import App from './App';
import './index.css';
import { env } from './config/env';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Initialize Sentry Frontend Crash Monitoring
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// Only mount ClerkProvider if a valid live/test key is provided
const isClerkKeyConfigured = Boolean(
  env.CLERK_PUBLISHABLE_KEY &&
  (env.CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') || env.CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) &&
  !env.CLERK_PUBLISHABLE_KEY.includes('heatsense-india')
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in document');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isClerkKeyConfigured ? (
        <ClerkProvider
          publishableKey={env.CLERK_PUBLISHABLE_KEY!}
          appearance={{
            variables: {
              colorPrimary: '#7FA6C9',
              colorBackground: '#1F3445',
              colorText: '#D7E0E7',
              borderRadius: '14px',
              fontFamily: 'IBM Plex Sans, sans-serif',
            },
          }}
        >
          <App />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
