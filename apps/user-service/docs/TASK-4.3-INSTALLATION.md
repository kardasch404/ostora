# Task 4.3 - Installation Instructions

## Required Dependencies

The following AWS SDK packages need to be installed:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Package Versions
- `@aws-sdk/client-s3`: ^3.490.0 (or latest)
- `@aws-sdk/s3-request-presigner`: ^3.490.0 (or latest)

## Environment Variables

Add the following to your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=ostora-documents
```

## AWS S3 Bucket Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://ostora-documents --region us-east-1
```

### 2. Configure CORS (cors.json)
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 3. Apply CORS Configuration
```bash
aws s3api put-bucket-cors --bucket ostora-documents --cors-configuration file://cors.json
```

### 4. Configure Bucket Policy (Optional - for public read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ostora-documents/*"
    }
  ]
}
```

## Database Migration

Run the Prisma migration to create the new tables:

```bash
npx prisma migrate dev --name add_application_bundles_documents
npx prisma generate
```

## Testing

Start the user service:
```bash
npm run start:user
```

Access Swagger documentation:
```
http://localhost:4719/api/docs
```

## Notes

- Presigned URLs expire after 1 hour
- Maximum file size: 10MB
- Allowed file types: PDF, DOC, DOCX
- Files are organized in S3 by user and bundle
