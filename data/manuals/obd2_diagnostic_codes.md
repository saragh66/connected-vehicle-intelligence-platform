# OBD-II Diagnostic Fundamentals

## What is OBD-II?
On-Board Diagnostics II (OBD-II) is a standardized system (SAE J1979) present
in vehicles manufactured after 1996 (US) and 2001 (EU, gasoline) that monitors
engine and emissions-related components in real time through the vehicle's
Engine Control Unit (ECU).

## Key Parameters Monitored
- Engine RPM (Parameter ID 0x0C)
- Vehicle Speed (Parameter ID 0x0D)
- Engine Coolant Temperature (Parameter ID 0x05)
- Intake Manifold Absolute Pressure (Parameter ID 0x0B)
- Throttle Position (Parameter ID 0x11)
- Mass Air Flow Rate (Parameter ID 0x10)

## Anomaly Detection in Telemetry Data
Modern fleet management systems apply statistical and machine learning
techniques to OBD-II data streams to detect anomalies without predefined
thresholds. Isolation Forest and similar unsupervised algorithms identify
data points that deviate significantly from learned normal operating
patterns, flagging combinations of sensor readings that are statistically
rare — such as high RPM with zero speed, or temperature readings outside
the learned distribution — even when no single sensor value exceeds a
fixed threshold.

## Health Score Interpretation
A vehicle health score aggregates the frequency and severity of detected
anomalies over the vehicle's operating history. Scores above 80 indicate
optimal operating condition. Scores between 50 and 80 suggest the vehicle
should be monitored, potentially indicating early-stage sensor drift or
occasional unusual operating conditions. Scores below 50 indicate frequent
or severe anomalies warranting maintenance inspection.