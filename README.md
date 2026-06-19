# MERN ID Card Generator

A professional MERN Stack ID Card Generator for office, university, event, and internal organization cards.

## Features

- Template creation
- Default office and university templates
- Dynamic generation form
- Front and back card preview
- Photo/logo upload
- QR code support
- Single save action for generated cards in MongoDB
- Google Form webhook for DigiVal ID card generation
- Admin login from env, MongoDB settings, or `static_auth`
- Export as PNG
- Export as PDF
- Print cards
- Plain CSS only, no Tailwind CSS

## Important Safety Note

Use this project only for office, college, university, event, or internal organization ID cards. Do not use it to create Aadhaar, PAN, driving license, voter ID, passport, or any government/official identity document.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend URL:

```txt
http://localhost:5000
```

Backend environment fallbacks:

```txt
MONGO_URI=your MongoDB connection string
AUTH_SECRET=a long random secret used to sign admin auth tokens
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a strong admin password
WEBHOOK_SECRET=a long random secret used by Apps Script
CLIENT_URL=http://localhost:5175
CLIENT_URLS=http://localhost:5173,http://localhost:5175
```

The backend reads app settings from MongoDB first, then falls back to `.env` values field by field.

Detailed Google API setup for Drive uploads and Google Form photo access is in [backend/GOOGLE_API_SETUP.md](backend/GOOGLE_API_SETUP.md).

## Deploy Backend to Heroku from the GUI

This repo is now Heroku GUI deployable from the main GitHub repo. It includes a root `Procfile`, root `package.json`, and root `app.json` that install and start the API from `backend/`.

You can also deploy only the backend repo (`https://github.com/ishaq019/ID-Generator-Back`) because `backend/` contains its own `Procfile` and `app.json`.

One-click deploy from the main repo:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ishaq019/ID-Generator)

Manual Heroku Dashboard deploy:

1. Push these changes to GitHub.
2. Open `https://dashboard.heroku.com`, then choose `New` -> `Create new app`.
3. Open the app `Settings` tab and add config vars. Do not add `PORT`; Heroku sets it automatically.
4. Required config vars:

```txt
MONGO_URI=your MongoDB Atlas connection string
AUTH_SECRET=a long random secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a strong admin password
WEBHOOK_SECRET=a long random secret for Apps Script
NODE_ENV=production
```

5. Add Google Drive config vars if uploads or Google Form generation will be used:

```txt
GOOGLE_DRIVE_FOLDER_ID=your Drive folder ID
GOOGLE_DRIVE_CLIENT_ID=your OAuth client ID
GOOGLE_DRIVE_CLIENT_SECRET=your OAuth client secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your OAuth refresh token
```

6. Optional Heroku-friendly background-removal defaults:

```txt
BACKGROUND_REMOVAL_ENABLED=true
GOOGLE_FORM_REMOVE_BG=true
BG_REMOVAL_FALLBACK_ENABLED=true
BG_REMOVAL_MODEL=small
BG_REMOVAL_MAX_DIMENSION=768
BG_REMOVAL_TIMEOUT_MS=22000
REQUEST_BODY_LIMIT=50mb
UPLOAD_FILE_SIZE_LIMIT=5mb
GOOGLE_FORM_PHOTO_MAX_SIZE=10mb
```

7. Open the `Deploy` tab, choose `GitHub`, connect the repo, select the branch, then click `Deploy Branch`.
8. Open `Resources` and make sure the `web` dyno is enabled.
9. Test the deployed API:

```txt
https://your-heroku-app-name.herokuapp.com/health
```

Expected response:

```json
{ "status": "ok" }
```

After deployment, update the frontend deployment with:

```txt
VITE_API_BASE_URL=https://your-heroku-app-name.herokuapp.com/api
```

For Google Apps Script, set script property:

```txt
BACKEND_URL=https://your-heroku-app-name.herokuapp.com/api/google-form/digival-card
WEBHOOK_SECRET=the same value as Heroku WEBHOOK_SECRET
```

If MongoDB Atlas blocks the connection, open Atlas `Network Access` and allow access for the Heroku app. For a simple first deploy, many projects use `0.0.0.0/0`; tighten this later if your hosting/network plan allows it.

### Heroku 503 or Browser CORS Error

If the browser says `No 'Access-Control-Allow-Origin' header` and the Network tab also shows `503 Service Unavailable`, check the Heroku app first. A Heroku `Application Error` page means the request did not reach Express, so it is usually a crashed dyno or missing production config, not a frontend CORS setting.

After deployment, test:

```txt
https://your-heroku-app-name.herokuapp.com/health
https://your-heroku-app-name.herokuapp.com/ready
```

`/health` only confirms the Express server is running. `/ready` checks MongoDB, `AUTH_SECRET`, and default template seeding. If `/ready` returns `503`, open Heroku `More` -> `View logs` and check these config vars first: `MONGO_URI`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `WEBHOOK_SECRET`.

### Heroku Background Removal

For Heroku, keep background removal enabled but bounded:

```txt
BACKGROUND_REMOVAL_ENABLED=true
GOOGLE_FORM_REMOVE_BG=true
BG_REMOVAL_FALLBACK_ENABLED=true
BG_REMOVAL_MODEL=small
BG_REMOVAL_MAX_DIMENSION=768
BG_REMOVAL_TIMEOUT_MS=22000
```

If `BACKGROUND_REMOVAL_ENABLED` or `GOOGLE_FORM_REMOVE_BG` is set to `false` in Heroku Config Vars or in the MongoDB `settings` document, the backend will upload the original image without removing the background. Heroku Config Vars override MongoDB for these background-removal kill switches.

