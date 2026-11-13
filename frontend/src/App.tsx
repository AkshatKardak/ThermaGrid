import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Container } from './components/common/Container';
import { RequireAuth } from './components/common/RequireAuth';
import { ScrollProgressRail } from './components/ui/ScrollProgressRail';

// Public Pages
import { Landing } from './pages/Landing';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { DevKit } from './pages/DevKit';

// Authenticated App Workspace Pages
import { OverviewHub } from './pages/OverviewHub';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { WorkerRisk } from './pages/WorkerRisk';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { Analytics } from './pages/Analytics';
import { LocationDetails } from './pages/LocationDetails';
import { Simulation } from './pages/Simulation';
import { Account } from './pages/Account';

function LocationRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/ward/${id}`} replace />;
}

function AppShell() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink relative">
      {/* Scroll progress rail (2px accent on right edge) */}
      <ScrollProgressRail />

      {/* Global Navbar (switches dynamically between PublicNav and AppNav) */}
      <Navbar />

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/dev/kit" element={<DevKit />} />

          {/* Authenticated App Routes */}
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <Container className="py-6 lg:py-10">
                  <Routes>
                    <Route path="/" element={<OverviewHub />} />
                    <Route path="/heat-risk" element={<CitizenDashboard />} />
                    <Route path="/worker" element={<WorkerRisk />} />
                    <Route path="/authority" element={<AuthorityDashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/simulation" element={<Simulation />} />
                    <Route path="/ward/:id" element={<LocationDetails />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/about" element={<Navigate to="/app" replace />} />
                    <Route path="/docs" element={<Navigate to="/app" replace />} />
                    <Route path="*" element={<Navigate to="/app" replace />} />
                  </Routes>
                </Container>
              </RequireAuth>
            }
          />

          {/* Legacy route redirects */}
          <Route path="/citizen" element={<Navigate to="/app/heat-risk" replace />} />
          <Route path="/worker" element={<Navigate to="/app/worker" replace />} />
          <Route path="/authority" element={<Navigate to="/app/authority" replace />} />
          <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/simulation" element={<Navigate to="/app/simulation" replace />} />
          <Route path="/about" element={<Navigate to="/app" replace />} />
          <Route path="/docs" element={<Navigate to="/" replace />} />
          <Route path="/location/:id" element={<LocationRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer (suppressed on Auth pages to maintain single viewport fit) */}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppShell />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
