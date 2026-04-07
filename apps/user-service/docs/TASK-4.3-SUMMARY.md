# Task 4.3 - Application Documents (Folders + Files) - Implementation Summary

## ✅ Completed Features

### 1. Prisma Schema Updates

#### ApplicationBundle Model
```prisma
model ApplicationBundle {
  id            String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId        String   @db.Uuid
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name          String
  slug          String
  description   String?  @db.Text
  
  createdAt     DateTime @default(now()) @db.Timestamptz
  updatedAt     DateTime @updatedAt @db.Timestamptz

  documents     ApplicationDocument[]

  @@unique([userId, slug])
  @@index([userId])
  @@index([slug])
  @@map("application_bundles")
}
```

**Features:**
- ✅ `name` - Bundle name (e.g., "MERN Stack JS")
- ✅ `slug` - Auto-generated URL-friendly identifier
- ✅ `description` - Optional bundle description
- ✅ Unique constraint on [userId, slug]
- ✅ Cascade delete to documents

#### ApplicationDocument Model
```prisma
model ApplicationDocument {
  id            String                  @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  bundleId      String                  @db.Uuid
  bundle        ApplicationBundle       @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  
  type          ApplicationDocumentType
  filename      String
  s3Key         String
  s3Url         String
  fileSize      Int
  mimeType      String
  
  createdAt     DateTime                @default(now()) @db.Timestamptz
  updatedAt     DateTime                @updatedAt @db.Timestamptz

  @@index([bundleId])
  @@index([type])
  @@map("application_documents")
}

enum ApplicationDocumentType {
  CV
  COVER_LETTER
  PORTFOLIO
  OTHER
}
```

**Features:**
- ✅ `bundleId` - Reference to parent bundle
- ✅ `type` - Document type enum (CV, COVER_LETTER, PORTFOLIO, OTHER)
- ✅ `filename` - Original filename
- ✅ `s3Key` - S3 object key
- ✅ `s3Url` - Public S3 URL
- ✅ `fileSize` - File size in bytes
- ✅ `mimeType` - MIME type for validation

### 2. AWS S3 Integration

#### S3Service Features
- ✅ **@aws-sdk/client-s3** integration
- ✅ **Presigned URL generation** for uploads (1h expiry)
- ✅ **Presigned URL generation** for downloads (1h expiry)
- ✅ **File deletion** from S3
- ✅ **S3 key generation** with structure: `users/{userId}/bundles/{bundleId}/{timestamp}-{filename}`
- ✅ **Public URL generation**
- ✅ **Configuration** via environment variables

#### File Upload Flow (Presigned URL)
1. Client requests upload URL with file metadata
2. Server validates file (type, size)
3. Server generates S3 key and presigned URL
4. Server creates document record in database
5. Client uploads directly to S3 using presigned URL
6. File is stored securely in S3

#### File Validation
- ✅ **Max file size:** 10MB per file
- ✅ **Allowed types:** PDF, DOC, DOCX
- ✅ **MIME types:**
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 3. API Endpoints

#### Bundle Management
```
POST   /bundles                    - Create bundle
GET    /bundles                    - List all bundles with document count
GET    /bundles/:id                - Get bundle by ID
PATCH  /bundles/:id                - Update bundle
DELETE /bundles/:id                - Delete bundle + all documents (S3 cleanup)
```

#### Document Management
```
POST   /bundles/:id/documents                      - Upload file (presigned URL flow)
GET    /bundles/:id/documents                      - List documents in bundle
GET    /bundles/:id/documents/:documentId          - Get document by ID
GET    /bundles/:id/documents/:documentId/download - Generate download URL
DELETE /bundles/:id/documents/:documentId          - Delete document (S3 cleanup)
```

**Total: 10 endpoints** ✅

### 4. Business Logic

#### Bundle Service Features
- ✅ **Create bundle** with auto-generated slug
- ✅ **List bundles** with document count
- ✅ **Update bundle** (name, description)
- ✅ **Delete bundle** with S3 cleanup (cascade delete all documents)
- ✅ **Slug generation** from bundle name
- ✅ **Duplicate prevention** (unique slug per user)
- ✅ **Ownership verification** on all operations

#### Document Service Features
- ✅ **Generate presigned upload URL**
- ✅ **File validation** (size, type)
- ✅ **Create document record**
- ✅ **List documents** in bundle
- ✅ **Generate presigned download URL** (1h expiry)
- ✅ **Delete document** with S3 cleanup
- ✅ **S3 key generation** with timestamp

### 5. Security Features

