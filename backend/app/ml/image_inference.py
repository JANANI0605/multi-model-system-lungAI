import os
import json
import torch
import numpy as np
from PIL import Image
import logging
from transformers import ViTForImageClassification, ViTImageProcessor, AutoConfig
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class ImageInferenceService:
    def __init__(self):
        self.model = None
        self.processor = None
        self.labels = []
        self.thresholds = {}
        self._load_model()

    def _load_model(self):
        img_model_dir = os.path.join(settings.ML_MODELS_DIR, "img_model")
        if not os.path.exists(img_model_dir):
            logger.error(f"Image model directory not found at {img_model_dir}")
            return
            
        try:
            # Load labels & thresholds
            labels_path = os.path.join(img_model_dir, "label_names.json")
            if os.path.exists(labels_path):
                with open(labels_path, "r") as f:
                    self.labels = json.load(f)
            else:
                self.labels = [
                    "No Finding", "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
                    "Mass", "Nodule", "Pneumonia", "Pneumothorax", "Consolidation",
                    "Edema", "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia"
                ]

            thresh_path = os.path.join(img_model_dir, "best_thresholds.json")
            if os.path.exists(thresh_path):
                with open(thresh_path, "r") as f:
                    self.thresholds = json.load(f)
            else:
                self.thresholds = {label: 0.5 for label in self.labels}

            # Load HuggingFace ViT model
            config = AutoConfig.from_pretrained(img_model_dir)
            self.model = ViTForImageClassification.from_pretrained(img_model_dir, config=config)
            self.model.eval()
            
            try:
                self.processor = ViTImageProcessor.from_pretrained(img_model_dir)
            except Exception:
                from transformers.models.vit.image_processing_pil_vit import ViTImageProcessorPil
                self.processor = ViTImageProcessorPil.from_pretrained(img_model_dir)

            logger.info("Successfully loaded ViT image classification model & processor.")
        except Exception as e:
            logger.error(f"Failed to load ViT image model: {e}")

    def predict(self, image_path: str) -> dict:
        if self.model is None or self.processor is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Medical image ML model is not available.")

        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image file: {e}")

        # Preprocess image
        inputs = self.processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits.squeeze(0)
            probs = torch.sigmoid(logits).cpu().numpy()

        detected_findings = []
        all_probabilities = {}
        prob_list = []

        for idx, label in enumerate(self.labels):
            prob = float(probs[idx])
            all_probabilities[label] = round(prob, 4)
            prob_list.append({
                "condition": label,
                "confidence": round(prob, 4),
                "confidencePercent": round(prob * 100, 2)
            })
            threshold = self.thresholds.get(label, 0.5)
            
            if prob >= threshold and label != "No Finding":
                detected_findings.append({
                    "finding": label,
                    "probability": round(prob, 4),
                    "threshold": threshold
                })

        # Sort all predictions in descending order by confidence score
        prob_list.sort(key=lambda x: x["confidence"], reverse=True)
        top_5_predictions = prob_list[:5]

        # Predicted Radiological Finding is strictly the first item from sorting in descending order
        primary_condition = prob_list[0]["condition"]
        confidence = prob_list[0]["confidence"]
        confidence_percent = prob_list[0]["confidencePercent"]

        return {
            "predictedCondition": primary_condition,
            "confidence": confidence,
            "confidencePercent": confidence_percent,
            "detectedFindings": detected_findings,
            "topPredictions": top_5_predictions,
            "allProbabilities": all_probabilities,
            "modality": "Chest X-Ray Image"
        }

image_service = ImageInferenceService()
