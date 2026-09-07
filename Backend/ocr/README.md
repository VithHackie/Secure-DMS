# OCR & Legal Data Extraction Microservice (SIH 2026 - Problem 26190)

This module provides high-accuracy OCR (Optical Character Recognition) text scanning and legal data extraction (FIR numbers, IPC/BNS sections, dates, IO names, accused details) from uploaded PDFs and images.

---

## Features
- **PDF & Image Support**: Handles `.pdf`, `.png`, `.jpg`, `.jpeg`, `.tiff` formats.
- **OpenCV Image Cleaning**: Auto-binarizes, denoises, and deskews poorly scanned paper documents & photos.
- **Tesseract & PyMuPDF Engine**: Extracts searchable digital text directly or performs OCR on scanned pages.
- **Targeted Field Extraction**: Automatically extracts FIR Numbers, IPC/BNS Sections, Filing/Incident Dates, Police Station, District, Complainant, Accused, and IO names.
- **Keyword Snippet Search**: Search for specific custom keywords inside scanned documents.

---

## Prerequisites

1. **Python 3.9+** installed on system.
2. **Tesseract OCR Binary** installed on host machine:
   - **Windows**: Install using winget:
     ```bash
     winget install UB-Mannheim.TesseractOCR
     ```
     Or download installer from [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki).
   - **Linux / Ubuntu**:
     ```bash
     sudo apt-get update && sudo apt-get install -y tesseract-ocr
     ```

---

## Setup & Installation

Navigate to the `ocr` directory:
```bash
cd Backend/ocr
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

Install requirements:
```bash
pip install -r requirements.txt
```

---

## Running the Service

Start the FastAPI microservice:
```bash
python main.py
```
or via Uvicorn:
```bash
uvicorn main:app --reload --port 5000
```

The service will run on `http://localhost:5000`. You can test interactive API documentation in your browser at `http://localhost:5000/docs`.

---

## API Endpoints

### 1. Health Check
`GET /`
- **Response**: `{"status": "online", "service": "OCR & Legal Data Scanning Service"}`

### 2. Full OCR Scan & Field Extraction
`POST /ocr/scan`
- **Form Data**: `file` (PDF or Image file)
- **Response**:
  ```json
  {
    "filename": "fir_scan_104.pdf",
    "file_type": "PDF Document",
    "total_pages": 1,
    "extracted_text": "FIRST INFORMATION REPORT ...",
    "confidence_score": 92.5,
    "fields": {
      "fir_number": "104/2024",
      "sections_of_law": ["302 IPC", "376 IPC"],
      "police_station": "Central Police Station",
      "district": "New Delhi",
      "date_of_filing": "12/05/2024",
      "complainant_name": "Ramesh Kumar",
      "accused_name": "Unknown",
      "investigating_officer": "Insp. Rajesh Sharma"
    }
  }
  ```

### 3. Extract Fields Only
`POST /ocr/extract-fields`
- **Form Data**: `file` (PDF or Image file)
- **Response**: Extracted JSON object of legal fields.

### 4. Search Custom Keywords
`POST /ocr/search-keyword`
- **Form Data**: `file`, `keywords` (comma-separated, e.g., `"FIR,302,Seized"`)
- **Response**: Matched lines and snippet locations.

---

## Quick CLI Testing

You can test OCR on any local file without starting the server:
```bash
python test_ocr.py path/to/sample_fir.pdf
```

---

## Integration with Express Backend (Optional)

To call this OCR service from your Node.js Express backend when an authorized user requests OCR, make a simple HTTP multipart request to `http://localhost:5000/ocr/scan` using `axios` or `fetch`.
