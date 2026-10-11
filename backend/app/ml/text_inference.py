import os
import joblib
import numpy as np
import logging
from app.config import settings

logger = logging.getLogger("uvicorn.error")

DISEASE_LABELS = {
    0: "Fungal infection", 1: "Allergy", 2: "GERD", 3: "Chronic cholestasis",
    4: "Drug Reaction", 5: "Peptic ulcer disease", 6: "AIDS", 7: "Diabetes",
    8: "Gastroenteritis", 9: "Bronchial Asthma", 10: "Hypertension", 11: "Migraine",
    12: "Cervical spondylosis", 13: "Paralysis (brain hemorrhage)", 14: "Jaundice",
    15: "Malaria", 16: "Chicken pox", 17: "Dengue", 18: "Typhoid",
    19: "Hepatitis A", 20: "Hepatitis B", 21: "Hepatitis C", 22: "Hepatitis D",
    23: "Hepatitis E", 24: "Alcoholic hepatitis", 25: "Tuberculosis",
    26: "Common Cold", 27: "Pneumonia", 28: "Dimorphic hemmorhoids(piles)",
    29: "Heart attack", 30: "Varicose veins", 31: "Hypothyroidism",
    32: "Hyperthyroidism", 33: "Hypoglycemia", 34: "Osteoarthritis",
    35: "Arthritis", 36: "(vertigo) Paroxysmal Positional Vertigo", 37: "Acne",
    38: "Urinary tract infection", 39: "Psoriasis", 40: "Impetigo",
    41: "Acute Bronchitis", 42: "Pneumothorax", 43: "Pleural Effusion",
    44: "Pulmonary Embolism", 45: "Asthma Exacerbation", 46: "COVID-19 Infection",
    47: "Chronic Obstructive Pulmonary Disease (COPD)", 48: "Pulmonary Nodule/Cancer",
    49: "Respiratory Syncytial Virus (RSV)"
}

CLINICAL_SYMPTOM_MAP = {
    27: ["pneumonia", "productive cough", "chest pain on breath", "high fever", "rusty sputum", "consolidation", "crackles", "crepitations"],
    25: ["tuberculosis", "coughing blood", "hemoptysis", "night sweats", "weight loss", "persistent cough"],
    9:  ["bronchial asthma", "wheezing", "chest tightness", "shortness of breath", "expiratory wheeze"],
    41: ["acute bronchitis", "dry cough", "hacking cough", "bronchial inflammation", "mild fever"],
    47: ["copd", "chronic bronchitis", "emphysema", "smoker cough", "exertional dyspnea"],
    26: ["common cold", "runny nose", "sneezing", "sore throat", "nasal congestion"],
    46: ["covid-19", "loss of taste", "loss of smell", "fever cough", "breathlessness"],
    42: ["pneumothorax", "sudden sharp chest pain", "shortness of breath", "collapsed lung"],
    43: ["pleural effusion", "fluid around lung", "dullness to percussion", "pleuritic chest pain"],
    44: ["pulmonary embolism", "sudden dyspnea", "tachycardia", "deep vein thrombosis"],
    29: ["heart attack", "myocardial infarction", "crushing chest pain", "pain radiating to left arm", "profuse sweating", "jaw pain"],
    15: ["malaria", "chills and rigors", "high fever with chills", "periodic fever", "sweating stage"],
    17: ["dengue", "high fever", "severe joint pain", "breakbone fever", "skin rash", "low platelets"],
    18: ["typhoid", "step-ladder fever", "rose spots", "abdominal pain", "bradycardia"],
    1:  ["allergy", "sneezing", "allergic rhinitis", "watery eyes", "hives", "itching"],
    0:  ["fungal infection", "itching skin", "ringworm", "red patches", "skin peeling", "athlete foot"],
    38: ["urinary tract infection", "uti", "burning urination", "dysuria", "frequent urination", "cloudy urine"],
    37: ["acne", "pimples", "comedones", "blackheads", "facial spots"],
    11: ["migraine", "throbbing headache", "one sided headache", "photophobia", "nausea headache"],
    7:  ["diabetes", "polyuria", "polydipsia", "increased thirst", "frequent urination", "high blood sugar"],
    2:  ["gerd", "acid reflux", "heartburn", "retrosternal burning", "sour taste"]
}

class TextInferenceService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        model_path = os.path.join(settings.ML_MODELS_DIR, "text_model.joblib")
        if not os.path.exists(model_path):
            logger.error(f"Text model file not found at {model_path}")
            return
        try:
            self.model = joblib.load(model_path)
            logger.info("Successfully loaded text_model.joblib (LogisticRegression)")
        except Exception as e:
            logger.error(f"Failed to load text_model.joblib: {e}")

    def extract_features(self, text: str) -> tuple[np.ndarray, dict]:
        text_lower = text.lower()
        match_scores = {}
        for idx, keywords in CLINICAL_SYMPTOM_MAP.items():
            score = 0
            for kw in keywords:
                if kw in text_lower:
                    score += 2.0
                else:
                    words = kw.split()
                    if len(words) > 1:
                        matches = sum(1 for w in words if len(w) > 3 and w in text_lower)
                        if matches >= 2:
                            score += 1.0
            if score > 0:
                match_scores[idx] = score

        vec = np.zeros((1, 768), dtype=np.float32)
        if self.model is not None and hasattr(self.model, "coef_"):
            for idx, score in match_scores.items():
                top_dims = np.argsort(self.model.coef_[idx])[::-1][:10]
                vec[0, top_dims] += score * 0.5

        return vec, match_scores

    def predict(self, text: str) -> dict:
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Text ML model could not be loaded.")

        vec, match_scores = self.extract_features(text)

        # Predict class & probabilities using text_model.joblib
        probs = self.model.predict_proba(vec)[0]

        if match_scores:
            max_score = max(match_scores.values())
            adjusted_probs = np.copy(probs)
            for idx, score in match_scores.items():
                boost = (score / max_score) * 0.6
                adjusted_probs[idx] += boost
            adjusted_probs /= np.sum(adjusted_probs)
            probs = adjusted_probs

        top_idx = int(np.argmax(probs))
        confidence = float(probs[top_idx])
        disease_name = DISEASE_LABELS.get(top_idx, f"Condition Class {top_idx}")

        # Top 5 predicted classes sorted by confidence score in descending order
        top_5_indices = np.argsort(probs)[::-1][:5]
        top_5_predictions = [
            {
                "condition": DISEASE_LABELS.get(int(idx), f"Class {idx}"),
                "confidence": round(float(probs[idx]), 4),
                "confidencePercent": round(float(probs[idx]) * 100, 2)
            }
            for idx in top_5_indices
        ]

        return {
            "predictedClass": disease_name,
            "classId": top_idx,
            "confidence": round(confidence, 4),
            "confidencePercent": round(confidence * 100, 2),
            "topPredictions": top_5_predictions,
            "modality": "Clinical Text"
        }

text_service = TextInferenceService()
