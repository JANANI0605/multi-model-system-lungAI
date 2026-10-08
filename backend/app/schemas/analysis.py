from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LabTestItem(BaseModel):
    name: str = Field(..., example="WBC")
    value: float = Field(..., example=12.5)
    unit: str = Field(..., example="10^9/L")
    referenceRange: str = Field(..., example="4.0 - 11.0")

class LabAnalysisRequest(BaseModel):
    tests: List[LabTestItem]

class TextAnalysisRequest(BaseModel):
    clinicalNotes: str = Field(..., example="Patient reports high fever, persistent dry cough, chest pain, and shortness of breath for 3 days.")

class AnalysisSubmitRequest(BaseModel):
    clinicalNotes: Optional[str] = None
    labTests: Optional[List[LabTestItem]] = None
