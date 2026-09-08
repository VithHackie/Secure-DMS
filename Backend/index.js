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
import axios from 'axios'
import fs from 'fs'
import path from 'path';
import { Case } from "./models/CasesModel.js";

const app = express();

connectDB();

const upload = multer({ dest: "./uploads" });

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      badgeNumber: user.badge_number,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }, // Token expires in 24 hours
  );
};

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role, badgeNumber, department } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Postgres via Sequelize
    const newUser = await User.create({
      full_name: fullName,
      email,
      password_hash: hashedPassword,
      role: role || "investigating_officer",
      badge_number: badgeNumber,
      department,
    });

    // Generate JWT
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

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Validate password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = generateToken(user);

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

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { caseId, uploaderId, docType } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Read physical file data
    const fileBuffer = fs.readFileSync(file.path);

    const fileBlob = new Blob([fileBuffer], { type: file.mimetype });

    // 2. Forward file to Python OCR Microservice
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

    // 3. Fetch the most recent document for this specific case
    const previousDoc = await Document.findOne({
      where: { case_id: caseId },
      order: [["created_at", "DESC"]],
    });

    // 4. Extract the previous hash (if a document exists)
    const previousHash = previousDoc ? previousDoc.sha256_hash : null;

    // 5. Compute Hash: SHA256(Current OCR Generated Text + Previous Hash)
    const hashData = previousHash
      ? extractedText + previousHash
      : extractedText;

    const computedHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");

    // 6. Save to database using exact schema columns, injecting OCR data into metadata
    const newDoc = await Document.create({
      case_id: caseId,
      uploader_id: uploaderId,
      file_name: file.originalname,
      file_url: file.path,
      doc_type: docType || "other",
      sha256_hash: computedHash,
      previous_hash: previousHash,
      digital_signature: null, // Placeholder for Phase 3
      metadata: {
        ocr_confidence: ocrData.confidence_score,
        extracted_fields: ocrData.fields,
        total_pages: ocrData.total_pages,
      },
    });

    res.status(201).json({
      message:
        "Document uploaded, processed via OCR, and cryptographically secured.",
      document: newDoc,
      ocr_preview: extractedText.substring(0, 200) + "...",
    });
  } catch (error) {
    console.error("Upload & OCR Error:", error.response?.data || error.message);
    res.status(500).json({ error: "File upload and OCR processing failed" });
  }
});

app.post("/case", async (req, res)=>{
  try {
    // 1. Destructure the exact keys sent by the React frontend payload
    const { 
      case_number, 
      title, 
      description, 
      status, 
      assigned_officer_id, 
      created_by 
    } = req.body;

    // 2. Validate mandatory fields
    if (!case_number || !title) {
      return res.status(400).json({ 
        error: "case_number and title are required fields." 
      });
    }

    // 3. Save to database
    const newCase = await Case.create({
      case_number,
      title,
      description,
      status: status || 'open',
      assigned_officer_id: assigned_officer_id || null,
      created_by: created_by || null
    });

    // 4. Return success response containing the new auto-generated UUID
    res.status(201).json({
      message: "Case successfully generated.",
      case: newCase
    });

  } catch (error) {
    console.error("Create Case Error:", error);

    // Specifically catch PostgreSQL UNIQUE constraint violations (e.g. duplicate case_number)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: "A case with this Case Number already exists. Please use a unique identifier." 
      });
    }

    res.status(500).json({ error: "Failed to create case record in the database." });
  }
})

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve("uploads")));

// Add this route below your POST /case endpoint
app.get("/cases", async (req, res) => {
  try {
    // Fetch all cases from the database
    const allCases = await Case.findAll({
      order: [['created_at', 'DESC']] // Newest cases appear first
    });

    res.status(200).json(allCases);
  } catch (error) {
    console.error("Fetch Cases Error:", error);
    res.status(500).json({ error: "Failed to retrieve case records from the database." });
  }
});

// Fetch all documents associated with a specific case
app.get("/cases/:caseId/documents", async (req, res) => {
  try {
    const { caseId } = req.params;
    const documents = await Document.findAll({
      where: { case_id: caseId },
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(documents);
  } catch (error) {
    console.error("Fetch Case Documents Error:", error);
    res.status(500).json({ error: "Failed to retrieve documents for this case." });
  }
});

// Fetch metadata for a single document
app.get("/documents/:id", async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.status(200).json(doc);
  } catch (error) {
    console.error("Fetch Document Error:", error);
    res.status(500).json({ error: "Failed to retrieve document details" });
  }
});

// Stream or serve physical document file (PDF viewer support)
app.get("/documents/:id/file", async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document record not found" });
    }

    const filePath = path.resolve(doc.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Physical file not found on server storage" });
    }

    const fileName = doc.file_name || "document.pdf";
    const ext = path.extname(fileName).toLowerCase();

    let contentType = "application/pdf";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".txt") contentType = "text/plain";
    else if (ext === ".doc" || ext === ".docx") contentType = "application/msword";
    else contentType = "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Stream Document File Error:", error);
    res.status(500).json({ error: "Failed to stream document file" });
  }
});

app.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  else console.log("SERVER IS RUNNING ON PORT ", process.env.PORT);
});
