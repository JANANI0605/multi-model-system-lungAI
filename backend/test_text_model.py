import os
import joblib
import numpy as np

model_path = os.path.join("..", "ML_models", "text_model.joblib")
model = joblib.load(model_path)
print("Model loaded. Coef shape:", model.coef_.shape, "Intercept shape:", model.intercept_.shape)

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

samples = [
    "Patient presents with high fever, persistent productive cough, shortness of breath, and chest pain on deep breath for 4 days.",
    "Patient has wheezing, shortness of breath, chest tightness, and difficulty breathing during exertion.",
    "High fever, chills, sweating, muscle ache, and severe headache for 3 days.",
    "Crushing chest pain radiating to left arm, shortness of breath, profuse sweating, and dizziness.",
    "Burning sensation during urination, frequent urination, lower abdominal pain.",
    "Itching, skin rash, red spots, skin peeling on arms."
]

def test_hashing_encoder(text):
    import hashlib
    words = text.lower().replace(",", " ").replace(".", " ").split()
    vec = np.zeros(768, dtype=np.float32)
    for i, w in enumerate(words):
        h_val = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
        h = h_val % 768
        vec[h] += 1.0
        if i > 0:
            bigram = f"{words[i-1]}_{w}"
            h_bi = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16) % 768
            vec[h_bi] += 1.5
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.reshape(1, -1)

for s in samples:
    vec = test_hashing_encoder(s)
    probs = model.predict_proba(vec)[0]
    top_indices = np.argsort(probs)[::-1][:5]
    print(f"\nText: '{s}'")
    print("Top 5 Predictions:")
    for idx in top_indices:
        print(f"  - {DISEASE_LABELS[idx]}: {probs[idx]*100:.2f}%")
