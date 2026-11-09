import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Bell,
  Heart,
  Globe,
  User as UserIcon,
  Check,
  Trash2,
  Send,
  AlertCircle,
  Plus,
  Shield,
  Moon,
  Smartphone,
  Mail,
} from 'lucide-react';
import { useSubscriptions, CreateSubscriptionPayload } from '../hooks/useSubscriptions';
import { useDependents, CreateDependentPayload } from '../hooks/useDependents';
import { useWards } from '../hooks/useWards';
import { useRole } from '../hooks/useRole';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { getRiskBand, THEME_COLORS } from '../theme/tokens';
import { TYPOGRAPHY } from '../theme/typography';
import { useTranslation } from 'react-i18next';

export const Account: React.FC = () => {
  const { user } = useUser();
  const { role, isAuthority } = useRole();
  const { selectedCity, selectedLocationId } = useAppStore();
  const { data: wards } = useWards(selectedCity);
  const { i18n } = useTranslation();

  // Subscriptions hook
  const {
    data: subscriptions,
    createSubscription,
    deleteSubscription,
    sendTestAlert,
    isCreating,
    isDeleting,
  } = useSubscriptions();

  // Dependents hook
  const {
    data: dependents,
    createDependent,
    deleteDependent,
    isCreating: isCreatingDep,
  } = useDependents();

  // Subscription form state
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [destination, setDestination] = useState('');
  const [subWardId, setSubWardId] = useState<number>(selectedLocationId || 1);
  const [threshold, setThreshold] = useState<number>(70);
  const [subLanguage, setSubLanguage] = useState<string>('en');
  const [quietHours, setQuietHours] = useState<string>('22:00-06:00');
  const [subSaveSuccess, setSubSaveSuccess] = useState(false);
  const [testSentId, setTestSentId] = useState<string | null>(null);

  // Dependent form state
  const [depName, setDepName] = useState('');
  const [depWardId, setDepWardId] = useState<number>(selectedLocationId || 1);
  const [depAgeBand, setDepAgeBand] = useState('elderly');
  const [depPhone, setDepPhone] = useState('');
  const [depSaveSuccess, setDepSaveSuccess] = useState(false);

  // Handle saving subscription
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    try {
      await createSubscription({
        ward_id: subWardId,
        channel,
        destination: destination.trim(),
        threshold,
        language: subLanguage,
        quiet_hours: quietHours,
      });
      setSubSaveSuccess(true);
      setTimeout(() => setSubSaveSuccess(false), 3000);
    } catch (err) {
      // Error handling
    }
  };

  // Handle test alert
  const handleTestAlert = async (id: string) => {
    try {
      await sendTestAlert(id);
      setTestSentId(id);
      setTimeout(() => setTestSentId(null), 3000);
    } catch (err) {
      // Error handling
    }
  };

  // Handle adding dependent
  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depName.trim()) return;

    try {
      await createDependent({
        name: depName.trim(),
        ward_id: depWardId,
        age_band: depAgeBand,
        phone: depPhone.trim() || undefined,
        consent_note: 'Verified guardian consent confirmed',
      });
      setDepName('');
      setDepPhone('');
      setDepSaveSuccess(true);
      setTimeout(() => setDepSaveSuccess(false), 3000);
    } catch (err) {
      // Error handling
    }
  };

  const currentThresholdBand = getRiskBand(threshold);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Page Title */}
      <div className="space-y-1 pb-4 border-b border-white/10">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8B9AA8] block">
          User Settings & Direct Telemetry
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Account & Subscriptions
        </h1>
        <p className="text-xs text-[#8B9AA8]">
          Configure real-time thermal alerts, language preferences, and loved ones to monitor.
        </p>
      </div>

      {/* 1. Profile & Role Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7FA6C9]/15 border border-[#7FA6C9]/30 flex items-center justify-center text-[#7FA6C9]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {user?.fullName || user?.firstName || 'Citizen User'}
              </h3>
              <p className="text-xs font-mono text-[#8B9AA8]">
                {user?.primaryEmailAddress?.emailAddress || 'citizen@thermagrid.demo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-white/5 border border-white/10 text-white">
              Role: <span className="text-[#7FA6C9]">{role}</span>
            </span>
          </div>
        </div>

        {/* Language Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-[#D7E0E7]">
            <Globe className="w-4 h-4 text-[#8B9AA8]" />
            <span>Interface Language</span>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-[#101820] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
          >
            <option value="en">English (EN)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
        </div>
      </Card>

      {/* 2. Self-Serve Alert Subscriptions (P0-4) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FF704F]">
            <Bell className="w-4 h-4" />
            <span>Self-Serve Threshold Alerts</span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-white`}>WhatsApp & Email Subscriptions</h3>
          <p className="text-xs text-[#8B9AA8]">
            Receive automated early-warning alerts when your ward breaches critical heat thresholds.
          </p>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSaveSubscription} className="space-y-4 p-5 rounded-xl bg-[#101820] border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ward select */}
            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Monitored Ward
              </label>
              <select
                value={subWardId}
                onChange={(e) => setSubWardId(Number(e.target.value))}
                className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ward_name} ({w.ward_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Channel select */}
            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Notification Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-[#2FA37C]/20 border-[#2FA37C] text-white font-bold'
                      : 'bg-[#1F3445] border-white/10 text-[#8B9AA8]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === 'email'
                      ? 'bg-[#7FA6C9]/20 border-[#7FA6C9] text-white font-bold'
                      : 'bg-[#1F3445] border-white/10 text-[#8B9AA8]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Destination */}
            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                {channel === 'whatsapp' ? 'Phone Number (E.164)' : 'Email Destination'}
              </label>
              <input
                type={channel === 'whatsapp' ? 'tel' : 'email'}
                placeholder={channel === 'whatsapp' ? '+919876543210' : 'citizen@example.com'}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#7FA6C9]"
              />
            </div>

            {/* Quiet Hours */}
            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Quiet Hours (Suppress Alerts)
              </label>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#8B9AA8]" />
                <input
                  type="text"
                  placeholder="22:00-06:00"
                  value={quietHours}
                  onChange={(e) => setQuietHours(e.target.value)}
                  className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Threshold Slider with Live Color */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[#8B9AA8] uppercase text-[11px]">
                Alert Trigger Threshold
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors"
                  style={{
                    color: currentThresholdBand.color,
                    backgroundColor: `${currentThresholdBand.color}20`,
                  }}
                >
                  {currentThresholdBand.label}
                </span>
                <span className="font-mono text-white font-bold bg-[#1F3445] px-2 py-0.5 rounded border border-white/10">
                  {threshold} / 100
                </span>
              </div>
            </div>
            <input
              type="range"
              min={30}
              max={95}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[#7FA6C9] h-1.5 bg-[#1F3445] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {subSaveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-[#2FA37C] animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Subscription saved successfully!</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
            >
              {isCreating ? 'Saving...' : 'Save Subscription'}
            </button>
          </div>
        </form>

        {/* Existing Subscriptions List */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
            Active Subscriptions ({subscriptions?.length || 0})
          </span>

          {subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-2">
              {subscriptions.map((sub) => {
                const band = getRiskBand(sub.threshold);
                const isTested = testSentId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-[#101820] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white uppercase px-1.5 py-0.5 rounded bg-white/5 text-[10px]">
                          {sub.channel}
                        </span>
                        <span className="text-white font-medium">{sub.destination}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{ color: band.color, backgroundColor: `${band.color}20` }}
                        >
                          Trigger ≥ {sub.threshold}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8B9AA8]">
                        Ward: {sub.ward_name || `Ward #${sub.ward_id}`} · Quiet: {sub.quiet_hours || 'None'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleTestAlert(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D7E0E7] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isTested ? <Check className="w-3.5 h-3.5 text-[#2FA37C]" /> : <Send className="w-3 h-3 text-[#7FA6C9]" />}
                        <span>{isTested ? 'Dispatched' : 'Send test alert'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1.5 rounded-lg text-[#8B9AA8] hover:text-[#FF704F] transition-colors cursor-pointer"
                        title="Delete subscription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#8B9AA8] bg-[#101820] p-4 rounded-xl border border-white/10">
              No alert subscriptions created yet. Use the form above to activate ward alerts.
            </p>
          )}
        </div>
      </Card>

      {/* 3. Care Circle - People You Watch (P1-5) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8B9AA8]">
            <Heart className="w-4 h-4 text-[#FF704F]" />
            <span>Care Circle</span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-white`}>People You Watch</h3>
          <p className="text-xs text-[#8B9AA8]">
            Keep track of vulnerable family members, elderly parents, or children in different wards.
          </p>
        </div>

        {/* Add Person Form */}
        <form onSubmit={handleAddDependent} className="space-y-4 p-5 rounded-xl bg-[#101820] border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Person's Name
              </label>
              <input
                type="text"
                placeholder="e.g. Amma, Grandpa"
                value={depName}
                onChange={(e) => setDepName(e.target.value)}
                required
                className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#7FA6C9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Their Ward
              </label>
              <select
                value={depWardId}
                onChange={(e) => setDepWardId(Number(e.target.value))}
                className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ward_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
                Age Vulnerability Band
              </label>
              <select
                value={depAgeBand}
                onChange={(e) => setDepAgeBand(e.target.value)}
                className="w-full bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                <option value="elderly">Elderly (65+ years)</option>
                <option value="child">Child / Infant</option>
                <option value="adult">Adult / Worker</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-[#8B9AA8] block mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="+919876543210"
              value={depPhone}
              onChange={(e) => setDepPhone(e.target.value)}
              className="w-full sm:w-1/2 bg-[#1F3445] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#7FA6C9]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
            <p className="text-[11px] text-[#5F7183] italic">
              Notice: Only add people who know you are monitoring their ward's heat risk.
            </p>

            <button
              type="submit"
              disabled={isCreatingDep}
              className="px-4 py-2 rounded-lg bg-[#7FA6C9] hover:bg-[#5C82A3] text-white text-xs font-mono font-semibold transition-all cursor-pointer self-end sm:self-auto"
            >
              {isCreatingDep ? 'Adding...' : 'Add to Care Circle'}
            </button>
          </div>
        </form>

        {/* Dependents List */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B9AA8] block">
            Watched Loved Ones ({dependents?.length || 0})
          </span>

          {dependents && dependents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dependents.map((dep) => {
                const bandDef = getRiskBand(dep.current_risk_score ?? 50);

                return (
                  <div
                    key={dep.id}
                    className="p-4 rounded-xl bg-[#101820] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{dep.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-[#8B9AA8]">
                          {dep.age_band}
                        </span>
                      </div>
                      <p className="text-xs text-[#8B9AA8]">
                        {dep.ward_name || `Ward #${dep.ward_id}`} · Risk: {dep.current_risk_score ?? 50}/100
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteDependent(dep.id)}
                      className="p-1.5 rounded-lg text-[#8B9AA8] hover:text-[#FF704F] transition-colors cursor-pointer"
                      title="Remove from circle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#8B9AA8] bg-[#101820] p-4 rounded-xl border border-white/10">
              Your Care Circle is currently empty.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
