import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  HardHat,
  Building2,
  Activity,
  MapPin,
  Menu,
  X,
  ShieldCheck,
  FileText,
  BellRing,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '../../hooks/useRole';
import { useAppStore } from '../../store/useAppStore';
import { INDIAN_STATES, getCitiesForState } from '../../config/indiaGeo';

interface NavItemConfig {
  to: string;
  label: string;
  icon: any;
  roles: ('citizen' | 'worker' | 'authority' | 'admin')[];
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  // Citizen / Worker Role Tabs
  { to: '/app', label: 'Overview', icon: LayoutDashboard, roles: ['citizen', 'worker'] },
  { to: '/app/heat-risk', label: 'Heat Risk', icon: ShieldAlert, roles: ['citizen', 'worker'] },
  { to: '/app/worker', label: 'Worker', icon: HardHat, roles: ['citizen', 'worker'] },
  { to: '/app/account', label: 'Account', icon: BellRing, roles: ['citizen', 'worker'] },

  // Authority / Admin Role Tabs
  { to: '/app/authority', label: 'Mission Control', icon: Building2, roles: ['authority', 'admin'] },
  { to: '/app/wards', label: 'Wards', icon: MapPin, roles: ['authority', 'admin'] },
  { to: '/app/interventions', label: 'Interventions', icon: ShieldCheck, roles: ['authority', 'admin'] },
  { to: '/app/alerts', label: 'Alerts', icon: BellRing, roles: ['authority', 'admin'] },
  { to: '/app/reports', label: 'Reports', icon: FileText, roles: ['authority', 'admin'] },
  { to: '/app/analytics', label: 'Analytics', icon: Activity, roles: ['authority', 'admin'] },
];

export const AppNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthority, role } = useRole();
  const { selectedState, setSelectedState, selectedCity, setSelectedCity } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Available cities for selected state
  const availableCities = getCitiesForState(selectedState);

  // Role-driven navigation array
  const userRole = isAuthority ? 'authority' : 'citizen';
  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border transition-colors">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand -> /app or /app/authority */}
          <Link
            to={isAuthority ? '/app/authority' : '/app'}
            onClick={closeMenu}
            className="flex items-center gap-2 shrink-0 group"
          >
            <img
              src="/thermagrid-logo.png"
              alt="ThermaGrid"
              className="h-8 w-auto object-contain shrink-0"
            />
            {isAuthority && (
              <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase bg-raised border border-border text-ink">
                Authority
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
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

          {/* Right controls: State & City Selectors + User Profile */}
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
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <span className="text-border">/</span>

              {/* City Select */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-ink font-mono font-medium outline-none cursor-pointer text-xs max-w-[85px] sm:max-w-[115px] truncate"
                aria-label="Select City or District"
                title={`City: ${selectedCity}`}
              >
                {availableCities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clerk User Button */}
            <div className="pl-1 shrink-0 flex items-center">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8 rounded-[6px] border border-border',
                  },
                }}
              />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[6px] text-muted hover:text-ink lg:hidden transition-colors border border-border bg-raised"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
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
                  <img
                    src="/thermagrid-logo.png"
                    alt="ThermaGrid"
                    className="h-7 w-auto object-contain"
                  />
                  <button
                    onClick={closeMenu}
                    className="p-1 rounded-[4px] text-muted hover:text-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* State & City Controls in Drawer */}
                <div className="p-3.5 rounded-[6px] bg-raised border border-border space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                    Spatial Jurisdiction Focus
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted block mb-1">State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full bg-surface border border-border rounded-[4px] p-1.5 text-xs font-mono text-ink"
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted block mb-1">City / District</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-surface border border-border rounded-[4px] p-1.5 text-xs font-mono text-ink"
                      >
                        {availableCities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Role-driven Nav links */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold px-2 mb-2">
                    {isAuthority ? 'Authority Console' : 'Navigation'}
                  </div>
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-xs font-mono font-medium transition-colors ${
                          isActive
                            ? 'bg-raised text-ink border border-border font-bold'
                            : 'text-muted hover:text-ink hover:bg-raised'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-muted'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
                <span>Role: <strong className="text-ink uppercase">{role}</strong></span>
                <span className="text-[10px]">ThermaGrid Platform</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
