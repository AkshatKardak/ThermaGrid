import React, { useState } from 'react';
import { MapPin, Navigation, Phone, CheckCircle2, XCircle, HelpCircle, Users, ExternalLink } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#2FA37C] block mb-1">
            Municipal Climate Adaptation
          </span>
          <h3 className={`${TYPOGRAPHY.h3} text-white`}>Designated Cooling Centres</h3>
          <p className="text-xs text-[#8B9AA8] mt-0.5">
            Public air-conditioned shelters, emergency hydration tents, and transit cooling points.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpenOnly(!openOnly)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all self-start sm:self-auto cursor-pointer ${
            openOnly
              ? 'bg-[#2FA37C]/20 border-[#2FA37C] text-white font-semibold'
              : 'bg-[#101820] border-white/10 text-[#8B9AA8] hover:text-[#D7E0E7]'
          }`}
        >
          {openOnly ? 'Showing Open Only' : 'Filter: Open Now'}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
        </div>
      ) : filteredCentres.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#8B9AA8] bg-[#101820] rounded-xl border border-white/10">
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
                ? 'text-[#2FA37C] bg-[#2FA37C]/15 border-[#2FA37C]/30'
                : rawStatus === 'closed'
                ? 'text-[#FF704F] bg-[#FF704F]/15 border-[#FF704F]/30'
                : 'text-[#8B9AA8] bg-white/5 border-white/10';

            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;
            const phone = (centre as any).phone || centre.contact_phone;

            return (
              <div
                key={centre.id}
                className="p-4 rounded-xl bg-[#101820] border border-white/10 space-y-3 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{centre.name}</h4>
                      <p className="text-xs text-[#8B9AA8] mt-0.5">{centre.address}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border shrink-0 ${statusBadgeColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B9AA8] pt-1">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Users className="w-3.5 h-3.5 text-[#9B6FD8]" />
                      <span>Capacity: {centre.capacity_persons}</span>
                    </div>

                    {centre.distance_km !== undefined && centre.distance_km !== null && (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-[#2FA37C]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{centre.distance_km} km away</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#D7E0E7] transition-colors"
                    >
                      <Phone className="w-3 h-3 text-[#9B6FD8]" />
                      <span>{phone}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-[#5F7183]">Free Public Access</span>
                  )}

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B6FD8] hover:bg-[#7F56BD] text-white text-xs font-mono font-semibold transition-all group"
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
