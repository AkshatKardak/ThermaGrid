import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Users } from 'lucide-react';
import { useCoolingCentres } from '../../hooks/useCoolingCentres';
import { Card } from '../ui/Card';
import { TYPOGRAPHY } from '../../theme/typography';

interface CoolingCentresListProps {
  city?: string;
}

export const CoolingCentresList: React.FC<CoolingCentresListProps> = ({ city = 'Mumbai' }) => {
  const [openOnly, setOpenOnly] = useState(false);
  const { data: centres, isLoading } = useCoolingCentres(city);

  const filteredCentres = React.useMemo(() => {
    if (!centres) return [];
    if (!openOnly) return centres;
    return centres.filter((c) => (c as any).current_status !== 'closed');
  }, [centres, openOnly]);

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted block mb-1">
            Municipal Climate Adaptation
          </span>
          <h3 className={`${TYPOGRAPHY.h3} text-ink`}>Designated Cooling Centres</h3>
          <p className="text-xs text-muted mt-0.5">
            Public air-conditioned shelters, emergency hydration tents, and transit cooling points.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpenOnly(!openOnly)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all self-start sm:self-auto cursor-pointer ${
            openOnly
              ? 'bg-accent text-on-accent border-accent font-semibold'
              : 'bg-surface border-border text-muted hover:text-ink'
          }`}
        >
          {openOnly ? 'Showing Open Only' : 'Filter: Open Now'}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-border/40 rounded-xl animate-pulse" />
          <div className="h-16 bg-border/40 rounded-xl animate-pulse" />
        </div>
      ) : filteredCentres.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted bg-surface rounded-xl border border-border">
          No cooling centres found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCentres.map((centre) => {
            const rawStatus = (centre as any).current_status || 'open';
            const statusLabel =
              rawStatus === 'open'
                ? 'Open Now'
                : rawStatus === 'closed'
                ? 'Closed'
                : 'Hours Unknown';

            const statusBadgeColor =
              rawStatus === 'open'
                ? 'text-ink bg-[color-mix(in_srgb,var(--risk-1)_15%,var(--surface))] border-[color-mix(in_srgb,var(--risk-1)_55%,var(--ink))]'
                : rawStatus === 'closed'
                ? 'text-ink bg-[color-mix(in_srgb,var(--risk-4)_15%,var(--surface))] border-[color-mix(in_srgb,var(--risk-4)_55%,var(--ink))]'
                : 'text-muted bg-surface border-border';

            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;
            const phone = (centre as any).phone || centre.contact_phone;

            return (
              <div
                key={centre.id}
                className="p-4 rounded-xl bg-raised border border-border space-y-3 hover:border-accent/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink leading-snug">{centre.name}</h4>
                      <p className="text-xs text-muted mt-0.5">{centre.address}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border shrink-0 ${statusBadgeColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Users className="w-3.5 h-3.5 text-muted" />
                      <span>Capacity: {centre.capacity_persons}</span>
                    </div>

                    {centre.distance_km !== undefined && centre.distance_km !== null && (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-ink">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{centre.distance_km} km away</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-raised border border-border text-xs font-mono text-ink transition-colors"
                    >
                      <Phone className="w-3 h-3 text-muted" />
                      <span>{phone}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-muted">Free Public Access</span>
                  )}

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-xs font-mono font-semibold transition-all group"
                  >
                    <Navigation className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
