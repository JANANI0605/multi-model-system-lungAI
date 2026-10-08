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

class TextInferenceService:
    def __init__ (self):
        self.model = None
        self.tokenizer = None
        self.embedder = None
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

    def _extract_embedding(self, text: str) -> np.ndarray:
        # Convert text into a deterministic 768-dim representation
        words = text.lower().split()
        vec = np.zeros(768, dtype=np.float32)
        
        # Word-level feature hashing into 768 bins with TF weighting
        for i, w in enumerate(words):
            h = hash(w) % 768
            # TF-IDF style weighting with position decaying
            weight = 1.0 / (1.0 + np.log(1 + i))
            vec[h] += weight
            
            # Additional n-gram features
            if i > 0:
                bigram = f"{words[i-1]}_{w}"
                h_bi = hash(bigram) % 768
                vec[h_bi] += 1.5
                
        # Normalize vector
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
            
        return vec.reshape(1, -1)

    def predict(self, text: str) -> dict:
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Text ML model could not be loaded.")
                
        vec = self._extract_embedding(text)
        
        # Predict class & probabilities from text_model.joblib
        probs = self.model.predict_proba(vec)[0]
        top_idx = int(np.argmax(probs))
        confidence = float(probs[top_idx])
        
        disease_name = DISEASE_LABELS.get(top_idx, f"Condition Class {top_idx}")
        
        # Top 5 predicted classes with confidence scores
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
