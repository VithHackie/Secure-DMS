import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// Initialize Gemini GenAI client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Helper to execute Gemini content generation with fallback models.
 */
const callGemini = async (prompt, config = {}) => {
  if (!ai) return null;
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`[AI Service] Model '${model}' failed: ${err.message}. Trying fallback...`);
    }
  }
  return null;
};

/**
 * Extracts structured metadata (suspect names, dates, locations, crime type, etc.)
 * from raw document OCR text using Gemini LLM.
 */
export const extractFIRMetadata = async (ocrText) => {
  if (!ocrText || typeof ocrText !== "string" || ocrText.trim().length === 0) {
    return getFallbackMetadata();
  }

  if (!ai) {
    console.warn("AI Service: GEMINI_API_KEY not configured. Falling back to default metadata.");
    return getFallbackMetadata();
  }

  try {
    const prompt = `You are an expert legal data extraction assistant for Indian Police FIRs (First Information Reports), Charge Sheets, and Court Evidence Documents.
Analyze the following document OCR text and extract key investigative metadata in strict JSON format.

DOCUMENT OCR TEXT:
"""
${ocrText.substring(0, 10000)}
"""

Return ONLY a JSON object with this exact schema:
{
  "suspect_names": ["Name 1", "Name 2"],
  "complainant_name": "Name of complainant or informant",
  "dates": {
    "incident_date": "YYYY-MM-DD or string description",
    "filing_date": "YYYY-MM-DD or string description"
  },
  "location": {
    "sector": "Sector or Area name",
    "city": "City or District name",
    "police_station": "Police Station Name",
    "landmark": "Specific location landmark"
  },
  "crime_category": "Vehicle Theft | Cyber Crime | Assault | Homicide | Narcotics | Fraud | Robbery | Theft | Other",
  "stolen_items": ["Item 1", "Item 2"],
  "vehicles_involved": ["Vehicle Make / Number / Registration"],
  "bns_ipc_sections": ["Section ..."],
  "summary": "Concise 2-sentence summary of the incident described in the document."
}`;

    const responseText = await callGemini(prompt, { responseMimeType: "application/json" });
    if (!responseText) return getFallbackMetadata();

    const parsedData = JSON.parse(responseText);

    return {
      suspect_names: Array.isArray(parsedData.suspect_names) ? parsedData.suspect_names : [],
      complainant_name: parsedData.complainant_name || null,
      dates: {
        incident_date: parsedData.dates?.incident_date || null,
        filing_date: parsedData.dates?.filing_date || null,
      },
      location: {
        sector: parsedData.location?.sector || null,
        city: parsedData.location?.city || null,
        police_station: parsedData.location?.police_station || null,
        landmark: parsedData.location?.landmark || null,
      },
      crime_category: parsedData.crime_category || "Other",
      stolen_items: Array.isArray(parsedData.stolen_items) ? parsedData.stolen_items : [],
      vehicles_involved: Array.isArray(parsedData.vehicles_involved) ? parsedData.vehicles_involved : [],
      bns_ipc_sections: Array.isArray(parsedData.bns_ipc_sections) ? parsedData.bns_ipc_sections : [],
      summary: parsedData.summary || "No summary generated.",
      extracted_at: new Date().toISOString(),
      ai_model: "gemini-llm",
    };
  } catch (error) {
    console.error("Gemini FIR Metadata Extraction Error:", error?.message || error);
    return getFallbackMetadata();
  }
};

/**
 * Parses a user's natural language search query into structured search criteria.
 */
export const parseNaturalLanguageQuery = async (userQuery) => {
  if (!userQuery || typeof userQuery !== "string" || !userQuery.trim()) {
    return { crime_category: null, location_sector: null, suspect_name: null, keywords: [] };
  }

  if (!ai) {
    return {
      crime_category: null,
      location_sector: null,
      suspect_name: null,
      keywords: userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2),
    };
  }

  try {
    const prompt = `You are a search query parser for a police legal document database.
Convert the user's natural language search prompt into structured search criteria.

USER SEARCH PROMPT: "${userQuery}"

Return ONLY a JSON object with this exact schema:
{
  "crime_category": "Vehicle Theft | Cyber Crime | Assault | Homicide | Narcotics | Fraud | Robbery | Theft | null",
  "location_sector": "Extracted Sector or location string (e.g. Sector 4) or null",
  "suspect_name": "Extracted suspect or person name or null",
  "keywords": ["list", "of", "relevant", "search", "terms", "synonyms"]
}`;

    const responseText = await callGemini(prompt, { responseMimeType: "application/json" });
    if (!responseText) throw new Error("Empty LLM response");

    const parsed = JSON.parse(responseText);

    return {
      crime_category: parsed.crime_category !== "null" ? parsed.crime_category : null,
      location_sector: parsed.location_sector !== "null" ? parsed.location_sector : null,
      suspect_name: parsed.suspect_name !== "null" ? parsed.suspect_name : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [userQuery],
    };
  } catch (error) {
    console.error("Gemini Search Query Parser Error:", error?.message || error);
    return {
      crime_category: null,
      location_sector: null,
      suspect_name: null,
      keywords: userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2),
    };
  }
};

