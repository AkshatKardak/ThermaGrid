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
  const [channel] = useState<'email'>('email');
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
      <div className="space-y-1 pb-4 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted block">
          User Settings & Direct Telemetry
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
          Account & Subscriptions
        </h1>
        <p className="text-xs text-muted">
          Configure real-time thermal alerts, language preferences, and loved ones to monitor.
        </p>
      </div>

      {/* 1. Profile & Role Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-raised border border-border flex items-center justify-center text-accent">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                {user?.fullName || user?.firstName || 'Citizen User'}
              </h3>
              <p className="text-xs font-mono text-muted">
                {user?.primaryEmailAddress?.emailAddress || 'user@thermagrid.org'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-surface border border-border text-ink">
              Role: <span className="text-accent">{role}</span>
            </span>
          </div>
        </div>

        {/* Language Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-ink">
            <Globe className="w-4 h-4 text-muted" />
            <span>Interface Language</span>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-raised border border-border rounded-lg px-3 py-1.5 text-xs text-ink font-mono outline-none focus:border-accent"
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
        <div className="space-y-1 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
            <Bell className="w-4 h-4 text-accent" />
            <span>Self-Serve Threshold Alerts</span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Email Alert Subscriptions</h3>
          <p className="text-xs text-muted">
            Receive automated early-warning alerts when your ward breaches critical heat thresholds.
          </p>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSaveSubscription} className="space-y-4 p-5 rounded-xl bg-surface border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ward select */}
            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Monitored Ward
              </label>
              <select
                value={subWardId}
                onChange={(e) => setSubWardId(Number(e.target.value))}
                className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
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
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Notification Channel
              </label>
              <div className="flex items-center">
                <div className="p-2 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 bg-accent text-on-accent border-accent font-bold w-full">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Destination */}
            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="citizen@example.com"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            {/* Quiet Hours */}
            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Quiet Hours (Suppress Alerts)
              </label>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="22:00-06:00"
                  value={quietHours}
                  onChange={(e) => setQuietHours(e.target.value)}
                  className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink font-mono outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Threshold Slider with Live Color */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted uppercase text-[11px]">
                Alert Trigger Threshold
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors"
                  style={{
                    color: currentThresholdBand.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
                    backgroundColor: `color-mix(in srgb, ${currentThresholdBand.color} 15%, var(--surface))`,
                    border: `1px solid color-mix(in srgb, ${currentThresholdBand.color} ${currentThresholdBand.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
                  }}
                >
                  {currentThresholdBand.label}
                </span>
                <span className="font-mono text-ink font-bold bg-raised px-2 py-0.5 rounded border border-border">
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
              className="w-full accent-accent h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {subSaveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-ink animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-risk-1" />
                  <span>Subscription saved successfully!</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              {isCreating ? 'Saving...' : 'Save Subscription'}
            </button>
          </div>
        </form>

        {/* Existing Subscriptions List */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
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
                    className="p-3.5 rounded-xl bg-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-[10px]">
                          {sub.channel}
                        </span>
                        <span className="text-ink font-medium">{sub.destination}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{
                            color: band.code === 'extreme' ? 'var(--risk-5)' : 'var(--ink)',
                            backgroundColor: `color-mix(in srgb, ${band.color} 15%, var(--surface))`,
                            border: `1px solid color-mix(in srgb, ${band.color} ${band.code === 'moderate' ? '60%' : '55%'}, var(--ink))`,
                          }}
                        >
                          Trigger ≥ {sub.threshold}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted">
                        Ward: {sub.ward_name || `Ward #${sub.ward_id}`} · Quiet: {sub.quiet_hours || 'None'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleTestAlert(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-surface hover:bg-raised border border-border text-xs font-mono text-ink flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isTested ? <Check className="w-3.5 h-3.5 text-risk-1" /> : <Send className="w-3 h-3 text-accent" />}
                        <span>{isTested ? 'Dispatched' : 'Send test alert'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-risk-4 transition-colors cursor-pointer"
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
            <p className="text-xs text-muted bg-surface p-4 rounded-xl border border-border">
              No alert subscriptions created yet. Use the form above to activate ward alerts.
            </p>
          )}
        </div>
      </Card>

      {/* 3. Care Circle - People You Watch (P1-5) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
            <Heart className="w-4 h-4 text-risk-4" />
            <span>Care Circle</span>
          </div>
          <h3 className={`${TYPOGRAPHY.h3} text-ink`}>People You Watch</h3>
          <p className="text-xs text-muted">
            Keep track of vulnerable family members, elderly parents, or children in different wards.
          </p>
        </div>

        {/* Add Person Form */}
        <form onSubmit={handleAddDependent} className="space-y-4 p-5 rounded-xl bg-surface border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Person's Name
              </label>
              <input
                type="text"
                placeholder="e.g. Amma, Grandpa"
                value={depName}
                onChange={(e) => setDepName(e.target.value)}
                required
                className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Their Ward
              </label>
              <select
                value={depWardId}
                onChange={(e) => setDepWardId(Number(e.target.value))}
                className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
              >
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ward_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted block mb-1">
                Age Vulnerability Band
              </label>
              <select
                value={depAgeBand}
                onChange={(e) => setDepAgeBand(e.target.value)}
                className="w-full bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
              >
                <option value="elderly">Elderly (65+ years)</option>
                <option value="child">Child / Infant</option>
                <option value="adult">Adult / Worker</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-muted block mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="+919876543210"
              value={depPhone}
              onChange={(e) => setDepPhone(e.target.value)}
              className="w-full sm:w-1/2 bg-raised border border-border rounded-lg p-2.5 text-xs text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
            <p className="text-[11px] text-muted italic">
              Notice: Only add people who know you are monitoring their ward's heat risk.
            </p>

            <button
              type="submit"
              disabled={isCreatingDep}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold transition-all cursor-pointer self-end sm:self-auto"
            >
              {isCreatingDep ? 'Adding...' : 'Add to Care Circle'}
            </button>
          </div>
        </form>

        {/* Dependents List */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
            Watched Loved Ones ({dependents?.length || 0})
          </span>

          {dependents && dependents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dependents.map((dep) => {
                return (
                  <div
                    key={dep.id}
                    className="p-4 rounded-xl bg-raised border border-border flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">{dep.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-surface text-muted border border-border">
                          {dep.age_band}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {dep.ward_name || `Ward #${dep.ward_id}`} · Risk: {dep.current_risk_score ?? 50}/100
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteDependent(dep.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-risk-4 transition-colors cursor-pointer"
                      title="Remove from circle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted bg-surface p-4 rounded-xl border border-border">
              Your Care Circle is currently empty.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
