import sys
import os
from ocr_engine import perform_ocr_on_image_bytes, process_pdf_bytes
from field_extractor import extract_legal_fields

def run_test(file_path: str):
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    print(f"\n==================================================")
    print(f" TESTING OCR ON FILE: {file_path}")
    print(f"==================================================\n")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    is_pdf = file_path.lower().endswith(".pdf")

    if is_pdf:
        print("[INFO] Processing as PDF document...")
        text, total_pages, conf = process_pdf_bytes(file_bytes)
        print(f"[INFO] Pages: {total_pages} | Confidence: {conf}%")
    else:
        print("[INFO] Processing as Image document...")
        text, conf = perform_ocr_on_image_bytes(file_bytes)
        print(f"[INFO] Pages: 1 | Confidence: {conf}%")

    print("\n----------------- EXTRACTED TEXT -----------------")
    print(text[:1000] + ("..." if len(text) > 1000 else ""))
    print("--------------------------------------------------")

    print("\n-------------- PARSED LEGAL FIELDS ---------------")
    fields = extract_legal_fields(text)
    print(f"FIR Number          : {fields.fir_number}")
    print(f"Sections of Law     : {fields.sections_of_law}")
    print(f"Police Station      : {fields.police_station}")
    print(f"District            : {fields.district}")
    print(f"Date of Filing      : {fields.date_of_filing}")
    print(f"Date of Incident    : {fields.date_of_incident}")
    print(f"Complainant Name    : {fields.complainant_name}")
    print(f"Accused Name        : {fields.accused_name}")
    print(f"Investigating Officer: {fields.investigating_officer}")
    print("==================================================\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_test(sys.argv[1])
    else:
        print("Usage: python test_ocr.py <path_to_image_or_pdf>")
