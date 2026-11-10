import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoAccountPanel: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, roleLabel: string, targetRedirect: string) => {
    setLoadingRole(roleLabel);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // ignore
    }

    // 1-Click Clerk login with role-specific target redirect
    if (isSignInLoaded && signIn) {
      try {
        const result = await signIn.create({
          identifier: email,
          password: 'ThermaGrid#2026',
        });

        if (result.status === 'complete' && result.createdSessionId) {
          if (setActive) {
            await setActive({
              session: result.createdSessionId,
              redirectUrl: targetRedirect,
            });
          }
          setToastMessage(`Signed in as ${roleLabel}. Opening telemetry deck...`);
          setTimeout(() => navigate(targetRedirect), 300);
          return;
        }
      } catch (err: any) {
        console.warn('Clerk direct demo sign-in notice:', err?.message || err);
      }
    }

    setToastMessage(`Copied ${email} credentials to clipboard`);
    setLoadingRole(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.075] w-full max-w-sm mx-auto space-y-2.5">
      <div className="flex items-center justify-between text-xs text-[#6B7C8A]">
        <span className="font-sans">Demo access</span>
        <span className="text-[#93A3B0] text-xs font-mono">Pre-authenticated</span>
      </div>

      {/* Single quiet Authority demo button landing on /app/authority */}
      <button
        type="button"
        disabled={loadingRole !== null}
        onClick={() => handleDemoLogin('authority@thermagrid.demo', 'authority', '/app/authority')}
        className="w-full h-9 px-3 rounded-[8px] bg-[#203A45] hover:bg-[#203A45]/80 active:scale-[0.98] border border-white/[0.075] hover:border-white/[0.15] flex items-center justify-center gap-2 text-xs font-sans font-medium text-[#D8E8E6] transition-colors cursor-pointer group disabled:opacity-50"
      >
        {loadingRole === 'authority' ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#8FB3D9]" strokeWidth={1.5} />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#8FB3D9]" strokeWidth={1.5} />
        )}
        <span>Sign in as Authority (demo)</span>
      </button>

      {/* Role Provisioning Explanatory Notice */}
      <p className="text-[11px] leading-relaxed text-[#6B7C8A] pt-0.5">
        Municipal console access requires verified authorization: officers become authority users when an administrator sets <span className="font-mono text-[#8FB3D9]">publicMetadata.role = &quot;authority&quot;</span> in Clerk after verification — not by choosing it at sign-up.
      </p>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="p-2.5 rounded-[8px] bg-[#203A45] border border-white/[0.075] text-[#D8E8E6] text-xs font-sans text-center shadow-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-1 flex items-center justify-between text-xs">
        <span className="text-[#6B7C8A]">Explore without account</span>
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="text-xs text-[#8FB3D9] hover:text-[#A5C4E4] inline-flex items-center gap-1 transition-colors cursor-pointer font-sans"
        >
          <span>Open dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
