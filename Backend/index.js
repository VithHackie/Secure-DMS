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

app.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  else console.log("SERVER IS RUNNING ON PORT ", process.env.PORT);
});
