import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 pt-10 pb-12 bg-surface border-t border-border">
      {/* 1px hairline accent bar */}
      <div className="section-hairline mb-8" />

      <Container>
        {/* 4-Column Enterprise Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand & Mandate */}
          <div className="space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/thermagrid-logo.png"
                alt="ThermaGrid"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-muted leading-relaxed">
              Hyperlocal human thermal-stress early-warning and municipal decision-support system. Calibrated biometeorological physics intersecting ward-level built-environment vulnerability.
            </p>
            <div className="pt-1 text-[11px] font-mono text-muted flex items-center gap-1.5">
              <span>National Climate &amp; Environmental Intelligence</span>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-[0.10em] text-ink font-semibold">
              Product
            </h5>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/app" className="text-muted hover:text-ink transition-colors">
                  Overview Hub
                </Link>
              </li>
              <li>
                <Link to="/app/heat-risk" className="text-muted hover:text-ink transition-colors">
                  Citizen Heat Risk
                </Link>
              </li>
              <li>
                <Link to="/app/authority" className="text-muted hover:text-ink transition-colors">
                  Municipal Authority
                </Link>
              </li>
              <li>
                <Link to="/app/analytics" className="text-muted hover:text-ink transition-colors">
                  Thermal Analytics
                </Link>
              </li>
              <li>
                <Link to="/app/worker" className="text-muted hover:text-ink transition-colors">
                  Worker Shift Advisor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Authoritative Data */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-[0.10em] text-ink font-semibold">
              Data &amp; Science
            </h5>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  IMD Surface Telemetry <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://bhuvan.nrsc.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  ISRO Bhuvan Land Cover <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  ECMWF / Open-Meteo <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://journals.ametsoc.org/view/journals/apme/47/9/2008jamc1886.1.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  Liljegren ISO 7243 WBGT <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Legal */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-[0.10em] text-ink font-semibold">
              Resources &amp; Legal
            </h5>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://github.com/AkshatKardak/ThermaGrid"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  Source Repository <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AkshatKardak/ThermaGrid/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  MIT Open Source Licence <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <a
                  href="https://ndma.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-ink flex items-center gap-1.5 transition-colors"
                >
                  NDMA Heatwave Guidelines <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </li>
              <li>
                <span className="text-muted block text-[11px] leading-relaxed pt-1">
                  Non-clinical advisory platform. For medical emergencies call 108.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span>© 2026 ThermaGrid · Built by</span>
            <a
              href="https://github.com/AkshatKardak"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink hover:underline"
            >
              Akshat Kardak
            </a>
            <span>· MIT Licence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-ink font-medium">All systems operational</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
