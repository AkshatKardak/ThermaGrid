import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { env } from '../../config/env';
import { Container } from '../common/Container';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border transition-colors">
      <Container id="header-container">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" id="header-logo" className="flex items-center gap-2 group">
            <img
              src="/thermagrid-logo.png"
              alt="ThermaGrid"
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase bg-raised text-muted border border-border">
              Public
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-muted">
            <a
              href="/#how-it-works"
              className="hover:text-ink transition-colors"
            >
              How it works
            </a>
            <a
              href="/#two-wards"
              className="hover:text-ink transition-colors"
            >
              Ward Comparison
            </a>
            <a
              href="/#methodology"
              className="hover:text-ink transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
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
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-colors ${
                    location.pathname.startsWith('/sign-in')
                      ? 'text-ink bg-raised border border-border'
                      : 'text-muted hover:text-ink hover:bg-raised'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors group"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};
