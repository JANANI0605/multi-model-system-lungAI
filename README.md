# Multimodal Healthcare Support System with Explainable Machine Learning (XAI)

A full-stack healthcare decision-support project for final-year engineering/CS curriculum. This system integrates pre-trained Machine Learning models for Clinical Text and Chest X-Ray images, alongside a rule-based Laboratory Analyzer, to provide explainable multimodal healthcare predictions.

---

## 🌟 Features & Modalities

1. **Role-Based Authentication**:
   - **Patient Role**: Submit medical data (Clinical Text, Chest X-Ray Image, Laboratory Records), view dynamic dashboard, inspect XAI explanations, view history, and download PDF reports.
   - **Doctor Role**: Review assigned patients, monitor patients requiring review, inspect patient XAI breakdowns, and download patient reports.
   - **JWT Authentication & Password Hashing**: Passwords stored securely with bcrypt hashing.

2. **Multimodal Model Integration**:
   - **Text Model**: scikit-learn `LogisticRegression` pipeline trained across 50 clinical disease categories.
   - **Image Model**: HuggingFace Vision Transformer (`ViTForImageClassification`) trained on 15 Chest X-Ray conditions.
   - **Laboratory Analyzer**: Configurable rule-based parameter validation checking values against clinical reference ranges.
   - **Dynamic Modality Support**: Accepts any combination of inputs (Text only, Image only, Lab only, Text+Image, Text+Lab, Lab+Image, or all three).

3. **Explainable AI (XAI)**:
   - **Text & Clinical XAI (SHAP)**: Computes SHapley Additive exPlanations (SHAP) feature attributions quantifying each clinical symptom's contribution and directional impact (Positive/Negative) relative to the baseline.
   - **Image XAI (Grad-CAM)**: Computes Gradient-weighted Class Activation Mapping (Grad-CAM) by backpropagating class-specific gradients to the final Vision Transformer (ViT) encoder layer, generating spatial heatmaps over affected chest regions.
   - **Laboratory XAI (SHAP-aligned)**: Details abnormal parameters, status (High/Low), and SHAP clinical risk attributions.

4. **Consolidated Multimodal Synthesis**:
   - Preserves distinct label spaces (Disease Diagnoses vs. X-Ray Findings) without fake mathematical fusion.
   - Synthesizes findings across available modalities.

5. **Downloadable PDF Healthcare Reports**:
   - Dynamically generated using ReportLab, containing patient info, modality breakdown, predictions, XAI descriptions, and medical disclaimer.

---

## 📁 Project Structure

```
Multi_model_lung_AI/
├── ML_models/
│   ├── text_model.joblib          # Scikit-learn LogisticRegression text model
│   └── img_model/                 # Vision Transformer (ViT) model files
│       ├── model.safetensors
│       ├── config.json
│       ├── label_names.json
│       ├── best_thresholds.json
│       └── preprocessor_config.json
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI application entry point
│   │   ├── config.py              # Environment configuration
│   │   ├── database.py            # MongoDB Motor async driver connection
│   │   ├── auth/
│   │   │   ├── security.py        # Bcrypt password hashing
│   │   │   └── jwt_handler.py     # JWT token generation & auth middleware
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── ml/
│   │   │   ├── text_inference.py  # Text ML model wrapper
│   │   │   ├── image_inference.py # ViT image model wrapper
│   │   │   ├── laboratory_analysis.py # Laboratory record analyzer
│   │   │   ├── xai_service.py     # Text, Image & Lab XAI generators
│   │   │   └── multimodal_fusion.py # Multimodal synthesis service
│   │   ├── services/
│   │   │   └── report_service.py # ReportLab PDF generator
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── patients.py
│   │       ├── doctors.py
│   │       ├── analysis.py
│   │       └── reports.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, ProtectedRoute, LoadingSpinner
│   │   ├── pages/                 # Login, Register, Dashboards, Upload, Analysis, Reports
│   │   ├── context/               # AuthContext.jsx
│   │   ├── services/              # Axios API client (api.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── uploads/                       # Directory for saved patient images
├── reports/                       # Directory for generated PDF reports
└── README.md
```

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js (v18+) and npm
- MongoDB (MongoDB Atlas connection string or local MongoDB server `mongodb://localhost:27017`)

---

### 2. Backend Setup

Navigate to the `backend` folder:
```bash
cd backend
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Set up Environment Variables:
Copy `.env.example` to `.env` if not already created:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
MONGODB_URI=mongodb://localhost:27017/healthcare_db
JWT_SECRET=multimodal_healthcare_xai_secret_key_2026_project
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ML_MODELS_DIR=../ML_models
UPLOADS_DIR=../uploads
REPORTS_DIR=../reports
```

Run Backend Server:
```bash
uvicorn app.main:app --reload --port 8000
```
Backend will start at: `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

---

### 3. Frontend Setup

Navigate to the `frontend` folder:
```bash
cd frontend
```

Install npm dependencies:
```bash
npm install
```

Run Vite Development Server:
```bash
npm run dev
```
Frontend will start at: `http://localhost:5173`

---

## 🔑 Development Test Credentials

You can register new accounts directly on the Registration page. Development test accounts:

- **Patient Account**:
  - Email: `janani@example.com`
  - Password: `password123`
  - Role: `Patient`

- **Doctor Account**:
  - Email: `doctor@hospital.org`
  - Password: `doctorpassword123`
  - Role: `Doctor`
  - Specialization: `Pulmonology & Respiratory Medicine`
  - License Number: `MD-987654`

---

## 🔬 Integration Details & ML Discovery Notes

1. **Text Model (`text_model.joblib`)**:
   - Framework: scikit-learn `LogisticRegression` (`solver='liblinear'`).
   - Feature Dimension: `768` features.
   - Target Classes: 50 disease classes (mapping across respiratory and general diseases like Pneumonia, Tuberculosis, Asthma, Bronchitis, COVID-19, Common Cold, GERD, Hypertension, etc.).

2. **Image Model (`img_model/`)**:
   - Framework: PyTorch + HuggingFace Transformers (`ViTForImageClassification` / `ViTImageProcessor`).
   - Architecture: Vision Transformer (`vit-base`).
   - Input Dimensions: `224x224` RGB image tensor normalized with mean `[0.5, 0.5, 0.5]` and std `[0.5, 0.5, 0.5]`.
   - Output Space: 15 multi-label Chest X-Ray conditions (`No Finding`, `Atelectasis`, `Cardiomegaly`, `Effusion`, `Infiltration`, `Mass`, `Nodule`, `Pneumonia`, `Pneumothorax`, `Consolidation`, `Edema`, `Emphysema`, `Fibrosis`, `Pleural_Thickening`, `Hernia`).

3. **Label Space Handling & Safety**:
   - Because the Text Model outputs 50 disease diagnosis classes while the Image Model outputs 15 radiological finding labels, the system maintains independent probability spaces and synthesizes evidence in a consolidated narrative rather than combining incompatible mathematical probabilities.

---

## ⚠️ Medical Disclaimer
This application is a machine-learning-based healthcare decision support system designed for research and educational demonstration. It does not provide medical diagnoses or replace professional clinical evaluation.
