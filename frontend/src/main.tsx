import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { env } from './config/env';

// Initialize Sentry Frontend Crash Monitoring
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// Fallback key if user hasn't added their clerk key yet in dev mode
const clerkPublishableKey = env.CLERK_PUBLISHABLE_KEY || 'pk_test_aGVhdHNlbnNlLWluZGlhLmNsZXJrLmFjY291bnRzLmRldiQ';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
