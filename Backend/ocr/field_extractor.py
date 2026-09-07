import re
from typing import Dict, List, Optional
from schemas import ExtractedFields, KeywordSearchMatch

def extract_legal_fields(text: str) -> ExtractedFields:
    """
    Parses document text using regex heuristics to extract targeted Indian legal & police document data.
    """
    fields = ExtractedFields()

    # 1. FIR / Crime / Case Number regex pattern
    fir_pattern = r"(?:FIR\s*(?:No|Num|Number)?|Crime\s*(?:No|Num|Number)?|Case\s*(?:No|Num|Number)?)\s*[:.\-]?\s*([A-Za-z0-9\/\-]+)"
    fir_match = re.search(fir_pattern, text, re.IGNORECASE)
    if fir_match:
        fields.fir_number = fir_match.group(1).strip()

    # 2. IPC / BNS / Law Sections regex pattern (e.g. U/S 302, 376 IPC or Section 103 BNS)
    sections_pattern = r"(?:u\/s|under\s+section|sec|section|sections)\s*[:.\-]?\s*([0-9A-Za-z\s,\/\&]+?)(?=\s+(?:IPC|BNS|CrPC|BNSS|Act|of|and|$|\n))"
    sections = re.findall(sections_pattern, text, re.IGNORECASE)
    cleaned_sections = []
    for s in sections:
        sec_str = s.strip()
        if len(sec_str) > 1 and len(sec_str) < 50:
            cleaned_sections.append(sec_str)
    fields.sections_of_law = list(set(cleaned_sections))

    # 3. Police Station
    ps_pattern = r"(?:Police\s+Station|P\.S\.|PS)\s*[:.\-]?\s*([A-Za-z\s]+?)(?=\s+(?:District|Dist|Date|FIR|\n|$))"
    ps_match = re.search(ps_pattern, text, re.IGNORECASE)
    if ps_match:
        fields.police_station = ps_match.group(1).strip()

    # 4. District
    dist_pattern = r"(?:District|Dist\.)\s*[:.\-]?\s*([A-Za-z\s]+?)(?=\s+(?:State|P\.S\.|Date|\n|$))"
    dist_match = re.search(dist_pattern, text, re.IGNORECASE)
    if dist_match:
        fields.district = dist_match.group(1).strip()

    # 5. Dates (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
    date_pattern = r"\b(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})\b"
    dates_found = re.findall(date_pattern, text)
    if dates_found:
        fields.date_of_filing = dates_found[0]
        if len(dates_found) > 1:
            fields.date_of_incident = dates_found[1]

    # 6. Complainant / Informant
    complainant_pattern = r"(?:Complainant|Informant)\s*[:.\-]?\s*([A-Za-z\s\.]+?)(?=\s+(?:S\/o|D\/o|W\/o|Residing|Address|Accused|\n|$))"
    comp_match = re.search(complainant_pattern, text, re.IGNORECASE)
    if comp_match:
        fields.complainant_name = comp_match.group(1).strip()

    # 7. Accused
    accused_pattern = r"(?:Accused|Details\s+of\s+Accused)\s*[:.\-]?\s*([A-Za-z\s\.]+?)(?=\s+(?:S\/o|D\/o|W\/o|Residing|Address|\n|$))"
    accused_match = re.search(accused_pattern, text, re.IGNORECASE)
    if accused_match:
        fields.accused_name = accused_match.group(1).strip()

    # 8. Investigating Officer (I.O.)
    io_pattern = r"(?:Investigating\s+Officer|I\.O\.|IO\s+Name)\s*[:.\-]?\s*([A-Za-z\s\.]+?)(?=\s+(?:Rank|Badge|Designation|\n|$))"
    io_match = re.search(io_pattern, text, re.IGNORECASE)
    if io_match:
        fields.investigating_officer = io_match.group(1).strip()

    return fields

def search_keywords_in_text(text: str, keywords: List[str]) -> List[KeywordSearchMatch]:
    """
    Searches for specific requested keywords inside extracted document text
    and returns matching snippets for authorized inspection.
    """
    lines = text.split("\n")
    results = []

    for kw in keywords:
        kw_clean = kw.strip()
        if not kw_clean:
            continue
        
        kw_pattern = re.compile(re.escape(kw_clean), re.IGNORECASE)
        snippets = []

        for line in lines:
            if kw_pattern.search(line):
                snippets.append(line.strip())

        results.append(
            KeywordSearchMatch(
                keyword=kw_clean,
                matches_count=len(snippets),
                found_snippets=snippets[:10]  # Return top 10 matching snippet lines
            )
        )

    return results
