from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.auth.jwt_handler import get_current_user, require_role
from app.database import get_database

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("/me")
async def get_patient_profile(current_user: dict = Depends(require_role(["patient"]))):
    patient_id = current_user["id"]
    db = get_database()
    
    medical_status = {
        "clinicalNotesUploaded": False,
        "laboratoryRecordsUploaded": False,
        "medicalImageUploaded": False,
        "hasAnalysisHistory": False,
        "latestAnalysisDate": None,
        "latestPredictedCondition": None,
        "latestConfidence": None
    }
    
    if db is not None:
        try:
            # Check latest prediction/analysis
            latest_pred = await db.predictions.find_one(
                {"patientId": patient_id},
                sort=[("createdAt", -1)]
            )
            
            if latest_pred:
                medical_status["hasAnalysisHistory"] = True
                medical_status["latestAnalysisDate"] = latest_pred.get("createdAt")
                medical_status["clinicalNotesUploaded"] = latest_pred.get("textResult") is not None
                medical_status["laboratoryRecordsUploaded"] = latest_pred.get("laboratoryResult") is not None
                medical_status["medicalImageUploaded"] = latest_pred.get("imageResult") is not None
                
                cons = latest_pred.get("consolidated", {})
                medical_status["latestPredictedCondition"] = cons.get("primaryFinding", "Completed")
                medical_status["latestConfidence"] = cons.get("overallConfidence", 0.0)
        except Exception as e:
            pass

    return {
        "profile": current_user,
        "medicalStatus": medical_status
    }

@router.put("/me")
async def update_patient_profile(
    data: dict,
    current_user: dict = Depends(require_role(["patient"]))
):
    patient_id = current_user["id"]
    db = get_database()
    
    update_fields = {}
    if "phone" in data:
        update_fields["phone"] = data["phone"]
    if "dob" in data:
        update_fields["dob"] = data["dob"]
    if "gender" in data:
        update_fields["gender"] = data["gender"]
    if "emergencyContact" in data or "medicalHistory" in data:
        prof = current_user.get("profile", {})
        if "emergencyContact" in data:
            prof["emergencyContact"] = data["emergencyContact"]
        if "medicalHistory" in data:
            prof["medicalHistory"] = data["medicalHistory"]
        update_fields["profile"] = prof
        
    if db is not None and update_fields:
        try:
            await db.users.update_one(
                {"_id": ObjectId(patient_id)},
                {"$set": update_fields}
            )
        except Exception:
            pass
            
    return {"message": "Profile updated successfully"}
