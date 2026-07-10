# Frequently Asked Diagnostic Questions

## Q: What does it mean when a vehicle has a low health score?
A: A low health score (below 50) indicates the AI anomaly detection model has
flagged a high frequency or severity of unusual sensor readings during the
vehicle's operating history. This does not necessarily mean the vehicle has
a confirmed mechanical fault, but it warrants inspection, particularly if
anomalies cluster around specific parameters like coolant temperature or RPM.

## Q: Why would a vehicle show high RPM with zero speed?
A: This combination typically occurs during idling, gear shifts, or clutch
engagement in manual transmissions. If sustained and frequent, it can also
indicate transmission slippage, a stuck clutch, or the driver revving the
engine while stationary. The anomaly detection model flags this pattern
because it deviates from the statistically normal RPM-speed relationship
observed across the fleet.

## Q: What is considered a critical anomaly rate?
A: An anomaly rate above 10% of total recorded measurements for a vehicle
is generally considered elevated and worth investigating. Rates between
2-5% are typical baseline noise (sensor startup readings, brief idle
periods) given the contamination parameter used in the Isolation Forest
model. Rates above 15% may indicate systematic sensor issues or genuinely
abnormal driving/mechanical conditions.

## Q: How is the health score calculated?
A: The health score starts at 100 and is reduced based on two factors:
the proportion of measurements flagged as anomalous (anomaly rate), and
the severity of the worst anomaly detected (how far the anomaly score
deviates from the normal decision boundary). A vehicle with frequent,
severe anomalies will score lower than one with rare, mild anomalies.

## Q: What should a fleet manager do when a vehicle is flagged as Critical?
A: A Critical status (health score below 50) should prompt a review of
the vehicle's anomaly history, focusing on which specific sensors show
the most deviation. If coolant temperature anomalies dominate, inspect
the cooling system. If RPM/throttle anomalies dominate, inspect the
transmission and throttle body. A physical inspection is recommended
before the vehicle's next extended trip.

## Q: Can cold starts trigger false anomaly alerts?
A: Yes. Cold start conditions (low coolant temperature, low RPM, zero
speed, minimal throttle) are statistically rare compared to steady-state
driving in most trip datasets, so unsupervised models like Isolation
Forest may flag them as anomalies even though they represent normal
vehicle behavior. This is a known limitation of purely statistical
anomaly detection and is one reason severity (anomaly score magnitude)
matters as much as the binary anomaly flag.

## Q: What is the difference between anomaly detection and predictive maintenance?
A: Anomaly detection identifies statistically unusual sensor readings in
real time or in historical data, without necessarily predicting future
failures. Predictive maintenance goes further, using historical patterns
and trends over time to estimate when a component is likely to fail,
typically requiring labeled failure data or time-series forecasting
models such as LSTMs, which this platform's architecture is designed to
support as a future enhancement.