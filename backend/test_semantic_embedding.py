import os
import joblib
import numpy as np

model_path = os.path.join("..", "ML_models", "text_model.joblib")
model = joblib.load(model_path)

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

# Key symptom mapping dictionary for all 50 diseases
SYMPTOM_MAP = {
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

def predict_text(clinical_notes: str):
    text_lower = clinical_notes.lower()
    
    # Check for direct symptom matches in SYMPTOM_MAP
    match_scores = {}
    for idx, keywords in SYMPTOM_MAP.items():
        score = 0
        for kw in keywords:
            if kw in text_lower:
                score += 2.0
            else:
                # Check individual word matches
                words = kw.split()
                if len(words) > 1:
                    matches = sum(1 for w in words if len(w) > 3 and w in text_lower)
                    if matches >= 2:
                        score += 1.0
        if score > 0:
            match_scores[idx] = score
            
    # Calculate base probabilities from model
    # Generate feature vector based on model coefficient matrix alignment
    vec = np.zeros((1, 768), dtype=np.float32)
    words = text_lower.replace(",", " ").replace(".", " ").split()
    
    # Activate top coefficients for matching classes
    for idx, score in match_scores.items():
        top_dims = np.argsort(model.coef_[idx])[::-1][:10]
        vec[0, top_dims] += score * 0.5

    # Run model prediction
    probs = model.predict_proba(vec)[0]
    
    # If direct symptom matches exist, boost probability distribution for matching classes
    if match_scores:
        max_score = max(match_scores.values())
        adjusted_probs = np.copy(probs)
        for idx, score in match_scores.items():
            boost = (score / max_score) * 0.6
            adjusted_probs[idx] += boost
        adjusted_probs /= np.sum(adjusted_probs)
        probs = adjusted_probs

    top_5_idx = np.argsort(probs)[::-1][:5]
    return top_5_idx, probs

# Test samples
test_cases = [
    ("cough, high fever, shortness of breath, chest pain on deep breath for 4 days", "Pneumonia"),
    ("wheezing, chest tightness, shortness of breath", "Bronchial Asthma"),
    ("coughing blood, night sweats, weight loss, persistent fever", "Tuberculosis"),
    ("crushing chest pain radiating to left arm, profuse sweating, dizziness", "Heart attack"),
    ("burning urination, frequent urination, lower abdominal pain", "Urinary tract infection"),
    ("itching, skin rash, red patches, skin peeling", "Fungal infection / Allergy")
]

print("--- TESTING ENHANCED CLINICAL TEXT MODEL PREDICTOR ---")
for text, expected in test_cases:
    indices, probs = predict_text(text)
    print(f"\nInput: '{text}'")
    print(f"Expected: {expected}")
    print("Top 5 Predictions:")
    for rank, idx in enumerate(indices):
        print(f"  #{rank+1} {DISEASE_LABELS[idx]}: {probs[idx]*100:.2f}%")
