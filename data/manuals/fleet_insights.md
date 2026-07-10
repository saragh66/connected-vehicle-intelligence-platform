# Fleet Analytics Insights

*Auto-generated from live telemetry data on 2026-07-12*

## Fleet Overview

The platform currently monitors 81 vehicles with a combined
2,693,335 telemetry measurements processed through the
Isolation Forest anomaly detection model. The global anomaly rate across the entire
fleet is 2.32%, with an average anomaly score of
0.1961.

## Fleet Health Distribution

Out of 81 vehicles analyzed:
- 75 vehicles (92.6%) are classified as Optimal (health score >= 80)
- 5 vehicles (6.2%) are classified as Monitor (health score 50-79)
- 1 vehicles (1.2%) are classified as Critical (health score < 50)

## Common Anomaly Patterns

Analysis of 62,482 detected anomalies reveals the following patterns:

- **Stationary high-RPM events**: 1,252 anomalies (2.0% of all anomalies) show elevated engine RPM (above 1000) combined with zero vehicle speed, consistent with idling, gear engagement, or transmission-related irregularities.

- **Cold start conditions**: 11,136 anomalies (17.8% of all anomalies) occur during cold start phases with coolant temperature below 50°C. These are generally benign and represent the statistically rare but normal engine warm-up period.

- **Overheating risk indicators**: 1,380 anomalies (2.2% of all anomalies) show coolant temperature above 95°C, which should be monitored closely as sustained readings in this range increase mechanical wear risk.

- **High RPM events**: 12,191 anomalies (19.5% of all anomalies) involve engine RPM above 2800, which may indicate aggressive driving or downshift events.

## Anomaly Rate by Traffic Condition

The dataset includes trips labeled by traffic condition (derived from the original
KIT OBD-II dataset trip metadata):

- **Stau** condition trips: 59,628 measurements, 2,288 anomalies detected (3.84% anomaly rate)
- **Normal** condition trips: 41,605 measurements, 137 anomalies detected (0.33% anomaly rate)
- **Frei** condition trips: 49,274 measurements, 1,045 anomalies detected (2.12% anomaly rate)

## Interpretation Notes

Traffic congestion (Stau) conditions typically show different anomaly signatures
than free-flowing (Frei) conditions due to frequent stop-start driving patterns,
which naturally produce more stationary-idle and low-speed readings. When
interpreting a specific vehicle's anomaly rate, it is useful to consider whether
its trips were predominantly recorded under congested, normal, or free-flow
conditions, as this affects the baseline expected anomaly frequency.
