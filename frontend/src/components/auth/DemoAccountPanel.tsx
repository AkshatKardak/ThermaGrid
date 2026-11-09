import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Copy, Check, ShieldCheck, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoAccountPanel: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, roleLabel: string) => {
    setLoadingRole(roleLabel);
    setCopiedKey(roleLabel);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // ignore clipboard error in strict iframe
    }

    // Attempt automated 1-click Clerk authentication
    if (isSignInLoaded && signIn) {
      try {
        const result = await signIn.create({
          identifier: email,
          password: 'ThermaGrid#2026',
        });

        if (result.status === 'complete' && result.createdSessionId) {
          if (setActive) {
            await setActive({ session: result.createdSessionId });
          }
          setToastMessage(`Signed in as ${roleLabel}. Opening telemetry deck...`);
          setTimeout(() => navigate('/app'), 350);
          return;
        }
      } catch (err: any) {
        // Fallback: Show copied toast so user can paste into the clerk input
        console.warn('Clerk auto-login fallback:', err?.message || err);
      }
    }

    setToastMessage(`Copied ${email} — Password: ThermaGrid#2026`);
    setLoadingRole(null);

    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.12 }}
      className="mt-6 pt-5 border-t border-white/10 w-full max-w-md mx-auto space-y-3.5"
    >
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8B9AA8] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7FA6C9] animate-pulse" />
          <span>One-Click Fast Evaluation</span>
        </span>
        <span className="text-[#8B9AA8]">PWD: ThermaGrid#2026</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Authority Demo Card */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleDemoLogin('authority@thermagrid.demo', 'authority')}
          className="flex items-center justify-between p-3 rounded-[10px] bg-[#101820]/90 hover:bg-[#101820] border border-white/10 hover:border-[#7FA6C9]/60 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
        >
          {/* Subtle gradient highlight */}
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#7FA6C9]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-2.5 min-w-0 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-[#7FA6C9]/15 text-[#8B9AA8] group-hover:text-[#7FA6C9] flex items-center justify-center shrink-0 transition-colors">
              {loadingRole === 'authority' ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#7FA6C9]" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#D7E0E7] truncate group-hover:text-white transition-colors">
                Authority Demo
              </p>
              <p className="text-[10px] font-mono text-[#8B9AA8] truncate">
                Command Deck
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 ml-1">
            {copiedKey === 'authority' && !loadingRole ? (
              <Check className="w-4 h-4 text-[#2FA37C]" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-[#5F7183] group-hover:text-[#7FA6C9] group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </motion.button>

        {/* Citizen Demo Card */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleDemoLogin('citizen@thermagrid.demo', 'citizen')}
          className="flex items-center justify-between p-3 rounded-[10px] bg-[#101820]/90 hover:bg-[#101820] border border-white/10 hover:border-[#7FA6C9]/60 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#7FA6C9]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-2.5 min-w-0 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-[#7FA6C9]/15 text-[#8B9AA8] group-hover:text-[#7FA6C9] flex items-center justify-center shrink-0 transition-colors">
              {loadingRole === 'citizen' ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#7FA6C9]" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#D7E0E7] truncate group-hover:text-white transition-colors">
                Citizen Demo
              </p>
              <p className="text-[10px] font-mono text-[#8B9AA8] truncate">
                Hyperlocal Risk
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 ml-1">
            {copiedKey === 'citizen' && !loadingRole ? (
              <Check className="w-4 h-4 text-[#2FA37C]" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-[#5F7183] group-hover:text-[#7FA6C9] group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="p-2.5 rounded-[8px] bg-gradient-to-r from-[#1F3445] to-[#101820] border border-[#7FA6C9]/40 text-[#D7E0E7] text-xs font-mono text-center shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Workspace Bypass Option for evaluation */}
      <div className="pt-1 flex items-center justify-between text-xs">
        <span className="text-[#5F7183] text-[11px]">Direct evaluator access:</span>
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="text-[11px] font-mono text-[#7FA6C9] hover:text-[#5C82A3] inline-flex items-center gap-1 transition-colors hover:underline cursor-pointer"
        >
          <span>Open Telemetry Deck directly</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};
