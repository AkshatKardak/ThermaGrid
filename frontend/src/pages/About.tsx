import React from 'react';
import { BookOpen, ExternalLink, Database, Cpu, AlertCircle } from 'lucide-react';
import { useDataSources } from '../hooks/useCoolingCentres';

export const About: React.FC = () => {
  const { data: dataSources } = useDataSources();

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Title */}
      <div className="space-y-2 border-b border-white/10 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9B6FD8]/15 text-[#9B6FD8] text-xs font-mono font-semibold">
          MoES / NCMRWF Initiative
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
          About ThermaGrid & Scientific Methodology
        </h1>
        <p className="text-sm text-[#8B9AA8] leading-relaxed">
          Operational framework, thermal stress index formulations, peer-reviewed citations, and authoritative dataset provenance.
        </p>
      </div>

      {/* The 5-Stage Scientific Pipeline */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#9B6FD8]" />
          The 5-Stage End-to-End Pipeline
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Data Ingestion', desc: 'ECMWF/GFS numerical forecast + IMD AWS station ground-truth + ISRO Bhuvan multispectral imagery.' },
            { step: '02', title: 'Thermal Stress', desc: 'ISO 7243 WBGT, Bröde 2012 UTCI, and Rothfusz 1990 Heat Index computed via exact reference equations.' },
            { step: '03', title: 'Spatial Analytics', desc: 'PostGIS point-in-polygon assignment, local Urban Heat Island (UHI) delta, Getis-Ord Gi* clustering.' },
            { step: '04', title: 'ML Forecasting', desc: 'Quantile Gradient Boosting ensemble predicting 3-5 day trajectory with 80% confidence interval bands.' },
            { step: '05', title: 'Risk & Action', desc: 'Hazard × Exposure × Vulnerability scoring + NDMA Heat Action Plan SOP triggers for municipal dispatch.' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-[#1F3445]/70 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-bold text-[#9B6FD8]">{item.step}</span>
              <h4 className="text-sm font-bold text-white font-display">{item.title}</h4>
              <p className="text-[11px] text-[#8B9AA8] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rigorous Thermal Formulations & Citations */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#FF704F]" />
          Thermal Index Formulations & Citations
        </h3>

        <div className="space-y-4">
          
          {/* WBGT */}
          <div className="p-5 rounded-xl bg-[#1F3445]/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-display">
                Wet Bulb Globe Temperature (WBGT) — ISO 7243:2017
              </h4>
              <span className="text-[11px] font-mono text-[#2FA37C] bg-[#2FA37C]/15 px-2 py-0.5 rounded border border-[#2FA37C]/30">
                Occupational Standard
              </span>
            </div>
            <p className="text-xs font-mono text-[#9B6FD8] bg-[#101820] p-2.5 rounded-lg border border-white/5">
              Outdoor with Solar Load: WBGT = 0.7·T_nw + 0.2·T_g + 0.1·T_a
            </p>
            <p className="text-xs text-[#8B9AA8] leading-relaxed">
              Natural wet-bulb temperature (T_nw) is computed using the Stull (2011) psychrometric empirical formula validated across -20°C to 50°C.
              Black globe temperature (T_g) follows the Liljegren et al. (2008) radiative heat balance model incorporating solar irradiance and convective wind cooling.
            </p>
            <div className="text-[11px] text-[#8B9AA8] pt-1">
              <strong>Citations: </strong> ISO 7243:2017 Ergonomics of thermal environment • Stull, R. (2011) JAMC 50(11) • Liljegren et al. (2008) JOEH 5(10).
            </div>
          </div>

          {/* UTCI */}
          <div className="p-5 rounded-xl bg-[#1F3445]/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-display">
                Universal Thermal Climate Index (UTCI) — Bröde et al. (2012)
              </h4>
              <span className="text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                Multi-Node Physiological Model
              </span>
            </div>
            <p className="text-xs font-mono text-[#9B6FD8] bg-[#101820] p-2.5 rounded-lg border border-white/5">
              UTCI = T_a + Offset(T_a, T_mrt, v_10m, P_a) [COST Action 730 6th-order Polynomial]
            </p>
            <p className="text-xs text-[#8B9AA8] leading-relaxed">
              Derived from the Fiala multi-node dynamic human thermoregulation model representing a walking person (135 W/m² metabolic rate).
              Integrates mean radiant temperature (T_mrt) estimated from solar irradiance and wind velocity at 10m height.
            </p>
            <div className="text-[11px] text-[#8B9AA8] pt-1">
              <strong>Citations: </strong> Bröde et al. (2012) Int J Biometeorol 56(3) • Fiala et al. (2012) Int J Biometeorol 56(3).
            </div>
          </div>

          {/* Heat Index */}
          <div className="p-5 rounded-xl bg-[#1F3445]/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-display">
                National Weather Service (NWS) Heat Index — Rothfusz (1990)
              </h4>
              <span className="text-[11px] font-mono text-[#E8C547] bg-[#E8C547]/15 px-2 py-0.5 rounded border border-[#E8C547]/30">
                NOAA / Steadman Empirical
              </span>
            </div>
            <p className="text-xs font-mono text-[#9B6FD8] bg-[#101820] p-2.5 rounded-lg border border-white/5">
              HI = -42.379 + 2.049·T + 10.143·RH - 0.224·T·RH - 0.0068·T² - 0.054·RH² + ...
            </p>
            <p className="text-xs text-[#8B9AA8] leading-relaxed">
              9-term multivariate regression polynomial modeling apparent temperature under combined heat and humidity, with Steadman low-heat fallback and adjustments for extreme RH.
            </p>
            <div className="text-[11px] text-[#8B9AA8] pt-1">
              <strong>Citations: </strong> Rothfusz, L.P. (1990) NWS SR/SSD 90-23 • Steadman, R.G. (1979) JAM 18(7).
            </div>
          </div>

        </div>
      </section>

      {/* Authoritative Data Sources Provenance Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2FA37C]" />
            Data Sources & Provenance Registry
          </h3>
          <span className="text-xs font-mono text-[#8B9AA8]">
            Rule §7 Data Provenance
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#101820] border-b border-white/10 text-[#8B9AA8] font-mono uppercase text-[10px]">
                <th className="p-3">Dataset Name</th>
                <th className="p-3">Authoritative Provider</th>
                <th className="p-3">Spatial Resolution</th>
                <th className="p-3">Temporal Resolution</th>
                <th className="p-3">License</th>
                <th className="p-3">Variables</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#1F3445]/40 text-[#D7E0E7]">
              {dataSources?.map((src) => (
                <tr key={src.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    <a href={src.url} target="_blank" rel="noreferrer" className="hover:text-[#9B6FD8] flex items-center gap-1">
                      {src.name} <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </td>
                  <td className="p-3 text-[#8B9AA8]">{src.provider}</td>
                  <td className="p-3 font-mono">{src.spatial_resolution}</td>
                  <td className="p-3 font-mono">{src.temporal_resolution}</td>
                  <td className="p-3 text-[11px]">{src.license}</td>
                  <td className="p-3 text-[11px] text-[#8B9AA8] max-w-xs">{src.variables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Non-Medical Disclaimer */}
      <div className="p-4 rounded-xl bg-[#101820] border border-[#FF704F]/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#FF704F] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#D7E0E7] space-y-1">
          <span className="font-bold text-[#FF704F] block uppercase tracking-wide">
            Public Health & Clinical Disclaimer
          </span>
          <p className="text-[#8B9AA8] leading-relaxed">
            ThermaGrid is an environmental risk analytics and municipal early-warning decision-support tool.
            Its vulnerability scores represent relative environmental and demographic susceptibility grades, not individual clinical assessments or projected fatalities.
            Individuals experiencing heat cramps, fainting, confusion, or absence of sweating must seek immediate medical attention (call 108).
          </p>
        </div>
      </div>
    </div>
  );
};
