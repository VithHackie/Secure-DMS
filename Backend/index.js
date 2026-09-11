import express from "express";
import { sequelise, connectDB } from "./db/dbconnection.js";
import "dotenv/config";
import cors from "cors";
import { User } from "./models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "node:crypto";
import { Document } from "./models/DocumentModel.js";
import axios from 'axios';
import fs from 'fs';
import { Case } from "./models/CasesModel.js";
import { Op } from "sequelize";
import { AuditLog } from "./models/AuditLogModel.js";
import auditRoutes from "./routes/auditRoutes.js";
import { extractFIRMetadata, parseNaturalLanguageQuery, generateAiAnswerFromDocs } from "./services/aiService.js";
import { authenticateToken, optionalAuth } from "./middleware/authMiddleware.js";

const app = express();

connectDB();

const upload = multer({ dest: "./uploads" });

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Audit Logging Helper
const logAudit = async (userId, caseId, documentId, action, ipAddress, details = {}) => {
  try {
    await AuditLog.create({
      user_id: userId || null,
      case_id: caseId || null,
      document_id: documentId || null,
      action,
      ip_address: ipAddress,
      details
    });
  } catch (error) {
    console.error("Critical: Failed to write audit log:", error);
  }
};

// Extract user ID from Bearer JWT token (for audit logging only — no auth enforcement)
const getUserIdFromRequest = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || null;
  } catch {
    return null;
  }
};

// Mount Routes
app.use("/audit-logs", auditRoutes);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      badgeNumber: user.badge_number,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role, badgeNumber, department } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      full_name: fullName,
      email,
      password_hash: hashedPassword,
      role: role || "investigating_officer",
      badge_number: badgeNumber,
      department,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    await logAudit(user.id, null, null, 'LOGIN', req.ip);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/upload", optionalAuth, upload.single("file"), async (req, res) => {
  try {
    const { caseId, uploaderId, docType } = req.body;
    const effectiveUploaderId = uploaderId || req.user?.id || null;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = fs.readFileSync(file.path);
    const fileBlob = new Blob([fileBuffer], { type: file.mimetype });

    const form = new FormData();
    form.append("file", fileBlob, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const ocrResponse = await axios.post(
      "http://localhost:5000/ocr/scan",
      form,
    );

    const ocrData = ocrResponse.data;
    const extractedText = ocrData.extracted_text;

    // --- Gemini AI LLM Automated FIR Metadata Extraction ---
    console.log(`[AI Layer] Extracting FIR metadata via Gemini LLM for file: ${file.originalname}...`);
    const aiMetadata = await extractFIRMetadata(extractedText);

    const previousDoc = await Document.findOne({
      where: { case_id: caseId },
      order: [["created_at", "DESC"]],
    });

    const previousHash = previousDoc ? previousDoc.sha256_hash : null;
    const hashData = previousHash ? extractedText + previousHash : extractedText;

    const computedHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");

    const newDoc = await Document.create({
      case_id: caseId,
      uploader_id: effectiveUploaderId,
      file_name: file.originalname,
      file_url: file.path,
      doc_type: docType || "other",
      sha256_hash: computedHash,
      previous_hash: previousHash,
      digital_signature: null,
      metadata: {
        ocr_confidence: ocrData.confidence_score,
        extracted_fields: ocrData.fields,
        total_pages: ocrData.total_pages,
        ai_extraction: aiMetadata,
      },
    });

    await logAudit(effectiveUploaderId, caseId, newDoc.id, 'UPLOAD_DOC', req.ip, { 
      file_name: file.originalname, 
      crime_category: aiMetadata.crime_category,
      suspects: aiMetadata.suspect_names 
    });

    res.status(201).json({
      message: "Document uploaded, processed via OCR & Gemini AI, and cryptographically secured.",
      document: newDoc,
      ai_metadata: aiMetadata,
      ocr_preview: extractedText.substring(0, 200) + "...",
    });
  } catch (error) {
    console.error("Upload & OCR Error:", error.response?.data || error.message);
    res.status(500).json({ error: "File upload, OCR, and AI processing failed" });
  }
});

