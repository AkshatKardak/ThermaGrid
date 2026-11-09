import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { ShieldCheck, User, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoAccountPanel: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, roleLabel: string) => {
    setLoadingRole(roleLabel);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // ignore
    }

    // 1-Click Clerk login
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
          setTimeout(() => navigate('/app'), 300);
          return;
        }
      } catch (err: any) {
        console.warn('Clerk direct demo sign-in notice:', err?.message || err);
      }
    }

    setToastMessage(`Copied ${email} (Password: ThermaGrid#2026)`);
    setLoadingRole(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mt-4 pt-3 border-t border-white/[0.075] w-full max-w-sm mx-auto space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7C8A] uppercase tracking-wider">
        <span>DEMO ACCESS ACCOUNTS</span>
        <span className="text-[#93A3B0]">PWD: ThermaGrid#2026</span>
      </div>

      {/* Two ghost buttons with dashed 1px hairline-2 borders */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleDemoLogin('authority@thermagrid.demo', 'authority')}
          className="h-10 px-3 rounded-[8px] bg-transparent hover:bg-white/[0.04] active:bg-white/[0.08] border border-dashed border-white/[0.14] hover:border-[#8FB3D9] flex items-center justify-center gap-2 text-xs font-mono text-[#D8E8E6] transition-all cursor-pointer group disabled:opacity-50"
        >
          {loadingRole === 'authority' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8FB3D9]" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-[#6B7C8A] group-hover:text-[#8FB3D9] transition-colors" />
          )}
          <span>Authority</span>
        </button>

        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleDemoLogin('citizen@thermagrid.demo', 'citizen')}
          className="h-10 px-3 rounded-[8px] bg-transparent hover:bg-white/[0.04] active:bg-white/[0.08] border border-dashed border-white/[0.14] hover:border-[#8FB3D9] flex items-center justify-center gap-2 text-xs font-mono text-[#D8E8E6] transition-all cursor-pointer group disabled:opacity-50"
        >
          {loadingRole === 'citizen' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8FB3D9]" />
          ) : (
            <User className="w-3.5 h-3.5 text-[#6B7C8A] group-hover:text-[#8FB3D9] transition-colors" />
          )}
          <span>Citizen</span>
        </button>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2 rounded-[6px] bg-[#142630] border border-[#8FB3D9]/40 text-[#D8E8E6] text-[11px] font-mono text-center shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-1 flex items-center justify-between text-[11px]">
        <span className="text-[#5F7183]">Direct workspace bypass:</span>
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="text-[11px] font-mono text-[#8FB3D9] hover:text-[#A5C4E4] inline-flex items-center gap-1 transition-colors hover:underline cursor-pointer"
        >
          <span>Open Telemetry Deck</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
