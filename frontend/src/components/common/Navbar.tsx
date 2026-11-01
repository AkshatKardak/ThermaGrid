import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, ShieldAlert, Activity, HardHat, Building2, Sliders, Info, MapPin, Menu, X } from 'lucide-react';
import { useAppStore, USER_ROLES } from '../../store/useAppStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { selectedCity, setSelectedCity, userRole, setUserRole } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Overview', shortLabel: 'Overview', icon: Flame },
    { to: '/citizen', label: 'Citizen', shortLabel: 'Citizen', icon: ShieldAlert },
    { to: '/worker', label: 'Worker Risk', shortLabel: 'Worker', icon: HardHat },
    { to: '/authority', label: 'Authority Console', shortLabel: 'Authority', icon: Building2 },
    { to: '/analytics', label: 'Analytics', shortLabel: 'Analytics', icon: Activity },
    { to: '/simulation', label: 'What-If Sandbox', shortLabel: 'Sandbox', icon: Sliders },
    { to: '/about', label: 'About & Provenance', shortLabel: 'About', icon: Info },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[#101820]/95 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Platform Name */}
          <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#FF704F] to-[#9B6FD8] p-0.5 flex items-center justify-center shadow-lg shadow-[#FF704F]/20 shrink-0">
              <div className="w-full h-full bg-[#101820] rounded-[7px] flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF704F] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-[#D7E0E7] font-display whitespace-nowrap">
                  Therma<span className="text-[#FF704F]">Grid</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-white/10 text-[#8B9AA8] whitespace-nowrap">
                  National Telemetry
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-[#8B9AA8] -mt-0.5 tracking-wide whitespace-nowrap">
                Hyperlocal Human Thermal Stress Warning
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links (Visible on lg/xl screens) */}
          <nav className="hidden lg:flex items-center gap-1 shrink min-w-0 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#9B6FD8]/20 text-white border border-[#9B6FD8]/40 shadow-sm'
                      : 'text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#9B6FD8]' : ''}`} />
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="inline xl:hidden">{link.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* City & Role Controls + Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* City Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1F3445] px-2 sm:px-2.5 py-1.5 rounded-lg border border-white/10 text-xs shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#9B6FD8] shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-[#D7E0E7] font-medium outline-none cursor-pointer pr-1 text-xs"
                aria-label="Select City"
              >
                <option value="Mumbai" className="bg-[#1F3445]">Mumbai</option>
                <option value="Delhi" className="bg-[#1F3445]">Delhi</option>
              </select>
            </div>

            {/* Role Persona Toggle (hidden on mobile, visible from sm up) */}
            <div className="hidden sm:flex items-center p-0.5 bg-[#1F3445] rounded-lg border border-white/10 text-xs shrink-0">
              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`px-2 py-1 rounded capitalize transition-colors whitespace-nowrap text-xs ${
                    userRole === role
                      ? 'bg-[#9B6FD8] text-white font-semibold shadow-sm'
                      : 'text-[#8B9AA8] hover:text-[#D7E0E7]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-[#1F3445] border border-white/10 text-[#D7E0E7] hover:text-white hover:bg-[#263E50] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#101820]/98 border-b border-white/10 px-4 pt-2 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Role Switcher */}
          <div className="sm:hidden pt-2">
            <span className="text-[11px] font-mono text-[#8B9AA8] uppercase tracking-wider block mb-1.5">
              Select Role View:
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#1F3445] rounded-lg border border-white/10">
              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role);
                    closeMobileMenu();
                  }}
                  className={`py-1.5 rounded capitalize text-center text-xs font-medium transition-colors ${
                    userRole === role
                      ? 'bg-[#9B6FD8] text-white font-semibold shadow-sm'
                      : 'text-[#8B9AA8] hover:text-[#D7E0E7]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1">
            <span className="text-[11px] font-mono text-[#8B9AA8] uppercase tracking-wider block mb-1.5">
              Navigation
            </span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#9B6FD8]/20 text-white border border-[#9B6FD8]/40 shadow-sm'
                      : 'text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#9B6FD8]' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
