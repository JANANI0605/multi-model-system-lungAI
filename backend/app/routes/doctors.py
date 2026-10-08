from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
import logging
from app.auth.jwt_handler import require_role
from app.database import get_database
from app.routes.reports import build_id_query

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

@router.get("/stats")
async def get_doctor_stats(current_user: dict = Depends(require_role(["doctor"]))):
    db = get_database()
    
    total_patients = 0
    recent_analyses_cnt = 0
    recent_uploads_cnt = 0
    attention_required_cnt = 0
    
    if db is not None:
        try:
            total_patients = await db.users.count_documents({"role": "patient"})
            recent_analyses_cnt = await db.predictions.count_documents({})
            
            abnormal_preds = await db.predictions.count_documents({
                "$or": [
                    {"laboratoryResult.overallStatus": "Needs attention"},
                    {"imageResult.predictedCondition": {"$ne": "No Finding"}}
                ]
            })
            attention_required_cnt = abnormal_preds
            recent_uploads_cnt = recent_analyses_cnt
        except Exception as e:
            logger.error(f"Doctor stats error: {e}")

    return {
        "totalPatients": total_patients,
        "recentAnalyses": recent_analyses_cnt,
        "recentUploads": recent_uploads_cnt,
        "patientsRequiringAttention": attention_required_cnt
    }

@router.get("/patients")
async def get_doctor_patients(current_user: dict = Depends(require_role(["doctor"]))):
    db = get_database()
    patient_list = []
    
    if db is not None:
        try:
            cursor = db.users.find({"role": "patient"})
            async for p in cursor:
                p_id = str(p.get("_id", p.get("id")))
                
                # Fetch latest prediction for this patient
                latest_pred = await db.predictions.find_one(
                    {"patientId": p_id},
                    sort=[("createdAt", -1)]
                )
                
                modalities = []
                latest_finding = "No Analysis Yet"
                latest_date = p.get("createdAt")
                status_flag = "Normal"
                
                if latest_pred:
                    cons = latest_pred.get("consolidated", {})
                    modalities = cons.get("availableModalities", [])
                    latest_finding = cons.get("primaryFinding", "Completed")
                    latest_date = latest_pred.get("createdAt")
                    
                    lab_st = latest_pred.get("laboratoryResult", {}).get("overallStatus") if latest_pred.get("laboratoryResult") else None
                    img_st = latest_pred.get("imageResult", {}).get("predictedCondition") if latest_pred.get("imageResult") else None
                    if lab_st == "Needs attention" or (img_st and img_st != "No Finding"):
                        status_flag = "Needs Attention"

                patient_list.append({
                    "id": p_id,
                    "name": p.get("name"),
                    "email": p.get("email"),
                    "phone": p.get("phone"),
                    "gender": p.get("gender"),
                    "dob": p.get("dob"),
                    "modalities": modalities,
                    "latestFinding": latest_finding,
                    "latestDate": latest_date,
                    "statusFlag": status_flag
                })
        except Exception as e:
            logger.error(f"Doctor patients error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch patients list: {str(e)}")

    return {"patients": patient_list}

@router.get("/patients/{patient_id}")
async def get_patient_detail_for_doctor(
    patient_id: str,
    current_user: dict = Depends(require_role(["doctor"]))
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")
        
    try:
        query = build_id_query(patient_id)
        query["role"] = "patient"
        patient = await db.users.find_one(query)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient record not found.")
            
        p_copy = dict(patient)
        p_copy["id"] = str(p_copy.get("_id", p_copy.get("id")))
        p_copy.pop("_id", None)
        p_copy.pop("passwordHash", None)
        
        predictions_cursor = db.predictions.find({"patientId": patient_id}).sort("createdAt", -1)
        history = []
        async for pred in predictions_cursor:
            pr = dict(pred)
            pr["id"] = str(pr.get("_id", pr.get("id")))
            pr.pop("_id", None)
            history.append(pr)
            
        return {
            "patient": p_copy,
            "analysisHistory": history,
            "totalAnalyses": len(history)
        }
    except Exception as e:
        logger.error(f"Error retrieving patient record: {e}")
        raise HTTPException(status_code=400, detail=f"Error retrieving patient record: {str(e)}")
