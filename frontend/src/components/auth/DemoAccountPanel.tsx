import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, User } from 'lucide-react';

export const DemoAccountPanel: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const copyCredentials = (email: string, roleLabel: string) => {
    const textToCopy = `${email}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(roleLabel);
    setToastMessage(`Copied ${email} — Password: ThermaGrid#2026`);

    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="mt-6 pt-5 border-t border-white/10 w-full max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8B9AA8] uppercase tracking-wider">
        <span>Fast Evaluation Demo Accounts</span>
        <span className="text-[#9B6FD8]">PWD: ThermaGrid#2026</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => copyCredentials('authority@thermagrid.demo', 'authority')}
          className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#101820]/80 hover:bg-[#101820] border border-white/10 hover:border-[#9B6FD8]/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#9B6FD8]/15 text-[#9B6FD8] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#D7E0E7] truncate group-hover:text-white">
                Authority Demo
              </p>
              <p className="text-[10px] font-mono text-[#8B9AA8] truncate">
                authority@...
              </p>
            </div>
          </div>
          {copiedKey === 'authority' ? (
            <Check className="w-4 h-4 text-[#2FA37C] shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#5F7183] group-hover:text-[#9B6FD8] shrink-0 transition-colors" />
          )}
        </button>

        <button
          type="button"
          onClick={() => copyCredentials('citizen@thermagrid.demo', 'citizen')}
          className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#101820]/80 hover:bg-[#101820] border border-white/10 hover:border-[#9B6FD8]/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FF704F]/15 text-[#FF704F] flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#D7E0E7] truncate group-hover:text-white">
                Citizen Demo
              </p>
              <p className="text-[10px] font-mono text-[#8B9AA8] truncate">
                citizen@...
              </p>
            </div>
          </div>
          {copiedKey === 'citizen' ? (
            <Check className="w-4 h-4 text-[#2FA37C] shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#5F7183] group-hover:text-[#9B6FD8] shrink-0 transition-colors" />
          )}
        </button>
      </div>

      {toastMessage && (
        <div className="p-2.5 rounded-lg bg-[#9B6FD8]/15 border border-[#9B6FD8]/40 text-[#D7E0E7] text-xs font-mono text-center animate-in fade-in slide-in-from-bottom-1 duration-200">
          {toastMessage}
        </div>
      )}

      <p className="text-[11px] text-[#8B9AA8] text-center leading-relaxed">
        Click to copy email address. Password is <code className="text-white bg-white/5 px-1 py-0.5 rounded font-mono">ThermaGrid#2026</code>. Role comes directly from Clerk verified metadata.
      </p>
    </div>
  );
};
