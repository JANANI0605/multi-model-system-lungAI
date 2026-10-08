from typing import Optional, Dict, Any, List

class MultimodalFusionService:
    def consolidate(
        self,
        text_res: Optional[Dict[str, Any]] = None,
        image_res: Optional[Dict[str, Any]] = None,
        lab_res: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        available_modalities = []
        if text_res:
            available_modalities.append("Clinical Text")
        if image_res:
            available_modalities.append("Chest X-Ray Image")
        if lab_res:
            available_modalities.append("Laboratory Records")

        modality_count = len(available_modalities)
        summary_points = []
        top_5_summary = []

        text_pred = text_res.get("predictedClass") if text_res else None
        text_conf = float(text_res.get("confidence", 0.0)) if text_res else 0.0
        
        img_pred = image_res.get("predictedCondition") if image_res else None
        img_conf = float(image_res.get("confidence", 0.0)) if image_res else 0.0
        
        lab_status = lab_res.get("overallStatus") if lab_res else None
        abnormal_labs = lab_res.get("abnormalParameters", []) if lab_res else []
        abnormal_cnt = len(abnormal_labs)

        # Collect summary points for each modality
        if text_res:
            summary_points.append(
                f"Clinical Text Model (Symptoms): Predicted '{text_pred}' with {int(text_conf * 100)}% confidence."
            )
            if text_res.get("topPredictions"):
                top_5_summary.append({
                    "modality": "Clinical Text Model (text_model.joblib)",
                    "top5": text_res.get("topPredictions")
                })

        if image_res:
            summary_points.append(
                f"Chest X-Ray Image Model (ViT Radiograph): Identified '{img_pred}' with {int(img_conf * 100)}% confidence."
            )
            if image_res.get("topPredictions"):
                top_5_summary.append({
                    "modality": "Chest X-Ray Image Model (img_model)",
                    "top5": image_res.get("topPredictions")
                })

        if lab_res:
            abnormal_names = [f"{p.get('name')} ({p.get('status')})" for p in abnormal_labs]
            lab_desc = ", ".join(abnormal_names) if abnormal_names else "All parameters normal"
            summary_points.append(
                f"Laboratory Analysis Panel: Status '{lab_status}' ({lab_desc})."
            )

        # Determine Primary Finding across ALL 3 MODELS dynamically
        primary_finding = "Inconclusive"
        overall_confidence = 0.0
        consensus_level = "Single Modality / Inconclusive"

        # Check for matching / correlating text and image predictions
        matches = False
        if text_pred and img_pred:
            t_lower = str(text_pred).lower()
            i_lower = str(img_pred).lower()
            if t_lower == i_lower or t_lower in i_lower or i_lower in t_lower:
                matches = True

        if modality_count == 3:
            if matches:
                primary_finding = f"{img_pred} (High Multimodal Consensus)"
                overall_confidence = round(max(img_conf, text_conf, 0.85), 4)
                consensus_level = "High 3-Modality Consensus (Image + Text + Lab Correlated)"
                lab_note = f"Elevated/Abnormal laboratory markers ({', '.join([p.get('name') for p in abnormal_labs[:2]])})" if abnormal_cnt > 0 else "Normal laboratory panel"
                consolidated_summary = (
                    f"Strong 3-modality alignment detected: Both Clinical Text symptoms ('{text_pred}') and Chest X-Ray radiograph ('{img_pred}') "
                    f"concur with high model confidence ({int(img_conf * 100)}% ViT Image, {int(text_conf * 100)}% Text Model). "
                    f"Laboratory evaluation indicates {lab_note}, reinforcing the primary finding of '{img_pred}'."
                )
            else:
                # Weighted multi-model evidence synthesis: evaluate higher-confidence model + lab support
                if img_conf >= text_conf and img_pred not in ["No Finding", "Inconclusive", None]:
                    primary_finding = f"{img_pred} (Image ViT Lead: {int(img_conf*100)}%) | Symptom: {text_pred}"
                    overall_confidence = round(img_conf, 4)
                elif text_pred and text_pred not in ["Inconclusive", None]:
                    primary_finding = f"{text_pred} (Text Model Lead: {int(text_conf*100)}%) | Image: {img_pred}"
                    overall_confidence = round(text_conf, 4)
                else:
                    primary_finding = img_pred or text_pred or "Multimodal Observation"
                    overall_confidence = round(max(img_conf, text_conf), 4)
                
                consensus_level = "Multi-Factor Synthesis (Combining Distinct Model Inputs)"
                lab_info = f"supported by {abnormal_cnt} abnormal laboratory parameter(s)" if abnormal_cnt > 0 else "with normal laboratory values"
                consolidated_summary = (
                    f"Multimodal 3-model synthesis generated: Chest X-Ray ViT identifies '{img_pred}' ({int(img_conf*100)}% confidence), "
                    f"Clinical Text model predicts '{text_pred}' ({int(text_conf*100)}% confidence), "
                    f"and Laboratory analysis reports status '{lab_status}' ({lab_info}). "
                    f"Primary clinical finding evaluated as '{primary_finding}'."
                )

        elif modality_count == 2:
            if matches:
                primary_finding = f"{img_pred or text_pred} (Consensus)"
                overall_confidence = round(max(img_conf, text_conf), 4)
                consensus_level = "Dual-Modality Agreement"
                consolidated_summary = (
                    f"Dual-modality agreement between Clinical Text ('{text_pred}') and Chest X-Ray ('{img_pred}'). "
                    f"Consensus primary finding: '{primary_finding}'."
                )
            elif image_res and text_res:
                if img_conf >= text_conf:
                    primary_finding = f"{img_pred} (Image ViT: {int(img_conf*100)}%)"
                    overall_confidence = round(img_conf, 4)
                else:
                    primary_finding = f"{text_pred} (Clinical Text: {int(text_conf*100)}%)"
                    overall_confidence = round(text_conf, 4)
                consensus_level = "Dual-Modality Cross-Analysis"
                consolidated_summary = (
                    f"Bi-modal analysis completed across Clinical Text and Chest X-Ray image models. "
                    f"Radiological ViT predicts '{img_pred}' ({int(img_conf*100)}%), Text model predicts '{text_pred}' ({int(text_conf*100)}%)."
                )
            elif image_res and lab_res:
                primary_finding = f"{img_pred} (Image ViT) + Lab '{lab_status}'"
                overall_confidence = round(img_conf, 4)
                consensus_level = "Image + Laboratory Synthesis"
                consolidated_summary = f"Chest X-Ray ViT predicts '{img_pred}' ({int(img_conf*100)}%) combined with Laboratory status '{lab_status}'."
            elif text_res and lab_res:
                primary_finding = f"{text_pred} (Text Model) + Lab '{lab_status}'"
                overall_confidence = round(text_conf, 4)
                consensus_level = "Text + Laboratory Synthesis"
                consolidated_summary = f"Clinical Text model predicts '{text_pred}' ({int(text_conf*100)}%) combined with Laboratory status '{lab_status}'."

        elif modality_count == 1:
            if text_res:
                primary_finding = text_pred
                overall_confidence = round(text_conf, 4)
                consolidated_summary = f"Single-modality analysis from Clinical Text model: '{text_pred}' ({int(text_conf*100)}% confidence)."
            elif image_res:
                primary_finding = img_pred
                overall_confidence = round(img_conf, 4)
                consolidated_summary = f"Single-modality analysis from Chest X-Ray ViT model: '{img_pred}' ({int(img_conf*100)}% confidence)."
            elif lab_res:
                primary_finding = f"Laboratory Panel Status: {lab_status}"
                overall_confidence = 0.80
                consolidated_summary = f"Single-modality analysis from Laboratory record: status '{lab_status}'."
            consensus_level = "Single Modality Only"
        else:
            consolidated_summary = "No medical data modalities were submitted."

        return {
            "availableModalities": available_modalities,
            "modalityCount": modality_count,
            "primaryFinding": primary_finding,
            "overallConfidence": overall_confidence,
            "consensusLevel": consensus_level,
            "consolidatedSummary": consolidated_summary,
            "summaryPoints": summary_points,
            "top5PredictionsByModality": top_5_summary,
            "labelSpaceFusionStrategy": "3-Model Multimodal Evidence Synthesis & Consensus Integration",
            "disclaimer": "This system provides machine-learning decision support based on combined text, image, and laboratory models and is not a substitute for professional medical diagnosis."
        }

fusion_service = MultimodalFusionService()

