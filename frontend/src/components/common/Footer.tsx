import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 pt-8 pb-12 bg-surface border-t border-border">
      {/* 1px hairline with 24px accent tick at left */}
      <div className="section-hairline mb-10" />

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Col 1: Platform Overview & Mandate */}
          <div className="space-y-3">
            <img
              src="/thermagrid-logo.png"
              alt="ThermaGrid"
              className="h-8 w-auto object-contain"
            />
            <p className="text-xs text-muted leading-relaxed max-w-[42ch]">
              Hyperlocal human thermal-stress early-warning & decision-support system
              (National Climate & Environmental Initiative). Calibrated biometeorological indices (WBGT, UTCI, Heat Index) intersecting ward-level built-environment vulnerability.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-muted">
              <ShieldCheck className="w-4 h-4 shrink-0 text-muted" />
              <span>Aligned with NDMA National Heat Action Plan Guidelines</span>
            </div>
          </div>

          {/* Col 2: Authoritative Data Feeds */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
              Authoritative Data Telemetry
            </h5>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                >
                  National Surface Telemetry Network <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://bhuvan.nrsc.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                >
                  ISRO Bhuvan Remote Sensing <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                >
                  ECMWF / GFS Numerical NWP <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Statutory Health Warning */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-[0.10em] text-muted">
              Public Health Advisory
            </h5>
            <p className="text-xs text-muted leading-relaxed">
              Non-clinical advisory platform. Outputs represent relative environmental vulnerability grading, not individualized diagnoses. For medical heat emergencies or suspected heat stroke, immediately call 108.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div>
            © {new Date().getFullYear()} ThermaGrid Platform. Free & Open Source under MIT License.
          </div>
          <div>
            Pipeline: Data → Thermal Stress → Analytics → Forecast → Risk → Action
          </div>
        </div>
      </Container>
    </footer>
  );
};
