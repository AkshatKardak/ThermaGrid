# ThermaGrid — Machine Learning Thermal Forecasting Model

---

## 1. Objective

Forecast 72–120 hour forward trajectory of Wet Bulb Globe Temperature (WBGT) and human thermal risk score at municipal ward level, outputting:
1. Median predicted trajectory ($\hat{y}_{50}$)
2. Lower 10th percentile bound ($\hat{y}_{10}$)
3. Upper 90th percentile bound ($\hat{y}_{90}$)
defining an **80% empirical confidence interval band**.

---

## 2. Model Architecture & Baselines

As required by Rule §4.1:
- **Persistence Baseline:** $\hat{y}_t = y_{t-1}$
- **Multivariate Linear Baseline:** Ridge Regression ($\alpha = 1.0$)
- **Final Model:** Quantile Gradient Boosting Regressor Ensemble (`GradientBoostingRegressor`)

---

## 3. Empirical Verification Results

Evaluated on 400 out-of-sample test instances under Indian pre-monsoon heat conditions:

| Model Architecture | MAE (°C) | RMSE (°C) | $R^2$ Score | Skill / Improvement over Persistence |
| :--- | :--- | :--- | :--- | :--- |
| **Persistence Baseline** | 0.733 | 0.924 | 0.955 | Baseline (0.0%) |
| **Ridge Linear Model** | 0.079 | 0.103 | 0.999 | 89.2% MAE Reduction |
| **Gradient Boosting (Ensemble)** | 0.181 | 0.269 | 0.996 | **75.3% MAE Reduction** |

Artifact persisted at: `analytics/models/forecast_model.pkl`  
Metrics JSON logged at: `analytics/models/metrics.json`

---

## 4. Feature Importance

Feature ranking from tree-based Gini split reductions:
1. `wbgt_lag1`: 46.2%
2. `temp_c`: 22.8%
3. `solar_radiation_wm2`: 14.1%
4. `rel_humidity_pct`: 8.4%
5. `uhi_excess_c`: 4.5%
6. `hour_sin` / `hour_cos`: 2.6%
7. `wind_speed_ms`: 1.4%
