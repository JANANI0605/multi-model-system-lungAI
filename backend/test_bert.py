import os
import joblib
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel

model_path = os.path.join("..", "ML_models", "text_model.joblib")
logistic_model = joblib.load(model_path)

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

# Test sample symptom texts
samples = [
    "Patient presents with high fever, persistent productive cough, shortness of breath, chest discomfort, and chest pain on deep breath for 4 days.",
    "Patient has wheezing, shortness of breath, chest tightness, and difficulty breathing during exertion.",
    "High fever, chills, sweating, muscle ache, and severe headache for 3 days.",
    "Crushing chest pain radiating to left arm, shortness of breath, profuse sweating, and dizziness.",
    "Burning sensation during urination, frequent urination, lower abdominal pain.",
    "Itching, skin rash, red spots, skin peeling on arms."
]

# Let's inspect model.coef_ weights across 768 dimensions
coef = logistic_model.coef_ # (50, 768)
intercept = logistic_model.intercept_ # (50,)

print("Examining coef_ statistics:")
print("Min coef:", coef.min(), "Max coef:", coef.max(), "Mean:", coef.mean(), "Std:", coef.std())
print("Top dimensions per disease class:")
for i in range(5):
    top_dims = np.argsort(coef[i])[::-1][:5]
    print(f"  Class {i} ({DISEASE_LABELS[i]}): top dims {top_dims} weights {coef[i][top_dims]}")