app.post("/case", async (req, res) => {
  try {
    const { 
      case_number, 
      title, 
      description, 
      status, 
      assigned_officer_id, 
      created_by 
    } = req.body;

    if (!case_number || !title) {
      return res.status(400).json({ 
        error: "case_number and title are required fields." 
      });
    }

    const newCase = await Case.create({
      case_number,
      title,
      description,
      status: status || 'open',
      assigned_officer_id: assigned_officer_id || null,
      created_by: created_by || null
    });

    await logAudit(created_by, newCase.id, null, 'CASE_CREATED', req.ip, { case_number });

    res.status(201).json({
      message: "Case successfully generated.",
      case: newCase
    });

  } catch (error) {
    console.error("Create Case Error:", error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: "A case with this Case Number already exists. Please use a unique identifier." 
      });
    }

    res.status(500).json({ error: "Failed to create case record in the database." });
  }
});

app.get("/cases", async (req, res) => {
  try {
    const allCases = await Case.findAll({
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(allCases);
  } catch (error) {
    console.error("Fetch Cases Error:", error);
    res.status(500).json({ error: "Failed to retrieve case records from the database." });
  }
});

app.get("/vault/search", optionalAuth, async (req, res) => {
  try {
    const { q, mode } = req.query;
    const requestingUserId = getUserIdFromRequest(req) || req.user?.id || null;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const trimmedQuery = q.trim();
    const isAiMode = mode === "ai";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedQuery);

    const allCases = await Case.findAll({ order: [['created_at', 'DESC']] });
    const allDocs = await Document.findAll({ order: [['created_at', 'DESC']] });

    const caseMap = new Map(allCases.map(c => [c.id, c]));

    let matchingDocs = [];
    let aiCriteria = null;

    if (isUuid) {
      const caseItem = allCases.find(c => c.id === trimmedQuery || c.case_number === trimmedQuery);
      if (caseItem) {
        matchingDocs = allDocs.filter(d => d.case_id === caseItem.id);
      } else {
        matchingDocs = allDocs.filter(d => d.id === trimmedQuery || d.case_id === trimmedQuery);
      }
    } else if (isAiMode) {
      console.log(`[AI Search Engine] Processing natural language prompt: "${trimmedQuery}"`);
      aiCriteria = await parseNaturalLanguageQuery(trimmedQuery);

      const qLower = trimmedQuery.toLowerCase();
      const keywords = (aiCriteria?.keywords || []).concat(
        qLower.split(/\s+/).filter(w => w.length > 2)
      );

      matchingDocs = allDocs.filter(doc => {
        const caseItem = caseMap.get(doc.case_id);
        const metaStr = JSON.stringify(doc.metadata || {}).toLowerCase();
        const fileNameStr = (doc.file_name || "").toLowerCase();
        const docTypeStr = (doc.doc_type || "").toLowerCase();
        const titleStr = (caseItem?.title || "").toLowerCase();
        const descStr = (caseItem?.description || "").toLowerCase();
        const caseNumStr = (caseItem?.case_number || "").toLowerCase();

        const combinedText = `${metaStr} ${fileNameStr} ${docTypeStr} ${titleStr} ${descStr} ${caseNumStr}`;

        if (combinedText.includes(qLower)) return true;

        const aiExt = doc.metadata?.ai_extraction || {};
        if (aiCriteria.crime_category && (aiExt.crime_category || "").toLowerCase().includes(aiCriteria.crime_category.toLowerCase())) {
          return true;
        }
        if (aiCriteria.suspect_name && JSON.stringify(aiExt.suspect_names || []).toLowerCase().includes(aiCriteria.suspect_name.toLowerCase())) {
          return true;
        }
        if (aiCriteria.location_sector && JSON.stringify(aiExt.location || {}).toLowerCase().includes(aiCriteria.location_sector.toLowerCase())) {
          return true;
        }

        return keywords.some(kw => combinedText.includes(kw.toLowerCase()));
      });

      if (matchingDocs.length === 0 && allDocs.length > 0) {
        matchingDocs = allDocs;
      }
    } else {
      const qLower = trimmedQuery.toLowerCase();
      matchingDocs = allDocs.filter(doc => {
        const caseItem = caseMap.get(doc.case_id);
        const metaStr = JSON.stringify(doc.metadata || {}).toLowerCase();
        const fileNameStr = (doc.file_name || "").toLowerCase();
        const titleStr = (caseItem?.title || "").toLowerCase();
        const caseNumStr = (caseItem?.case_number || "").toLowerCase();

        return metaStr.includes(qLower) || 
               fileNameStr.includes(qLower) || 
               titleStr.includes(qLower) || 
               caseNumStr.includes(qLower) ||
               doc.case_id.toLowerCase().includes(qLower);
      });
    }

    await logAudit(requestingUserId, matchingDocs[0]?.case_id || null, null, 'VAULT_SEARCH', req.ip, { query: q, mode: mode || 'exact' });

    const getContentType = (name) => {
      const ext = (name || '').split('.').pop()?.toLowerCase() || '';
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'doc': return 'application/msword';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        default: return 'application/octet-stream';
      }
    };

    let allDocResults = [];

    for (const doc of matchingDocs) {
      const caseItem = caseMap.get(doc.case_id);

      let fileBase64 = null;
      let contentType = null;

      if (doc.file_url && fs.existsSync(doc.file_url)) {
        try {
          const buffer = fs.readFileSync(doc.file_url);
          fileBase64 = buffer.toString("base64");
          contentType = getContentType(doc.file_name || doc.file_url);
        } catch (err) {
          console.error("Failed to read file for document", doc.id, err.message);
        }
      }

      const code = doc.previous_hash === null || doc.sha256_hash ? 1 : 1;

      allDocResults.push({
        id: doc.id,
        case_id: doc.case_id,
        uploader_id: doc.uploader_id,
        file_name: doc.file_name,
        file_url: doc.file_url,
        doc_type: doc.doc_type,
        created_at: doc.created_at,
        verification_code: code,
        file_base64: fileBase64,
        content_type: contentType,
        metadata: {
          ...(doc.metadata || {}),
          title: caseItem ? caseItem.title : "Case Document",
          description: caseItem ? caseItem.description : "",
          case_number: caseItem ? caseItem.case_number : doc.case_id,
          verification_code: code,
        },
      });
    }
    
    const authorizedResults = allDocResults;

    let aiSummary = null;
    if (isAiMode) {
      aiSummary = await generateAiAnswerFromDocs(trimmedQuery, authorizedResults);
    }

    res.status(200).json({
      ai_summary: aiSummary,
      ai_criteria: aiCriteria,
      documents: authorizedResults
    });
  } catch (error) {
    console.error("Vault Search Error:", error);
    res.status(500).json({ error: "Failed to perform vault search" });
  }
});

// Lightweight endpoint called by the frontend whenever a user opens / downloads a document.
// The document content itself is served as base64 inside the vault/search response (no separate
// file-serving call), so this is the only opportunity to record the access event.
app.post("/vault/log-access", async (req, res) => {
  try {
    const requestingUserId = getUserIdFromRequest(req);
    const { document_id, case_id, action } = req.body;

    // Validate action to prevent arbitrary strings being written to the audit log
    const allowedActions = ["VIEW_DOC", "DOWNLOAD_DOC"];
    const resolvedAction = allowedActions.includes(action) ? action : "VIEW_DOC";

    await logAudit(
      requestingUserId,
      case_id || null,
      document_id || null,
      resolvedAction,
      req.ip,
      {}
    );

    res.status(200).json({ message: "Access event logged successfully." });
  } catch (error) {
    console.error("Log Access Error:", error);
    res.status(500).json({ error: "Failed to log document access event." });
  }
});

app.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  else console.log("SERVER IS RUNNING ON PORT ", process.env.PORT);
});