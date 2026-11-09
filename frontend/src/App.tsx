import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ScrollProgressRail } from './components/ui/ScrollProgressRail';
import { RequireAuth } from './components/common/RequireAuth';

// Public & Auth Pages
import { Landing } from './pages/Landing';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

// Authenticated App Workspace Pages
import { OverviewHub } from './pages/OverviewHub';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { WorkerRisk } from './pages/WorkerRisk';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { Analytics } from './pages/Analytics';
import { LocationDetails } from './pages/LocationDetails';
import { Simulation } from './pages/Simulation';
import { About } from './pages/About';
import { Account } from './pages/Account';

function LocationRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/ward/${id}`} replace />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#101820] text-[#D7E0E7] relative selection:bg-[#7FA6C9]/30 selection:text-white">
          {/* Scroll progress rail (2px steel blue on right edge) */}
          <ScrollProgressRail />

          {/* Film grain texture (fixed SVG feTurbulence at 2.8% opacity) */}
          <div className="film-grain" aria-hidden="true" />

          {/* Background grid texture (64px, rgba(255,255,255,.025), masked with radial gradient) */}
          <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" aria-hidden="true" />

          {/* Vignette overlay (transparent center to rgba(0,0,0,.35) at corners) */}
          <div className="fixed inset-0 vignette-overlay pointer-events-none z-0" aria-hidden="true" />

          {/* Global Navbar (switches dynamically between PublicNav and AppNav) */}
          <Navbar />

          {/* Main 12-Column Grid Container */}
          <main className="relative z-10 flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />

              {/* Authenticated App Routes */}
              <Route
                path="/app/*"
                element={
                  <RequireAuth>
                    <Routes>
                      <Route path="/" element={<OverviewHub />} />
                      <Route path="/heat-risk" element={<CitizenDashboard />} />
                      <Route path="/worker" element={<WorkerRisk />} />
                      <Route path="/authority" element={<AuthorityDashboard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/simulation" element={<Simulation />} />
                      <Route path="/ward/:id" element={<LocationDetails />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/about" element={<About />} />
                      <Route path="*" element={<Navigate to="/app" replace />} />
                    </Routes>
                  </RequireAuth>
                }
              />

              {/* Legacy route redirects */}
              <Route path="/citizen" element={<Navigate to="/app/heat-risk" replace />} />
              <Route path="/worker" element={<Navigate to="/app/worker" replace />} />
              <Route path="/authority" element={<Navigate to="/app/authority" replace />} />
              <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
              <Route path="/simulation" element={<Navigate to="/app/simulation" replace />} />
              <Route path="/about" element={<Navigate to="/app/about" replace />} />
              <Route path="/location/:id" element={<LocationRedirect />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
