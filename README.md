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
- Sharp-generated DigiVal front/back PNG images
- Email delivery with Nodemailer
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

Required backend environment variables:

```txt
MONGO_URI=your MongoDB connection string
WEBHOOK_SECRET=a long random secret used by Apps Script
APP_BASE_URL=https://id-generator-backend-jet.vercel.app
EMAIL_USER=your Gmail address
EMAIL_PASS=your Gmail app password
CLIENT_URL=http://localhost:5175
```

Required backend environment variables:

```txt
MONGO_URI=your MongoDB connection string
WEBHOOK_SECRET=the same secret you put in Apps Script
APP_BASE_URL=https://id-generator-backend-jet.vercel.app
EMAIL_USER=your Gmail address
EMAIL_PASS=your Gmail app password
CLIENT_URL=http://localhost:5175
```

Hosted Google Form webhook endpoint:

```txt
https://id-generator-backend-jet.vercel.app/api/google-form/digival-card
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

The frontend reads `VITE_API_BASE_URL`. If it is not set, it uses:

```txt
https://id-generator-backend-jet.vercel.app/api
```

## Google Form to ID Card Flow

Target flow:

```txt
Google Form
-> Google Sheet
-> Apps Script
-> POST /api/google-form/digival-card
-> MERN backend
-> Sharp generates DigiVal front/back PNG
-> card data is saved in MongoDB
-> front/back PNGs are emailed to the submitted email address
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
https://id-generator-backend-jet.vercel.app/api/google-form/digival-card
```

Health checks:

```txt
https://id-generator-backend-jet.vercel.app/health
https://id-generator-backend-jet.vercel.app/api/google-form/health
```

## Apps Script Setup

1. Open the Google Form: `https://forms.gle/kijuRZpLJsHarV1q8`.
2. Go to `Responses` and link it to a Google Sheet.
3. In the linked Sheet, open `Extensions` -> `Apps Script`.
4. Paste the contents of [google-form-apps-script.gs](backend/integrations/google-form-apps-script.gs).
5. In the Apps Script editor, update `FIELD_TITLES` so each value exactly matches your form question title or response sheet column header.
6. Open `Project Settings` -> `Script properties` and add:

```txt
WEBHOOK_SECRET=the same value as backend WEBHOOK_SECRET
BACKEND_URL=https://id-generator-backend-jet.vercel.app/api/google-form/digival-card
```

7. Open `Triggers` -> `Add Trigger`.
8. Choose function: `onFormSubmit`.
9. Choose deployment: `Head`.
10. Choose event source: `From spreadsheet`.
11. Choose event type: `On form submit`.
12. Save, authorize Google Drive and external request permissions, then submit a test response.

After a test submission, check:

```txt
Apps Script -> Executions
Vercel -> backend logs
MongoDB -> generatedcards collection
Recipient inbox -> DigiVal ID card email attachments
Frontend -> Saved Cards -> DigiVal Cards
```

For frontend deployments, set:

```txt
VITE_API_BASE_URL=https://id-generator-backend-jet.vercel.app/api
```

## Vercel File Storage Note

The backend writes generated photos/cards into `backend/uploads` when the filesystem allows it. Vercel serverless storage is not reliable as permanent file storage, so the Google Form flow also stores the generated PNGs as data URLs in MongoDB and emails the PNG buffers directly. For a larger production setup, move generated assets to Cloudinary, S3, or another persistent object store.

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
- Uploaded images are stored in `backend/uploads`.
"# ID-Generator" 
