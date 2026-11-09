import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './i18n';
import App from './App';
import './index.css';
import { env } from './config/env';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
              colorPrimary: '#8FB3D9',
              colorBackground: '#142630',
              colorText: '#D8E8E6',
              borderRadius: '10px',
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
