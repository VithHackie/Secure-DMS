import io
import os
import cv2
import fitz  # PyMuPDF
import numpy as np
from PIL import Image
import pytesseract
from typing import Tuple, List

# If Tesseract binary path is specified in environment or default Windows install path
DEFAULT_TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(DEFAULT_TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = DEFAULT_TESSERACT_CMD
elif "TESSERACT_CMD" in os.environ:
    pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]

def preprocess_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Applies OpenCV preprocessing to clean up scanned documents and photos.
    - Grayscale conversion
    - Noise reduction using Bilateral Filter
    - Adaptive Otsu Thresholding for crisp contrast
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        # Fallback using PIL if OpenCV decode fails
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Noise Removal / Smooth
    blurred = cv2.bilateralFilter(gray, 9, 75, 75)

    # 3. Adaptive Binarization / Thresholding
    thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    return thresh

def perform_ocr_on_image_bytes(image_bytes: bytes) -> Tuple[str, float]:
    """
    Runs Tesseract OCR on raw image bytes with OpenCV preprocessing.
    Returns (extracted_text, average_confidence).
    """
    processed_img = preprocess_image_bytes(image_bytes)
    
    # Get detailed OCR data including confidence scores
    data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
    
    texts = []
    confidences = []
    
    for i in range(len(data['text'])):
        text_str = data['text'][i].strip()
        conf = float(data['conf'][i])
        
        if text_str:
            texts.append(text_str)
            if conf > 0:
                confidences.append(conf)
                
    full_text = pytesseract.image_to_string(processed_img, lang='eng')
    avg_conf = sum(confidences) / len(confidences) if confidences else 85.0

    return full_text.strip(), round(avg_conf, 2)

def process_pdf_bytes(pdf_bytes: bytes) -> Tuple[str, int, float]:
    """
    Extracts text from PDF.
    First attempts native digital text extraction via PyMuPDF (fitz).
    If native text is sparse (scanned PDF), renders pages to high-res images and performs OCR.
    Returns (combined_text, total_pages, avg_confidence).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    page_texts: List[str] = []
    confidence_scores: List[float] = []

    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text("text").strip()

        # If digital text exists and has sufficient length (> 50 chars), use it directly
        if len(text) > 50:
            page_texts.append(text)
            confidence_scores.append(98.0)
        else:
            # Scanned page - render page to image at 300 DPI for high quality OCR
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            ocr_text, conf = perform_ocr_on_image_bytes(img_bytes)
            page_texts.append(ocr_text)
            confidence_scores.append(conf)

    combined_text = "\n\n--- Page Break ---\n\n".join(page_texts)
    avg_conf = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0

    return combined_text.strip(), total_pages, round(avg_conf, 2)
