import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ScrollProgressRail } from './components/ui/ScrollProgressRail';

// Pages
import { Landing } from './pages/Landing';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { WorkerRisk } from './pages/WorkerRisk';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { Analytics } from './pages/Analytics';
import { LocationDetails } from './pages/LocationDetails';
import { Simulation } from './pages/Simulation';
import { About } from './pages/About';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#101820] text-[#D7E0E7] relative selection:bg-[#9B6FD8]/30 selection:text-white">
          {/* Scroll progress rail (2px amethyst on right edge) */}
          <ScrollProgressRail />

          {/* Film grain texture (fixed SVG feTurbulence at 2.8% opacity) */}
          <div className="film-grain" aria-hidden="true" />

          {/* Background grid texture (64px, rgba(255,255,255,.025), masked with radial gradient) */}
          <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" aria-hidden="true" />

          {/* Vignette overlay (transparent center to rgba(0,0,0,.35) at corners) */}
          <div className="fixed inset-0 vignette-overlay pointer-events-none z-0" aria-hidden="true" />

          {/* Global Navbar */}
          <Navbar />

          {/* Main 12-Column Grid Container (max width 1320px, gutter 24px, margin 40px / 24px mobile) */}
          <main className="relative z-10 flex-1 max-w-[1320px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-14">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/worker" element={<WorkerRisk />} />
              <Route path="/authority" element={<AuthorityDashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/location/:id" element={<LocationDetails />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/about" element={<About />} />
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
