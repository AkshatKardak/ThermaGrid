# Physics Reference Validation

ThermaGrid's biometeorological engines are verified against published reference standards and peer-reviewed worked examples in a table-driven test suite (`tests/analytics/test_physics_reference.py`):

| Biometeorological Metric | Reference Standard / Literature | Benchmark Scope | Max Observed Deviation | Tolerance Gate |
|---|---|---|---|---|
| **ISO 7243 WBGT** | ISO 7243:2017, Stull (2011), Bernard & Pourmoghani (1999) | 6 cases (psychrometric baselines, CAV coverall +2°C, CAV vapor barrier +11°C) | **0.3300°C** | $\pm 0.50^\circ\text{C}$ |
| **UTCI** | COST Action 730, Bröde et al. (2012), Błażejczyk et al. (2013) | 6 cases (reference baseline 20°C, moderate, strong, very strong, extreme >46°C) | **1.47°C** | $\pm 1.50^\circ\text{C}$ |
| **NOAA Heat Index** | Rothfusz (1990) NOAA NWS Technical Attachment SR 90-23 | 5 cases (worked example 90°F/70% RH, Caution, Danger, Extreme Danger) | **0.5100°C** | $\pm 0.60^\circ\text{C}$ |

> [!NOTE]
> Maximum observed WBGT deviation across all published ISO 7243 reference cases is **0.3300°C**, reflecting empirical Stull wet-bulb approximation against thermodynamic psychrometric tables.

### Synthetic Diurnal Sanity Backtest (Ahmedabad May 2010 Scenario)

The May 2010 Ahmedabad heatwave scenario is audited via an automated reproducibility pipeline (`scripts/backtest.py --check --max-mae 0.5`) evaluated against a synthetic diurnal benchmark fixture (`tests/fixtures/ahmedabad_2010_observed.json`).

> [!NOTE]
> **Synthetic Sanity Check Disclaimer:**
> The observation series (`tests/fixtures/ahmedabad_2010_observed.json`) is a synthetic diurnal sinusoid with bounded noise ($\pm 0.30^\circ\text{C}$), designed to verify internal consistency and ensure the model correctly reproduces diurnal cycles and thermal stress transitions. It is a synthetic sanity check, not a comparison against IMD weather station observations.

- **Air Temperature MAE:** **0.156°C** ($r = 0.9996$, RMSE 0.180°C)
- **ISO 7243 WBGT MAE:** **0.153°C** ($r = 0.9992$)
- **Peak Dry-Bulb Temperature:** 46.8°C modeled (synthetic fixture peaks at 47.0°C)
- **Peak Modeled WBGT:** 36.2°C (Exceeds ISO 7243 Extreme Alert Threshold)
- **Detailed Report:** See [Ahmedabad 2010 Backtest Report](backtest/ahmedabad-2010.md) and [Metrics Artifact](backtest/ahmedabad-2010.json).