/**
 * RAG AI Document Synthesis Engine: Collects data from matching uploaded files
 * and generates a professional natural language AI response to the user's prompt.
 */
export const generateAiAnswerFromDocs = async (userQuery, documents) => {
  if (!documents || documents.length === 0) {
    return "No matching documents or records were found in the secure vault for this query.";
  }

  if (!ai) {
    const caseNumbers = documents.map(d => d.metadata?.case_number || d.case_id).filter(Boolean).join(", ");
    return `Found ${documents.length} matching document(s) in the database vault (Cases: ${caseNumbers || 'N/A'}). Configure GEMINI_API_KEY in .env for deep AI natural language narrative synthesis.`;
  }

  try {
    const docSummaries = documents.slice(0, 15).map((doc, idx) => {
      const meta = doc.metadata || {};
      const aiExt = meta.ai_extraction || {};
      return `DOCUMENT #${idx + 1}:
- File Name: ${doc.file_name || 'N/A'}
- Case Number: ${meta.case_number || doc.case_id}
- Case Title: ${meta.title || 'N/A'}
- Case Description: ${meta.description || 'N/A'}
- Document Type: ${doc.doc_type || 'N/A'}
- Crime Category: ${aiExt.crime_category || 'N/A'}
- Suspect Names: ${Array.isArray(aiExt.suspect_names) && aiExt.suspect_names.length > 0 ? aiExt.suspect_names.join(', ') : 'None listed'}
- Complainant: ${aiExt.complainant_name || 'N/A'}
- Location: Sector ${aiExt.location?.sector || 'N/A'}, City: ${aiExt.location?.city || 'N/A'}, Police Station: ${aiExt.location?.police_station || 'N/A'}
- Dates: Incident Date: ${aiExt.dates?.incident_date || 'N/A'}, Filing Date: ${aiExt.dates?.filing_date || 'N/A'}
- Legal Sections (BNS/IPC): ${Array.isArray(aiExt.bns_ipc_sections) ? aiExt.bns_ipc_sections.join(', ') : 'N/A'}
- Incident Summary: ${aiExt.summary || 'N/A'}
- Extracted Fields: ${JSON.stringify(meta.extracted_fields || {})}
`;
    }).join("\n---\n");

    const prompt = `You are an executive Legal & Investigative AI Intelligence Assistant for a Law Enforcement Digital Security Management (Secure-DSM) platform.

The user asked the following prompt:
"${userQuery}"

Here is the data collected from the matching uploaded documents and FIR files in the database vault:

${docSummaries}

INSTRUCTIONS:
1. Provide a professional, thorough, clear, and well-structured legal AI synthesis response answering the user's prompt based on the collected file data.
2. Directly cite relevant Case Numbers, Suspect Names, Locations (Sectors/Cities), Dates, FIR Categories, and Legal Sections (BNS/IPC) found in the uploaded documents.
3. Use bullet points or key takeaways if multiple documents or facts are involved.
4. Maintain a professional, executive, law-enforcement grade AI tone. Do not use generic placeholders.`;

    const aiAnswer = await callGemini(prompt);
    if (aiAnswer && aiAnswer.trim()) {
      return aiAnswer;
    }

    return `Found ${documents.length} document(s) matching your query. Key cases referenced: ${documents.map(d => d.metadata?.case_number || d.case_id).join(", ")}.`;
  } catch (error) {
    console.error("Gemini AI Synthesis Error:", error?.message || error);
    return `Found ${documents.length} document(s) matching your query. (AI synthesis temporarily unavailable: ${error?.message || 'LLM error'}).`;
  }
};

const getFallbackMetadata = () => ({
  suspect_names: [],
  complainant_name: null,
  dates: { incident_date: null, filing_date: null },
  location: { sector: null, city: null, police_station: null, landmark: null },
  crime_category: "General Evidence",
  stolen_items: [],
  vehicles_involved: [],
  bns_ipc_sections: [],
  summary: "Automated OCR scan completed. Metadata fallback active.",
  extracted_at: new Date().toISOString(),
  ai_model: "fallback",
});

