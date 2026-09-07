from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ExtractedFields(BaseModel):
    fir_number: Optional[str] = Field(None, description="Extracted FIR / Case Number")
    sections_of_law: List[str] = Field(default_factory=list, description="Extracted IPC or BNS sections (e.g. U/S 302, 376 IPC)")
    police_station: Optional[str] = Field(None, description="Police station name")
    district: Optional[str] = Field(None, description="District name")
    date_of_incident: Optional[str] = Field(None, description="Date of occurrence / incident")
    date_of_filing: Optional[str] = Field(None, description="Date of FIR filing")
    complainant_name: Optional[str] = Field(None, description="Name of the complainant / informant")
    accused_name: Optional[str] = Field(None, description="Name of the accused person(s)")
    investigating_officer: Optional[str] = Field(None, description="Name of the Investigating Officer (IO)")
    additional_metadata: Dict[str, Any] = Field(default_factory=dict, description="Other discovered key-value pairs")

class OCRScanResponse(BaseModel):
    filename: str
    file_type: str
    total_pages: int
    extracted_text: str
    confidence_score: float
    fields: Optional[ExtractedFields] = None

class KeywordSearchRequest(BaseModel):
    keywords: List[str] = Field(..., description="List of specific keywords to search for in document text")

class KeywordSearchMatch(BaseModel):
    keyword: str
    matches_count: int
    found_snippets: List[str]

class KeywordSearchResponse(BaseModel):
    filename: str
    total_matches: int
    results: List[KeywordSearchMatch]
