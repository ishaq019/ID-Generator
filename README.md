# MERN ID Card Generator

A professional MERN Stack ID Card Generator for office, university, event, and internal organization cards.

## Features

- Template creation
- Default office and university templates
- Dynamic generation form
- Front and back card preview
- Photo/logo upload
- QR code support
- Save generated cards in MongoDB
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
http://localhost:5173
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
- Uploaded images are stored in `backend/uploads`.
"# ID-Generator" 
