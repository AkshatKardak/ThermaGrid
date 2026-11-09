import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle #7FA6C9 atmospheric ambient gradient */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full pointer-events-none blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(127, 166, 201, 0.22) 0%, rgba(92, 130, 163, 0.08) 50%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto space-y-6 relative z-10"
      >
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#7FA6C9] to-[#5C82A3] p-0.5 flex items-center justify-center shadow-lg shadow-[#7FA6C9]/20 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#101820] rounded-[8px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#7FA6C9] transition-colors" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#D7E0E7] font-display">
              Therma<span className="bg-gradient-to-r from-[#7FA6C9] to-[#D7E0E7] bg-clip-text text-transparent">Grid</span>
            </span>
          </Link>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">{title}</h1>
            <p className="text-xs text-[#8B9AA8]">{subtitle}</p>
          </div>
        </div>

        {/* Auth component container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, delay: 0.08 }}
          className="flex flex-col items-center justify-center"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};
