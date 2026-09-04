CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM (
    'admin', 
    'investigating_officer', 
    'court_clerk', 
    'judge'
);

CREATE TYPE case_status AS ENUM (
    'open', 
    'under_investigation', 
    'closed', 
    'archived'
);

CREATE TYPE document_type AS ENUM (
    'fir', 
    'charge_sheet', 
    'evidence', 
    'witness_statement', 
    'other'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'investigating_officer',
    badge_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status case_status NOT NULL DEFAULT 'open',
    assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    doc_type document_type NOT NULL DEFAULT 'other',
    sha256_hash CHAR(64) NOT NULL,
    previous_hash CHAR(64), -- Links to preceding document hash to form a hash-chain
    digital_signature TEXT, -- Key-signed upload payload
    metadata JSONB DEFAULT '{}'::jsonb, -- AI-extracted entities: names, locations, dates
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Logs Table (Append-Only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'LOGIN', 'UPLOAD_DOC', 'VIEW_DOC', 'TAMPER_DETECTED'
    ip_address VARCHAR(45),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & security checks
CREATE INDEX idx_cases_assigned_officer ON cases(assigned_officer_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_sha256 ON documents(sha256_hash);
CREATE INDEX idx_documents_metadata_gin ON documents USING gin(metadata);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);