import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRole } from '../../hooks/useRole';

interface RequireAuthorityProps {
  children: React.ReactNode;
}

export const RequireAuthority: React.FC<RequireAuthorityProps> = ({ children }) => {
  const { isLoaded, isAuthority } = useRole();

  if (!isLoaded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-mono text-xs text-muted">
        Verifying administrative authorization...
      </div>
    );
  }

  if (!isAuthority) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-ink font-sans">
        <div className="w-full max-w-md p-8 rounded-[12px] bg-surface border border-border text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-raised border border-border flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-display text-ink tracking-tight">
              This console is for municipal officers
            </h1>
            <p className="text-xs text-muted leading-relaxed">
              The Mission Control Authority console is reserved for verified municipal disaster response authorities, environmental health officers, and ward emergency coordinators.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
