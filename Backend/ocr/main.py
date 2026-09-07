import os
import uvicorn
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    OCRScanResponse, 
    ExtractedFields, 
    KeywordSearchResponse, 
    KeywordSearchMatch
)
from ocr_engine import perform_ocr_on_image_bytes, process_pdf_bytes
from field_extractor import extract_legal_fields, search_keywords_in_text

app = FastAPI(
    title="NCRB Legal Document OCR & Data Extraction Microservice",
    description="Microservice for OCR scanning and targeted legal data field extraction (FIRs, Charge Sheets, Evidence) for SIH 2026 Problem Statement 26190",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/tiff", "image/bmp"}
ALLOWED_PDF_TYPES = {"application/pdf"}

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "OCR & Legal Data Scanning Service",
        "version": "1.0.0",
        "target": "SIH 2026 - Problem Statement 26190"
    }

@app.post("/ocr/scan", response_model=OCRScanResponse)
async def scan_document(file: UploadFile = File(...)):
    """
    Accepts PDF or Image file, performs OCR text scanning,
    and returns full text + parsed legal fields (FIR No, IPC/BNS sections, dates, IO name).
    """
    filename = file.filename or "uploaded_file"
    content_type = file.content_type or ""
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    is_pdf = content_type in ALLOWED_PDF_TYPES or filename.lower().endswith(".pdf")
    is_image = content_type in ALLOWED_IMAGE_TYPES or filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp"))

    if not (is_pdf or is_image):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type '{content_type}'. Supported: PDF, PNG, JPG, JPEG, TIFF"
        )

    try:
        if is_pdf:
            extracted_text, total_pages, confidence = process_pdf_bytes(file_bytes)
            file_kind = "PDF Document"
        else:
            extracted_text, confidence = perform_ocr_on_image_bytes(file_bytes)
            total_pages = 1
            file_kind = "Image Document"

        # Parse legal fields from extracted text
        parsed_fields = extract_legal_fields(extracted_text)

        return OCRScanResponse(
            filename=filename,
            file_type=file_kind,
            total_pages=total_pages,
            extracted_text=extracted_text,
            confidence_score=confidence,
            fields=parsed_fields
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing Error: {str(e)}")

@app.post("/ocr/extract-fields", response_model=ExtractedFields)
async def extract_fields_only(file: UploadFile = File(...)):
    """
    Upload document (PDF or Image) and get back structured JSON of legal fields only.
    """
    scan_result = await scan_document(file)
    return scan_result.fields

@app.post("/ocr/search-keyword", response_model=KeywordSearchResponse)
async def search_document_keywords(
    keywords: str = Form(..., description="Comma-separated keywords to search, e.g., 'FIR,302,Weapon'"),
    file: UploadFile = File(...)
):
    """
    Upload document and search for specific target keywords, returning matched lines/snippets.
    """
    scan_result = await scan_document(file)
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]
    
    matches = search_keywords_in_text(scan_result.extracted_text, keyword_list)
    total_matches = sum(m.matches_count for m in matches)

    return KeywordSearchResponse(
        filename=scan_result.filename,
        total_matches=total_matches,
        results=matches
    )

if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
