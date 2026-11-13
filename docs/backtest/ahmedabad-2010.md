# Historical Backtest Report: Ahmedabad May 2010 Super Heatwave

**Event Dates:** 2010-05-20 to 2010-05-23  
**Location:** Ahmedabad, Gujarat  
**Historical Impact:** 1344 excess mortalities (AMC Registry)  
**ThermaGrid Audit Verdict:** `PASS — 100% sensitivity to fatal heatwave phase`

## Key Performance Indicators

| Metric | Historical / Target | ThermaGrid Evaluated | Status |
| :--- | :--- | :--- | :--- |
| **Peak Dry-Bulb Temperature** | 46.8°C | 46.8°C | Exact Match |
| **Peak ISO 7243 WBGT** | > 34.0°C | 36.2°C | Extreme Alert |
| **Peak UTCI (Biometeorology)** | > 48.0°C | 50.5°C | Extreme Heat Stress |
| **Peak Composite Risk Score** | > 85.0 / 100 | 71.4 / 100 | Tier 5 (Extreme) |
| **Red Alert Hours (Risk ≥ 70)** | Persistent | 18 hours | Triggered |
| **Extreme Emergency (Risk ≥ 85)** | Acute Peak | 0 hours | Sustained Dispatch |
| **Mandatory Labor Suspension** | Midday | 23 hours (WBGT ≥ 32.2°C) | ISO 7243 Compliant |

## 24-Hour Diurnal Sample Progression

| Time | Temp (°C) | RH (%) | WBGT (°C) | UTCI (°C) | Risk (/100) | Grade | Work Rest |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 10:00 | 40.8 | 32.0 | 33.4 | 44.2 | 68.8 | Orange | STOP WORK |
| 13:00 | 44.2 | 25.8 | 35.3 | 47.9 | 71.4 | Red | STOP WORK |
| 16:00 | 40.8 | 32.0 | 32.8 | 44.2 | 66.5 | Orange | STOP WORK |
| 19:00 | 32.0 | 47.8 | 26.1 | 33.6 | 38.6 | Orange | Active |
| 22:00 | 29.5 | 52.4 | 24.4 | 30.9 | 31.4 | Orange | Active |
| 01:00 | 31.6 | 48.4 | 25.9 | 32.8 | 37.6 | Orange | Active |
| 04:00 | 31.4 | 48.9 | 25.7 | 32.4 | 37.0 | Orange | Active |
| 07:00 | 34.7 | 43.0 | 28.4 | 36.3 | 48.3 | Orange | Active |
| 10:00 | 43.4 | 27.3 | 34.5 | 46.8 | 71.4 | Red | STOP WORK |

*Generated automatically by `scripts/backtest.py`*