#### Access Control
- ✅ **JWT authentication** required on all endpoints
- ✅ **Ownership verification** - users can only access their own bundles
- ✅ **Forbidden access** returns 403
- ✅ **Not found** returns 404

#### File Security
- ✅ **Presigned URLs** for secure upload/download
- ✅ **1-hour expiry** on presigned URLs
- ✅ **File type validation** (only PDF, DOC, DOCX)
- ✅ **File size limit** (10MB max)
- ✅ **S3 bucket isolation** per user/bundle

#### Data Integrity
- ✅ **Cascade delete** - deleting bundle removes all documents
- ✅ **S3 cleanup** - files deleted from S3 when document/bundle deleted
- ✅ **Transaction safety** - database and S3 operations coordinated

### 6. DTOs & Validation

#### CreateBundleDto
```typescript
{
  name: string;        // Required, 3-100 chars
  description?: string; // Optional, max 500 chars
}
```

#### UpdateBundleDto
```typescript
{
  name?: string;
  description?: string;
}
```

#### UploadDocumentDto
```typescript
{
  type: ApplicationDocumentType; // CV, COVER_LETTER, PORTFOLIO, OTHER
  filename: string;
  mimeType: string;
  fileSize: number;
}
```

#### Response DTOs
- ✅ **BundleResponse** - Bundle with document count
- ✅ **DocumentResponse** - Document details
- ✅ **PresignedUrlResponse** - Upload URL with expiry
- ✅ **DownloadUrlResponse** - Download URL with expiry

### 7. AWS Configuration

#### Required Environment Variables
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=ostora-documents
```

#### S3 Bucket Structure
```
ostora-documents/
└── users/
    └── {userId}/
        └── bundles/
            └── {bundleId}/
                ├── {timestamp}-resume.pdf
                ├── {timestamp}-cover-letter.docx
                └── {timestamp}-portfolio.pdf
```

## 📁 Files Created

```
apps/user-service/src/
└── bundle/
    ├── dto/
    │   ├── create-bundle.dto.ts
    │   ├── update-bundle.dto.ts
    │   ├── upload-document.dto.ts
    │   └── bundle.response.ts
    ├── bundle.controller.ts
    ├── bundle.service.ts
    ├── bundle.module.ts
    └── s3.service.ts

