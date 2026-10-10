"""
event_classifier.py

Deterministic and Explainable Environmental Event Classifier.
Translates detected anomalies and physical sensor signatures into classified events:
- FIRE
- POLLUTION
- EXTREME_HEAT
- OTHER_ANOMALY
- NORMAL

Designed for student-level transparency and easy viva explanation.
"""

from typing import Dict, Any, List


class EventClassifier:
    """
    Classifies environmental events using consistent rule-based thresholds on sensor evidence.
    """

    # Documented Thresholds (for viva explanation)
    FIRE_TEMP_MIN = 40.0         # °C
    FIRE_SMOKE_MIN = 0.25        # normalized (0-1)
    FIRE_HUMIDITY_MAX = 35.0     # %

    POLLUTION_AQI_MIN = 130.0    # AQI
    POLLUTION_CO2_MIN = 680.0    # ppm
    POLLUTION_SMOKE_MIN = 0.12   # normalized (0-1)

    EXTREME_HEAT_TEMP_MIN = 39.0 # °C
    EXTREME_HEAT_SMOKE_MAX = 0.20# normalized (clean air heatwave)

    def classify(self, reading: Dict[str, Any], is_anomaly: bool = False) -> Dict[str, Any]:
        """
        Classifies the environmental condition based on sensor readings and anomaly flag.

        Returns:
            {
                "event_type": "FIRE" | "POLLUTION" | "EXTREME_HEAT" | "OTHER_ANOMALY" | "NORMAL",
                "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NORMAL",
                "confidence": float,  # 0.0 to 1.0
                "reasons": list[str],
                "evidence": dict
            }
        """
        temp = float(reading.get("temperature", 25.0))
        hum = float(reading.get("humidity", 55.0))
        smoke = float(reading.get("smoke", 0.02))
        co2 = float(reading.get("co2", 415.0))
        aqi = float(reading.get("aqi", 45.0))
        soil = float(reading.get("soil_moisture", 45.0))

        reasons: List[str] = []
        evidence = {
            "temperature": temp,
            "humidity": hum,
            "smoke": smoke,
            "co2": co2,
            "aqi": aqi,
            "soil_moisture": soil
        }

        # 1. Evaluate FIRE conditions
        # Physical pattern: High heat + Combustion particulate (smoke) + Dry air (low humidity)
        is_fire = False
        fire_indicators = 0
        if temp >= self.FIRE_TEMP_MIN:
            fire_indicators += 1
            reasons.append(f"Temperature elevated ({temp:.1f}°C >= {self.FIRE_TEMP_MIN}°C)")
        if smoke >= self.FIRE_SMOKE_MIN:
            fire_indicators += 1
            reasons.append(f"Smoke particulate detected ({smoke:.3f} >= {self.FIRE_SMOKE_MIN})")
        if hum <= self.FIRE_HUMIDITY_MAX:
            fire_indicators += 1
            reasons.append(f"Relative humidity critically low ({hum:.1f}% <= {self.FIRE_HUMIDITY_MAX}%)")

        if fire_indicators >= 2 and smoke >= 0.20:
            is_fire = True
            confidence = min(0.98, 0.65 + (0.15 * fire_indicators))
            return {
                "event_type": "FIRE",
                "severity": "CRITICAL",
                "confidence": round(confidence, 2),
                "reasons": reasons,
                "evidence": evidence
            }

        # 2. Evaluate POLLUTION conditions
        # Physical pattern: Elevated CO2 + High AQI + Elevated particulate, without extreme combustion heat
        pollution_reasons = []
        pollution_indicators = 0
        if aqi >= self.POLLUTION_AQI_MIN:
            pollution_indicators += 1
            pollution_reasons.append(f"Air Quality Index hazardous ({aqi:.1f} >= {self.POLLUTION_AQI_MIN})")
        if co2 >= self.POLLUTION_CO2_MIN:
            pollution_indicators += 1
            pollution_reasons.append(f"CO2 concentration elevated ({co2:.1f} ppm >= {self.POLLUTION_CO2_MIN} ppm)")
        if smoke >= self.POLLUTION_SMOKE_MIN:
            pollution_indicators += 1
            pollution_reasons.append(f"Particulate/haze index elevated ({smoke:.3f} >= {self.POLLUTION_SMOKE_MIN})")

        if pollution_indicators >= 2 and temp < 42.0:
            confidence = min(0.95, 0.60 + (0.15 * pollution_indicators))
            return {
                "event_type": "POLLUTION",
                "severity": "HIGH",
                "confidence": round(confidence, 2),
                "reasons": pollution_reasons,
                "evidence": evidence
            }

        # 3. Evaluate EXTREME_HEAT conditions
        # Physical pattern: Very high ambient temp without fire particulates
        if temp >= self.EXTREME_HEAT_TEMP_MIN and smoke < self.EXTREME_HEAT_SMOKE_MAX:
            reasons.append(f"Severe ambient thermal peak ({temp:.1f}°C >= {self.EXTREME_HEAT_TEMP_MIN}°C)")
            reasons.append(f"Clean atmospheric profile (smoke {smoke:.3f} < {self.EXTREME_HEAT_SMOKE_MAX})")
            return {
                "event_type": "EXTREME_HEAT",
                "severity": "HIGH",
                "confidence": 0.88,
                "reasons": reasons,
                "evidence": evidence
            }

        # 4. Evaluate OTHER_ANOMALY
        # The AI Isolation Forest model flagged an anomaly, but it doesn't match fire, pollution, or heatwave
        if is_anomaly:
            other_reasons = []
            if soil < 18.0:
                other_reasons.append(f"Soil moisture critically depleted ({soil:.1f}% < 18.0%)")
            elif soil > 75.0:
                other_reasons.append(f"Soil water saturation anomaly ({soil:.1f}% > 75.0%)")
            if hum < 22.0 or hum > 88.0:
                other_reasons.append(f"Humidity outside nominal baseline ({hum:.1f}%)")
            if not other_reasons:
                other_reasons.append("Multivariate feature divergence detected by Isolation Forest")

            return {
                "event_type": "OTHER_ANOMALY",
                "severity": "MEDIUM",
                "confidence": 0.75,
                "reasons": other_reasons,
                "evidence": evidence
            }

        # 5. NORMAL Baseline
        return {
            "event_type": "NORMAL",
            "severity": "NORMAL",
            "confidence": 0.99,
            "reasons": ["All environmental parameters within nominal baseline ranges"],
            "evidence": evidence
        }