Easy admin setup: set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` or in the MongoDB `settings` document.

Optional fallback: create one admin document in MongoDB's `static_auth` collection:

```json
{
  "key": "admin-signin",
  "username": "admin",
  "password": "Admin@123"
}
```

Create one config document in MongoDB's `settings` collection:

```json
{
  "key": "app-settings",
  "AUTH_SECRET": "a long random secret used to sign admin auth tokens",
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "a strong admin password",
  "CLIENT_URL": "http://localhost:5175",
  "WEBHOOK_SECRET": "a long random secret used by Apps Script",
  "GOOGLE_DRIVE_FOLDER_ID": "your Drive folder ID",
  "GOOGLE_DRIVE_CLIENT_ID": "your OAuth client ID",
  "GOOGLE_DRIVE_CLIENT_SECRET": "your OAuth client secret",
  "GOOGLE_DRIVE_REDIRECT_URI": "https://developers.google.com/oauthplayground",
  "GOOGLE_DRIVE_REFRESH_TOKEN": "your OAuth refresh token"
}
```

There is no frontend admin creation flow and no backend setup route.

Hosted Google Form webhook endpoint after Heroku deployment:

```txt
https://your-heroku-app-name.herokuapp.com/api/google-form/digival-card
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL:

```txt
http://localhost:5175
```

The frontend reads `VITE_API_BASE_URL`. If it is not set, it uses the local backend:

```txt
http://localhost:5000/api
```

## Google Form to ID Card Flow

Target flow:

```txt
Google Form
-> Google Sheet
-> Apps Script
-> POST /api/google-form/digival-card
-> MERN backend
-> backend downloads the submitted photo from Google Drive by file ID
-> backend optionally removes the background
-> processed photo is saved to Google Drive
-> card data is saved in MongoDB
```

The Google Form should collect these fields:

```txt
Name
Employee ID
Blood Group
Phone Number
Email Address
Photo
```

The backend accepts common label variations, but the Apps Script file uses exact titles. If your form labels are different, update `FIELD_TITLES` in [google-form-apps-script.gs](backend/integrations/google-form-apps-script.gs).

Hosted backend endpoint:

```txt
https://your-heroku-app-name.herokuapp.com/api/google-form/digival-card
```

Health checks:

```txt
https://your-heroku-app-name.herokuapp.com/health
https://your-heroku-app-name.herokuapp.com/api/google-form/health
```

## Apps Script Setup

1. Open the Google Form: `https://forms.gle/kijuRZpLJsHarV1q8`.
2. Go to `Responses` and link it to a Google Sheet.
3. In the linked Sheet, open `Extensions` -> `Apps Script`.
4. Paste the contents of [google-form-apps-script.gs](backend/integrations/google-form-apps-script.gs).
5. In Apps Script `Project Settings`, enable `Show "appsscript.json" manifest file in editor`, then paste [appsscript.json](backend/integrations/appsscript.json) into the manifest file.
6. In the Apps Script editor, update `FIELD_TITLES` so each value exactly matches your form question title or response sheet column header.
7. Open `Project Settings` -> `Script properties` and add:

```txt
WEBHOOK_SECRET=the same value as backend WEBHOOK_SECRET
BACKEND_URL=https://your-heroku-app-name.herokuapp.com/api/google-form/digival-card
BACKEND_DRIVE_READER_EMAILS=backend service account email or Drive OAuth account email
SEND_PHOTO_BASE64_FALLBACK=true
```

8. In the editor, select function `authorizeGoogleFormAutomation`, click `Run`, and approve permissions.
9. Open `Triggers` -> `Add Trigger`.
10. Choose function: `onFormSubmit`.
11. Choose deployment: `Head`.
12. Choose event source: `From spreadsheet`.
13. Choose event type: `On form submit`.
14. Save, authorize if prompted, then submit a test response.

The Apps Script reads the submitted response row, extracts the uploaded photo's Google Drive file ID, and sends `photoFileId` to the backend. It also sends a `photoBase64` fallback by default, so a submission can still be processed if Google Drive has not made the uploaded file visible to the backend account yet. The backend first tries to download the Drive file, then falls back to the base64 image when the Drive download returns a Google API access/not-found error.

`BACKEND_DRIVE_READER_EMAILS` must be the backend Google Drive credential email: the Google account that generated `GOOGLE_DRIVE_REFRESH_TOKEN`, or the service account email from `GOOGLE_CLIENT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_JSON`. Do not set it to the employee/respondent email from the Form. It is optional only when the backend already uses the same Google account that owns the Form uploads. Set `SEND_PHOTO_BASE64_FALLBACK=false` only if you want to disable the base64 fallback and rely entirely on Drive permissions.

After a test submission, check:

```txt
Apps Script -> Executions
Heroku -> app Activity or More -> View logs
MongoDB -> generatedcards collection
Frontend -> Saved Cards -> DigiVal Cards
```

For frontend deployments, set:

```txt
VITE_API_BASE_URL=https://your-heroku-app-name.herokuapp.com/api
```

## Folder Structure

```txt
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  uploads/
  utils/
  server.js

frontend/
  src/
    components/
    pages/
    services/
    styles/
```

## Notes

- MongoDB must be running locally or through MongoDB Atlas.
- Default templates are automatically seeded when the backend starts.
- Uploaded images are stored in Google Drive and served through `/api/files/:fileId`.
