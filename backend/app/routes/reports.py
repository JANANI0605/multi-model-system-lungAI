import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from bson import ObjectId
from app.auth.jwt_handler import get_current_user
from app.database import get_database
from app.config import settings
from app.services.report_service import pdf_generator

router = APIRouter(prefix="/api/reports", tags=["Reports"])

def build_id_query(id_str: str):
    try:
        return {"$or": [{"_id": ObjectId(id_str)}, {"id": id_str}]}
    except Exception:
        return {"id": id_str}

@router.post("/generate/{analysis_id}")
async def generate_analysis_report(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    try:
        query = build_id_query(analysis_id)
        record = await db.predictions.find_one(query)
        if not record:
            raise HTTPException(status_code=404, detail="Analysis record not found.")

        user_id_str = str(current_user.get("id"))
        user_email = str(current_user.get("email", "")).lower()
        rec_patient_id = str(record.get("patientId", ""))
        rec_patient_email = str(record.get("patientEmail", "")).lower()

        # Patient security check
        if current_user["role"] == "patient":
            if rec_patient_id != user_id_str and (not user_email or rec_patient_email != user_email):
                raise HTTPException(status_code=403, detail="Unauthorized access to patient record.")

        # Fetch patient profile
        patient_query = build_id_query(record.get("patientId", current_user["id"]))
        patient_info = await db.users.find_one(patient_query)
        if not patient_info:
            patient_info = {
                "name": current_user.get("name"),
                "email": current_user.get("email"),
                "gender": current_user.get("gender"),
                "dob": current_user.get("dob")
            }
        else:
            patient_info["id"] = str(patient_info.get("_id", patient_info.get("id")))

        filename = pdf_generator.generate_report(patient_info, record)

        # Update report reference
        await db.predictions.update_one(
            query,
            {"$set": {"reportFileName": filename}}
        )

        return {
            "message": "Report generated successfully",
            "filename": filename,
            "downloadUrl": f"/api/reports/{analysis_id}/download"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report PDF: {str(e)}")

@router.get("/{analysis_id}/download")
async def download_analysis_report(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    try:
        query = build_id_query(analysis_id)
        record = await db.predictions.find_one(query)
        if not record:
            raise HTTPException(status_code=404, detail="Analysis record not found.")

        user_id_str = str(current_user.get("id"))
        user_email = str(current_user.get("email", "")).lower()
        rec_patient_id = str(record.get("patientId", ""))
        rec_patient_email = str(record.get("patientEmail", "")).lower()

        if current_user["role"] == "patient":
            if rec_patient_id != user_id_str and (not user_email or rec_patient_email != user_email):
                raise HTTPException(status_code=403, detail="Unauthorized access to patient record.")

        filename = record.get("reportFileName")
        if not filename:
            patient_query = build_id_query(record.get("patientId", current_user["id"]))
            patient_info = await db.users.find_one(patient_query) or current_user
            filename = pdf_generator.generate_report(patient_info, record)
            await db.predictions.update_one(
                query,
                {"$set": {"reportFileName": filename}}
            )

        filepath = os.path.join(settings.REPORTS_DIR, filename)
        if not os.path.exists(filepath):
            patient_query = build_id_query(record.get("patientId", current_user["id"]))
            patient_info = await db.users.find_one(patient_query) or current_user
            filename = pdf_generator.generate_report(patient_info, record)
            filepath = os.path.join(settings.REPORTS_DIR, filename)

        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download report: {str(e)}")
