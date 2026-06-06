# ID Generator Backend

Express/MongoDB backend for template management, generated card records, image upload conversion, and Google Form driven DigiVal ID card generation.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
npm install
copy .env.example .env
npm run dev
```

## Required Environment Variables

```txt
MONGO_URI=your MongoDB connection string
WEBHOOK_SECRET=a long random secret shared with Apps Script
APP_BASE_URL=https://id-generator-backend-jet.vercel.app
EMAIL_USER=your Gmail address
EMAIL_PASS=your Gmail app password
CLIENT_URL=http://localhost:5175
CLIENT_URLS=http://localhost:5173,http://localhost:5175
```

Use a Gmail app password for `EMAIL_PASS`; a normal Gmail account password will not work with Nodemailer.

## Google Form Endpoint

```txt
POST https://id-generator-backend-jet.vercel.app/api/google-form/digival-card
```

Required header:

```txt
x-webhook-secret: same value as WEBHOOK_SECRET
```

Required JSON fields:

```json
{
  "name": "Employee Name",
  "employeeId": "EMP001",
  "bloodGroup": "O+",
  "phone": "9876543210",
  "email": "employee@example.com",
  "photoBase64": "base64 image data or data:image/png;base64,...",
  "photoMimeType": "image/png",
  "submissionId": "unique google sheet row id"
}
```

The Apps Script copy is in:

```txt
backend/integrations/google-form-apps-script.gs
```

## Health Checks

```txt
GET /
GET /health
GET /api/google-form/health
```

## Vercel Note

Vercel does not provide persistent local upload storage. This backend writes files for the active request so email attachments work, and stores data URLs in MongoDB for Google Form generated card records. Use S3, Cloudinary, or Vercel Blob if permanent public image URLs are required.
