import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

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
        <div className="min-h-screen flex flex-col bg-[#101820] text-[#D7E0E7]">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
