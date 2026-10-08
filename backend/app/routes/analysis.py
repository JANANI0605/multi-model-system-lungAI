import os
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from bson import ObjectId

from app.schemas.analysis import TextAnalysisRequest, LabAnalysisRequest
from app.auth.jwt_handler import get_current_user, require_role
from app.database import get_database
from app.config import settings

from app.ml.text_inference import text_service
from app.ml.image_inference import image_service
from app.ml.laboratory_analysis import lab_service
from app.ml.xai_service import xai_service
from app.ml.multimodal_fusion import fusion_service

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.post("/text")
async def analyze_clinical_text(
    req: TextAnalysisRequest,
    current_user: dict = Depends(require_role(["patient", "doctor"]))
):
    try:
        text_result = text_service.predict(req.clinicalNotes)
        text_xai = xai_service.explain_text(
            clinical_notes=req.clinicalNotes,
            predicted_class=text_result["predictedClass"],
            class_id=text_result["classId"],
            model=text_service.model
        )
        
        return {
            "textResult": text_result,
            "textXAI": text_xai
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")

@router.post("/image")
async def analyze_medical_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["patient", "doctor"]))
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPG, JPEG, PNG) are supported.")
        
    filename = f"{current_user['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(settings.UPLOADS_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {e}")
        
    try:
        img_result = image_service.predict(file_path)
        img_xai = xai_service.explain_image(
            image_path=file_path,
            vit_model=image_service.model,
            vit_processor=image_service.processor
        )
        
        return {
            "imagePath": file_path,
            "imageFileName": filename,
            "imageResult": img_result,
            "imageXAI": img_xai
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Medical image analysis failed: {str(e)}")

@router.post("/laboratory")
async def analyze_laboratory_records(
    req: LabAnalysisRequest,
    current_user: dict = Depends(require_role(["patient", "doctor"]))
):
    try:
        tests_data = [t.dict() for t in req.tests]
        lab_result = lab_service.analyze(tests_data)
        lab_xai = xai_service.explain_lab(lab_result)
        
        return {
            "laboratoryResult": lab_result,
            "labXAI": lab_xai
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Laboratory analysis failed: {str(e)}")

@router.post("/laboratory-file")
async def analyze_laboratory_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["patient", "doctor"]))
):
    ext = os.path.splitext(file.filename)[1].lower()
    valid_exts = [".pdf", ".png", ".jpg", ".jpeg"]
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail="Laboratory file must be a PDF (.pdf) or image (.png, .jpg, .jpeg).")

    filename = f"lab_{current_user['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(settings.UPLOADS_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded lab file: {e}")

    try:
        lab_result = lab_service.analyze_file(file_path, filename, file.content_type or "")
        lab_xai = xai_service.explain_lab(lab_result)

        return {
            "labFilePath": file_path,
            "labFileName": filename,
            "laboratoryResult": lab_result,
            "labXAI": lab_xai
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Laboratory file analysis failed: {str(e)}")


@router.post("/consolidate")
async def submit_multimodal_analysis(
    payload: dict,
    current_user: dict = Depends(require_role(["patient", "doctor"]))
):
    patient_id = payload.get("patientId") or current_user["id"]
    
    text_res = payload.get("textResult")
    text_xai = payload.get("textXAI")
    clinical_notes = payload.get("clinicalNotes")
    
    img_res = payload.get("imageResult")
    img_xai = payload.get("imageXAI")
    image_ref = payload.get("imageFileName")
    
    lab_res = payload.get("laboratoryResult")
    lab_xai = payload.get("labXAI")
    
    # Run Multimodal Fusion Service
    consolidated = fusion_service.consolidate(
        text_res=text_res,
        image_res=img_res,
        lab_res=lab_res
    )
    
    record = {
        "patientId": str(patient_id),
        "patientEmail": str(current_user.get("email", "")).lower(),
        "patientName": current_user.get("name"),
        "clinicalNotes": clinical_notes,
        "textResult": text_res,
        "textXAI": text_xai,
        "imageFileName": image_ref,
        "imageResult": img_res,
        "imageXAI": img_xai,
        "laboratoryResult": lab_res,
        "labXAI": lab_xai,
        "consolidated": consolidated,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    db = get_database()
    record_id = str(ObjectId())
    
    if db is not None:
        try:
            res = await db.predictions.insert_one(record)
            record_id = str(res.inserted_id)
        except Exception:
            pass

    record["id"] = record_id
    if "_id" in record:
        record.pop("_id", None)
        
    return {
        "message": "Multimodal analysis completed and stored successfully",
        "recordId": record_id,
        "record": record
    }

@router.get("/history")
async def get_patient_analysis_history(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    target_id = str(current_user["id"])
    target_email = str(current_user.get("email", "")).lower()

    if current_user["role"] == "doctor" and patient_id:
        target_id = str(patient_id)
        target_email = ""

    db = get_database()
    history = []

    if db is not None:
        try:
            from bson import ObjectId
            target_ids = [target_id]
            try:
                target_ids.append(ObjectId(target_id))
            except Exception:
                pass

            conditions = [{"patientId": {"$in": target_ids}}, {"patientId": target_id}]
            if target_email:
                conditions.append({"patientEmail": target_email})

            query = {"$or": conditions}
            cursor = db.predictions.find(query).sort("createdAt", -1)
            async for doc in cursor:
                doc["id"] = str(doc.get("_id", doc.get("id")))
                doc.pop("_id", None)
                history.append(doc)
        except Exception as e:
            print(f"Error fetching history: {e}")

    return {"history": history}

@router.get("/{analysis_id}")
async def get_analysis_by_id(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")
        
    try:
        from app.routes.reports import build_id_query
        doc = await db.predictions.find_one(build_id_query(analysis_id))
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis record not found.")
            
        # Security check: patients can only access their own records
        user_id_str = str(current_user["id"])
        user_email = str(current_user.get("email", "")).lower()
        rec_patient_id = str(doc.get("patientId", ""))
        rec_patient_email = str(doc.get("patientEmail", "")).lower()

        if current_user["role"] == "patient":
            if rec_patient_id != user_id_str and (not user_email or rec_patient_email != user_email):
                raise HTTPException(status_code=403, detail="Unauthorized access to patient record.")
            
        doc["id"] = str(doc.get("_id", doc.get("id")))
        doc.pop("_id", None)
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid analysis ID: {e}")
