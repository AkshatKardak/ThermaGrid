import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { ShieldCheck, Loader2 } from 'lucide-react';
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

        if (result.status !== 'complete' || !result.createdSessionId) {
          setToastMessage(`Clerk returned "${result.status}" — check the demo user and password strategy`);
          setLoadingRole(null);
          return;
        }

        if (setActive) {
          await setActive({
            session: result.createdSessionId,
            redirectUrl: targetRedirect,
          });
        }
        setToastMessage(`Signed in as ${roleLabel}. Opening telemetry deck...`);
        setTimeout(() => navigate(targetRedirect), 300);
        return;
      } catch (err: unknown) {
        const anyErr = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
        const msg = anyErr?.errors?.[0]?.longMessage || anyErr?.errors?.[0]?.message
                  || anyErr?.message || 'Demo sign-in failed';
        setToastMessage(msg);
        setLoadingRole(null);
        return; // do NOT fall through to the clipboard toast
      }
    }

    setToastMessage(`Copied ${email} credentials to clipboard`);
    setLoadingRole(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div id="demo-account-block" className="mt-4 pt-4 border-t border-border w-full space-y-2.5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-sans">Demo access</span>
        <span className="text-muted text-xs font-mono">Pre-authenticated</span>
      </div>

      {/* Single quiet Authority demo button landing on /app/authority */}
      <button
        type="button"
        disabled={loadingRole !== null}
        onClick={() => handleDemoLogin('authority@thermagrid.demo', 'authority', '/app/authority')}
        className="w-full h-9 px-3 rounded-[6px] bg-raised hover:bg-surface border border-border flex items-center justify-center gap-2 text-xs font-sans font-medium text-ink transition-colors cursor-pointer group disabled:opacity-50 shadow-none"
      >
        {loadingRole === 'authority' ? (
          <Loader2 className="w-4 h-4 animate-spin text-accent" strokeWidth={1.5} />
        ) : (
          <ShieldCheck className="w-4 h-4 text-accent" strokeWidth={1.5} />
        )}
        <span>Sign in as Authority (demo)</span>
      </button>

      {/* Role Provisioning Explanatory Notice */}
      <p className="text-xs leading-relaxed text-muted pt-0.5">
        Authority access is granted by an administrator after verification.
      </p>

      <details className="text-[11px] text-muted pt-1 cursor-pointer">
        <summary className="font-sans hover:text-ink transition-colors select-none font-medium">
          How authority access works
        </summary>
        <p className="mt-1.5 p-2.5 rounded-[6px] bg-raised border border-border text-muted leading-relaxed font-sans shadow-none">
          Municipal console access requires verified authorization: officers become authority users when an administrator sets <span className="font-mono text-accent">publicMetadata.role = &quot;authority&quot;</span> in Clerk after verification — not by choosing it at sign-up.
        </p>
      </details>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="p-2.5 rounded-[6px] bg-raised border border-border text-ink text-xs font-sans text-center shadow-none"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
