"""
test_anomaly_and_classification.py

Tests AI Isolation Forest training, model loading, normal vs anomalous detection,
and deterministic event classification rules.
"""

import os
import pytest
from app.core.anomaly_detector import AnomalyDetector
from app.core.event_classifier import EventClassifier


def test_anomaly_detector_loads_model():
    """Verify Isolation Forest model loads from disk correctly."""
    detector = AnomalyDetector()
    assert detector.is_model_loaded() is True


def test_normal_sensor_reading():
    """Verify that typical ambient baseline readings evaluate as NORMAL."""
    detector = AnomalyDetector()
    normal_reading = {
        "temperature": 24.0,
        "humidity": 60.0,
        "smoke": 0.02,
        "co2": 415.0,
        "aqi": 38.0,
        "soil_moisture": 50.0
    }
    result = detector.detect(normal_reading)
    assert result["is_anomaly"] is False
    assert result["decision"] == "NORMAL"
    assert result["anomaly_score"] < 0.50


def test_anomalous_sensor_reading():
    """Verify that severe combustion/fire readings evaluate as ANOMALY."""
    detector = AnomalyDetector()
    fire_reading = {
        "temperature": 56.0,
        "humidity": 18.0,
        "smoke": 0.65,
        "co2": 890.0,
        "aqi": 260.0,
        "soil_moisture": 20.0
    }
    result = detector.detect(fire_reading)
    assert result["is_anomaly"] is True
    assert result["decision"] == "ANOMALY"
    assert result["anomaly_score"] > 0.50


def test_event_classifier_fire():
    """Verify that fire conditions are correctly classified as FIRE."""
    classifier = EventClassifier()
    reading = {
        "temperature": 52.0,
        "humidity": 20.0,
        "smoke": 0.55,
        "co2": 820.0,
        "aqi": 220.0,
        "soil_moisture": 22.0
    }
    classification = classifier.classify(reading, is_anomaly=True)
    assert classification["event_type"] == "FIRE"
    assert classification["severity"] == "CRITICAL"
    assert len(classification["reasons"]) >= 2


def test_event_classifier_pollution():
    """Verify that hazardous AQI & CO2 without extreme heat is classified as POLLUTION."""
    classifier = EventClassifier()
    reading = {
        "temperature": 26.0,
        "humidity": 55.0,
        "smoke": 0.22,
        "co2": 950.0,
        "aqi": 240.0,
        "soil_moisture": 45.0
    }
    classification = classifier.classify(reading, is_anomaly=True)
    assert classification["event_type"] == "POLLUTION"
    assert classification["severity"] == "HIGH"


def test_event_classifier_extreme_heat():
    """Verify high temp with clean air is classified as EXTREME_HEAT."""
    classifier = EventClassifier()
    reading = {
        "temperature": 44.0,
        "humidity": 38.0,
        "smoke": 0.02,
        "co2": 420.0,
        "aqi": 45.0,
        "soil_moisture": 40.0
    }
    classification = classifier.classify(reading, is_anomaly=True)
    assert classification["event_type"] == "EXTREME_HEAT"


def test_event_classifier_normal():
    """Verify nominal readings evaluate to NORMAL."""
    classifier = EventClassifier()
    reading = {
        "temperature": 24.5,
        "humidity": 58.0,
        "smoke": 0.02,
        "co2": 415.0,
        "aqi": 42.0,
        "soil_moisture": 48.0
    }
    classification = classifier.classify(reading, is_anomaly=False)
    assert classification["event_type"] == "NORMAL"
    assert classification["severity"] == "NORMAL"
