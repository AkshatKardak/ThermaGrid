import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { env } from '../../config/env';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

  return (
    <header className="sticky top-0 z-50 bg-[#101820]/90 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-gradient-to-br from-[#7FA6C9] to-[#5C82A3] p-0.5 flex items-center justify-center shadow-lg shadow-[#7FA6C9]/20 shrink-0 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#101820] rounded-[8px] flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#7FA6C9] transition-colors" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#D7E0E7] font-display">
                Therma<span className="bg-gradient-to-r from-[#7FA6C9] to-[#D7E0E7] bg-clip-text text-transparent">Grid</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-white/10 text-[#8B9AA8]">
                Public
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#8B9AA8]">
            <a
              href="/#how-it-works"
              className="hover:text-[#D7E0E7] transition-colors"
            >
              How it works
            </a>
            <a
              href="/#two-wards"
              className="hover:text-[#D7E0E7] transition-colors"
            >
              Ward Comparison
            </a>
            <a
              href="/#methodology"
              className="hover:text-[#D7E0E7] transition-colors"
            >
              Methodology
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Open App</span>
                </Link>
                {env.CLERK_PUBLISHABLE_KEY && <UserButton afterSignOutUrl="/" />}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/sign-in"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.pathname.startsWith('/sign-in')
                      ? 'text-white bg-white/10'
                      : 'text-[#8B9AA8] hover:text-[#D7E0E7] hover:bg-white/5'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7FA6C9] to-[#5C82A3] hover:opacity-95 text-[#101820] text-xs font-semibold shadow-md shadow-[#7FA6C9]/20 transition-all group"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