prisma/schema.prisma (updated)
apps/user-service/src/app.module.ts (updated)
```

**Total: 9 files created/modified** ✅

## 🔄 Upload Flow Example

### Step 1: Request Upload URL
```http
POST /bundles/{bundleId}/documents
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "type": "CV",
  "filename": "john-doe-resume.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1024000
}
```

### Step 2: Server Response
```json
{
  "uploadUrl": "https://ostora-documents.s3.amazonaws.com/users/.../...",
  "key": "users/{userId}/bundles/{bundleId}/1234567890-john-doe-resume.pdf",
  "expiresIn": 3600,
  "document": {
    "id": "uuid",
    "bundleId": "uuid",
    "type": "CV",
    "filename": "john-doe-resume.pdf",
    "s3Key": "users/.../...",
    "s3Url": "https://...",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Step 3: Client Upload to S3
```http
PUT {uploadUrl}
Content-Type: application/pdf
Content-Length: 1024000

[Binary file data]
```

## 🔄 Download Flow Example

### Step 1: Request Download URL
```http
GET /bundles/{bundleId}/documents/{documentId}/download
Authorization: Bearer {jwt-token}
```

### Step 2: Server Response
```json
{
  "downloadUrl": "https://ostora-documents.s3.amazonaws.com/users/...?X-Amz-...",
  "expiresIn": 3600
}
```

### Step 3: Client Downloads from S3
```http
GET {downloadUrl}
```

## 🗑️ Delete Flow

### Delete Document
```http
DELETE /bundles/{bundleId}/documents/{documentId}
Authorization: Bearer {jwt-token}
```
- ✅ Deletes file from S3
- ✅ Deletes record from database

### Delete Bundle
```http
DELETE /bundles/{bundleId}
Authorization: Bearer {jwt-token}
```
- ✅ Deletes all files from S3
- ✅ Deletes all document records
- ✅ Deletes bundle record

## 🎯 Key Features

### 1. Presigned URL Flow
- ✅ **Secure uploads** - Client uploads directly to S3
- ✅ **No server bandwidth** - Files don't pass through server
- ✅ **Time-limited** - URLs expire after 1 hour
- ✅ **Authenticated** - Only authorized users can generate URLs

### 2. File Management
- ✅ **10MB limit** per file
- ✅ **PDF, DOC, DOCX** support
- ✅ **Automatic cleanup** on delete
- ✅ **Organized structure** in S3

### 3. Bundle Organization
- ✅ **Logical grouping** - Documents organized in bundles
- ✅ **Named bundles** - e.g., "MERN Stack JS", "Python Backend"
- ✅ **Slug-based URLs** - SEO-friendly identifiers
- ✅ **Document count** - Track files per bundle

### 4. AWS Integration
- ✅ **@aws-sdk/client-s3** - Modern AWS SDK v3
- ✅ **Presigned URLs** - Secure temporary access
- ✅ **S3 operations** - Upload, download, delete
- ✅ **Environment config** - Flexible deployment

## 📊 Example Usage

### Create Bundle
```bash
curl -X POST http://localhost:4719/bundles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MERN Stack JS",
    "description": "Documents for MERN stack positions"
  }'
```

### Upload Document
```bash
# Step 1: Get presigned URL
curl -X POST http://localhost:4719/bundles/{id}/documents \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CV",
    "filename": "resume.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024000
  }'

# Step 2: Upload to S3 using presigned URL
curl -X PUT "{uploadUrl}" \
  -H "Content-Type: application/pdf" \
  --data-binary @resume.pdf
```

### List Bundles
```bash
curl -X GET http://localhost:4719/bundles \
  -H "Authorization: Bearer {token}"
```

### Download Document
```bash
# Step 1: Get download URL
curl -X GET http://localhost:4719/bundles/{id}/documents/{docId}/download \
  -H "Authorization: Bearer {token}"

# Step 2: Download from S3
curl -X GET "{downloadUrl}" -o resume.pdf
```

### Delete Bundle
```bash
curl -X DELETE http://localhost:4719/bundles/{id} \
  -H "Authorization: Bearer {token}"
```

## 🚀 Next Steps

### 1. Run Prisma Migration
```bash
npx prisma migrate dev --name add_application_bundles_documents
npx prisma generate
```

### 2. Install AWS SDK
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 3. Configure AWS
```bash
# Add to .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=ostora-documents
```

### 4. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://ostora-documents --region us-east-1

# Configure CORS
aws s3api put-bucket-cors --bucket ostora-documents --cors-configuration file://cors.json
```

### 5. Test Endpoints
```bash
# Start service
npm run start:user

# Access Swagger
http://localhost:4719/api/docs
```

## 🎉 Key Achievements

1. ✅ **ApplicationBundle model** with name, slug, description
2. ✅ **ApplicationDocument model** with S3 integration
3. ✅ **Presigned URL flow** for secure uploads
4. ✅ **Presigned URL flow** for secure downloads (1h expiry)
5. ✅ **File validation** - 10MB max, PDF/DOC/DOCX only
6. ✅ **S3 cleanup** on delete operations
7. ✅ **Bundle CRUD** with document management
8. ✅ **@aws-sdk/client-s3** integration
9. ✅ **JWT authentication** on all endpoints
10. ✅ **Swagger documentation**

## 📝 Commit Messages

```bash
feat(USER-3): ApplicationBundle and ApplicationDocument models
feat(USER-3): S3 upload with presigned URL flow via @aws-sdk
feat(USER-3): bundle CRUD with document management
```

## 🔒 Security Considerations

1. **Presigned URLs** - Time-limited access (1 hour)
2. **File validation** - Type and size checks
3. **Ownership verification** - Users can only access their bundles
4. **S3 bucket policies** - Restrict public access
5. **JWT authentication** - All endpoints protected
6. **Cascade delete** - Automatic cleanup
7. **CORS configuration** - Restrict origins

## 📈 Performance Optimizations

1. **Direct S3 upload** - No server bandwidth usage
2. **Presigned URLs** - Offload to AWS
3. **Indexed queries** - Fast database lookups
4. **Batch delete** - Efficient S3 cleanup
5. **Document count** - Cached in query

## ✅ Task 4.3 - COMPLETE

All requirements implemented:
- ✅ ApplicationBundle model (name, slug, description)
- ✅ ApplicationDocument model (bundleId, type, filename, s3Key, s3Url, fileSize, mimeType)
- ✅ POST /bundles → create bundle
- ✅ POST /bundles/:id/documents → upload file (presigned URL flow)
- ✅ GET /bundles → list bundles with document count
- ✅ GET /bundles/:id/documents → list documents in bundle
- ✅ DELETE /bundles/:id → delete bundle + S3 cleanup
- ✅ @aws-sdk/client-s3 integration
- ✅ Max 10MB per file
- ✅ PDF/DOC/DOCX support
- ✅ Presigned URL for download (1h expiry)
