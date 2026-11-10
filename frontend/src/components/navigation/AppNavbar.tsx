import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  ShieldAlert,
  HardHat,
  Building2,
  Activity,
  Sliders,
  MapPin,
  Menu,
  X,
  UserCheck,
  BellRing,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '../../hooks/useRole';
import { useAppStore } from '../../store/useAppStore';
import { env } from '../../config/env';
import { INDIAN_STATES, getCitiesForState } from '../../config/indiaGeo';

export const AppNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthority, role } = useRole();
  const { selectedState, setSelectedState, selectedCity, setSelectedCity } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cities matching the selected state
  const availableCities = getCitiesForState(selectedState);

  // App Nav Items
  const navItems = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/heat-risk', label: 'Heat Risk', icon: ShieldAlert },
    { to: '/app/worker', label: 'Worker', icon: HardHat },
    ...(isAuthority
      ? [{ to: '/app/authority', label: 'Authority', icon: Building2, highlight: true }]
      : []),
    { to: '/app/analytics', label: 'Analytics', icon: Activity },
    { to: '/app/simulation', label: 'Simulation', icon: Sliders },
    { to: '/app/account', label: 'Account', icon: BellRing },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border transition-colors">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand -> /app */}
          <Link to="/app" onClick={closeMenu} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-[6px] bg-accent flex items-center justify-center transition-transform">
              <Flame className="w-4 h-4 text-on-accent transition-colors" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-ink font-display">
                Therma<span className="text-accent">Grid</span>
              </span>
              {isAuthority && (
                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase bg-raised border border-border text-ink">
                  Authority
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-colors ${
                    isActive
                      ? 'bg-raised text-ink border border-border'
                      : 'text-muted hover:text-ink hover:bg-raised'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Medium screen navigation (compact) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-1">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-colors ${
                    isActive
                      ? 'bg-raised text-ink border border-border'
                      : 'text-muted hover:text-ink hover:bg-raised'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/app/account"
              className={`p-1.5 rounded-[6px] text-xs transition-colors ${
                location.pathname.startsWith('/app/account')
                  ? 'bg-raised text-ink border border-border'
                  : 'text-muted hover:text-ink'
              }`}
              title="Account & Alerts"
            >
              <BellRing className="w-3.5 h-3.5" />
            </Link>
          </nav>

          {/* Right controls: State & City Selectors + User */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Dual State / City Selector */}
            <div className="flex items-center gap-1.5 bg-raised px-2 sm:px-2.5 py-1.5 rounded-[6px] border border-border text-xs">
              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
              
              {/* State Select */}
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent text-ink font-mono font-medium outline-none cursor-pointer text-xs max-w-[90px] sm:max-w-[125px] truncate"
                aria-label="Select State"
                title={`State: ${selectedState}`}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name} className="bg-raised text-ink">
                    {s.name}
                  </option>
                ))}
              </select>

              <span className="text-muted select-none font-mono">/</span>

              {/* City Select */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-accent font-mono font-medium outline-none cursor-pointer pr-1 text-xs max-w-[90px] sm:max-w-[115px] truncate"
                aria-label="Select City"
                title={`City: ${selectedCity}`}
              >
                {availableCities.map((c) => (
                  <option key={c.name} value={c.name} className="bg-raised text-ink">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clerk UserButton */}
            {env.CLERK_PUBLISHABLE_KEY ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-raised border border-border flex items-center justify-center text-xs text-muted">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-[6px] bg-raised border border-border text-ink hover:bg-surface transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-ink/20 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-border z-50 p-6 flex flex-col justify-between overflow-y-auto lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold text-ink font-display">ThermaGrid App</span>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="p-1 rounded-[4px] text-muted hover:text-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* State & City Controls in Drawer */}
                <div className="p-3.5 rounded-[6px] bg-raised border border-border space-y-3">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                    Telemetry Territory
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted block mb-1">State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full bg-surface border border-border rounded-[6px] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s.name} value={s.name} className="bg-surface text-ink">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted block mb-1">City / Urban Center</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-surface border border-border rounded-[6px] px-2.5 py-1.5 text-xs text-accent font-medium outline-none focus:border-accent"
                      >
                        {availableCities.map((c) => (
                          <option key={c.name} value={c.name} className="bg-surface text-ink">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider block px-2 mb-2">
                    Navigation
                  </span>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.to === '/app'
                        ? location.pathname === '/app'
                        : location.pathname.startsWith(item.to);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-raised text-ink border border-border font-medium'
                            : 'text-muted hover:text-ink hover:bg-raised'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-border space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Active Role:</span>
                  <span className="font-mono text-ink capitalize">{role}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Jurisdiction:</span>
                  <span className="font-mono text-accent">{selectedCity}, {selectedState}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
