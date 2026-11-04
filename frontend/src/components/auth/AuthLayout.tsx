import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF704F] to-[#9B6FD8] p-0.5 flex items-center justify-center shadow-lg shadow-[#FF704F]/20">
              <div className="w-full h-full bg-[#101820] rounded-[7px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF704F] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#D7E0E7] font-display">
              Therma<span className="text-[#FF704F]">Grid</span>
            </span>
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">{title}</h1>
            <p className="text-xs text-[#8B9AA8]">{subtitle}</p>
          </div>
        </div>

        {/* Auth component container */}
        <div className="flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};
