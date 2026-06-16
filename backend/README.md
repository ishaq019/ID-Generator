# ID Generator Backend

Express/MongoDB backend for template management, generated card records, image uploads, and Google Form driven DigiVal ID card generation.

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

## Environment Fallbacks

```txt
MONGO_URI=your MongoDB connection string
AUTH_SECRET=a long random secret used to sign admin auth tokens
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a strong admin password
WEBHOOK_SECRET=a long random secret shared with Apps Script
CLIENT_URL=http://localhost:5175
CLIENT_URLS=http://localhost:5173,http://localhost:5175
REQUEST_BODY_LIMIT=50mb
UPLOAD_FILE_SIZE_LIMIT=5mb
GOOGLE_DRIVE_FOLDER_ID=your Drive folder ID
GOOGLE_DRIVE_CLIENT_ID=your OAuth client ID
GOOGLE_DRIVE_CLIENT_SECRET=your OAuth client secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your OAuth refresh token
```

The backend reads app config from MongoDB first. These `.env` values are fallback values when the MongoDB `settings` document is missing, disconnected, or does not contain a field.

For Google Drive uploads, generate the refresh token from the same Google account that owns or can edit the target Drive folder. Enable the Google Drive API in the Google Cloud project that owns the OAuth client. Service-account credentials are still supported as a fallback through `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`.

If Google Drive calls fail with `invalid_grant`, the backend OAuth refresh token is no longer valid. Regenerate `GOOGLE_DRIVE_REFRESH_TOKEN` with the same `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and redirect URI, then update the MongoDB `settings` document or `.env` and redeploy/restart the backend. For Google Cloud OAuth consent screens in Testing mode, refresh tokens can expire; move the app to Production or regenerate the token when needed.

You can verify what the backend resolves from MongoDB without printing secrets:

```bash
npm run check:drive-config
```

This prints detected Mongo keys, masked credential fingerprints, and whether Google accepts the configured refresh token.

Optional app behavior can be configured with `DIGIVAL_TEMPLATE_SLUG`, `COMPANY_WEBSITE`, `COMPANY_ADDRESS`, `BACKGROUND_REMOVAL_ENABLED`, `GOOGLE_FORM_REMOVE_BG`, `BG_REMOVAL_MODEL`, `BG_REMOVAL_MAX_DIMENSION`, and `GOOGLE_FORM_PHOTO_MAX_SIZE`.

## MongoDB Config

Easy admin setup: set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` or in the MongoDB `settings` document.

Optional fallback: create one admin document in the `static_auth` collection. The app does not expose an admin setup page or setup endpoint.

```json
{
  "key": "admin-signin",
  "username": "admin",
  "password": "Admin@123"
}
```

Create one app settings document in the `settings` collection. Each field is read as `MongoDB value || env value`.

```json
{
  "key": "app-settings",
  "AUTH_SECRET": "a long random secret used to sign admin auth tokens",
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "a strong admin password",
  "CLIENT_URL": "http://localhost:5175",
  "WEBHOOK_SECRET": "a long random secret shared with Apps Script",
  "GOOGLE_DRIVE_FOLDER_ID": "your Drive folder ID",
  "GOOGLE_DRIVE_CLIENT_ID": "your OAuth client ID",
  "GOOGLE_DRIVE_CLIENT_SECRET": "your OAuth client secret",
  "GOOGLE_DRIVE_REDIRECT_URI": "https://developers.google.com/oauthplayground",
  "GOOGLE_DRIVE_REFRESH_TOKEN": "your OAuth refresh token"
}
```

The backend also supports optional `CLIENT_URLS`, `WEBHOOK_URL`, `UPLOAD_FILE_SIZE_LIMIT`, `GOOGLE_FORM_PHOTO_MAX_SIZE`, and background-removal fields in the same `app-settings` document.

After setting admin credentials, use `POST /api/auth/login`.

## Image Upload Endpoint

```txt
POST /api/uploads/photo
```

Form-data field:

```txt
photo=<image file>
```

The response includes `imageUrl`, `fileId`, and `file` metadata. `imageUrl` points to `GET /api/files/:fileId`, which streams the image back from Google Drive.

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
  "photoFileId": "google drive file id from the Form upload cell",
  "submissionId": "unique google sheet row id"
}
```

The Apps Script runs from the linked Google Sheet, reads the submitted row, extracts the uploaded image's Drive file ID, and sends `photoFileId` to the backend. The backend downloads that file, removes the background when enabled, and uploads the processed image to the output folder configured by `GOOGLE_DRIVE_FOLDER_ID`. Legacy `photoBase64` plus `photoMimeType` payloads are still accepted as a fallback.

The backend Google Drive credentials must be able to read the Form-uploaded source file and write to the output folder. Use OAuth credentials for an account with both permissions, or set the Apps Script `BACKEND_DRIVE_READER_EMAILS` property to the backend service account/OAuth account email so the script grants read access to each uploaded source file before sending the webhook.

The Apps Script copy is in:

```txt
backend/integrations/google-form-apps-script.gs
```

The Apps Script manifest with required permissions is in:

```txt
backend/integrations/appsscript.json
```

After pasting both files into Apps Script, run `authorizeGoogleFormAutomation` once from the editor and approve permissions. This grants the spreadsheet, Drive, script properties, and URL fetch scopes needed by the installable trigger.

## Health Checks

```txt
GET /
GET /health
GET /api/google-form/health
```

## Vercel Note

Vercel does not provide persistent local upload storage. Uploaded images are stored in Google Drive and card records keep Drive-backed `/api/files/:fileId` URLs in MongoDB.
