# 🪪 MERN ID Card Generator

A professional **MERN Stack ID Card Generator** for creating, managing, exporting, and printing custom ID cards for offices, universities, events, and internal organizations.

This project includes a protected admin panel, dynamic template builder, live card preview, photo/logo uploads, QR code support, PNG/PDF export, MongoDB card storage, Google Drive image storage, and Google Form automation for DigiVal employee ID cards.

> ⚠️ **Important:** This project is only for internal ID cards such as company, college, event, or organization cards. Do **not** use it to create Aadhaar, PAN, passport, voter ID, driving license, or any government/official identity document.

---

## 🚀 Live Deployment

| Service | URL |
|---|---|
| 🌐 Frontend | `https://syedishaq.me/ID-Generator` |
| ⚙️ Backend API | `https://id-card-7c27356a0270.herokuapp.com/api` |
| ✅ Backend Health | `https://id-card-7c27356a0270.herokuapp.com/health` |

---

## ✨ Key Features

### 🎨 Template Management

- Create custom ID card templates
- Use default office, corporate, university, minimal, and DigiVal templates
- Configure front and back card layouts
- Add dynamic fields such as text, number, email, phone, date, image, textarea, and QR
- Set card orientation: vertical or horizontal
- Customize colors, borders, gradients, radius, shadows, and field positions

### 🧾 ID Card Generation

- Select a template and generate a card instantly
- Dynamic form is created from template fields
- Live front and back preview
- Upload photo and logo
- Generate QR code data
- Save generated cards in MongoDB
- Edit previously saved cards
- Delete old generated cards

### 📤 Export Options

- Export front card as PNG
- Export back card as PNG
- Export complete card as PDF
- Print generated cards directly from the browser

### 🔐 Admin Authentication

- Protected admin dashboard
- JWT-style token based login
- Admin credentials from environment variables, MongoDB settings, or `static_auth` fallback
- Automatic logout on unauthorized API response

### ☁️ Google Drive Uploads

- Uploaded images are stored in Google Drive
- Public image serving through backend endpoint
- Supports OAuth refresh token based Drive access
- Optional service-account fallback support

### 🧠 Background Removal

- Optional server-side image background removal
- Supports fast solid-background removal mode
- Supports ML background-removal mode
- Safe fallback behavior for small Heroku dynos

### 📝 Google Form Automation

- Google Form submission creates DigiVal ID cards automatically
- Apps Script sends form data to backend webhook
- Backend downloads submitted photo from Google Drive
- Optional base64 photo fallback
- Processed card is stored in MongoDB
- Uploaded photo is stored in Google Drive

---

## 🧱 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| ⚛️ React 18 | UI development |
| ⚡ Vite | Frontend build tool |
| 🧭 React Router | Client-side routing |
| 🔗 Axios | API requests |
| 🖼️ html2canvas | PNG export |
| 📄 jsPDF | PDF export |
| 🔳 qrcode.react | QR code rendering |
| 🎨 CSS | Custom styling |

### Backend

| Technology | Purpose |
|---|---|
| 🟢 Node.js 20 | Runtime |
| 🚂 Express.js | REST API |
| 🍃 MongoDB | Database |
| 🧩 Mongoose | MongoDB ODM |
| 📦 Multer | Image upload handling |
| ☁️ Google APIs | Google Drive integration |
| 🧠 @imgly/background-removal-node | Background removal |
| 🔐 Custom Auth Middleware | Protected API routes |

---

## 📁 Project Structure

```txt
ID-Generator-main/
│
├── frontend/                         # React + Vite frontend
│   ├── public/
│   │   └── digival/                  # DigiVal logo and QR assets
│   └── src/
│       ├── components/               # Reusable UI components
│       ├── context/                  # Auth context
│       ├── pages/                    # App pages
│       ├── services/                 # Axios API service
│       └── styles/                   # Global CSS
│
├── backend/                          # Express + MongoDB backend
│   ├── config/                       # DB and Google Drive config
│   ├── controllers/                  # API business logic
│   ├── integrations/                 # Google Apps Script integration
│   ├── middleware/                   # Auth, CORS, upload, error middleware
│   ├── models/                       # Mongoose models
│   ├── routes/                       # API routes
│   ├── scripts/                      # Utility scripts
│   ├── uploads/                      # Local upload fallback folder
│   ├── utils/                        # App config, Drive storage, templates
│   └── server.js                     # Backend entry point
│
├── .github/workflows/                # GitHub Pages frontend deployment
├── PROJECT_GUIDE.md                  # Full project explanation
├── app.json                          # Heroku app config
├── Procfile                          # Heroku process file
└── package.json                      # Root Heroku backend shim
```

---

## ⚙️ Local Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ishaq019/ID-Generator.git
cd ID-Generator
```

---

## 🖥️ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

For Windows PowerShell:

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

---

## 🔐 Backend Environment Variables

Create `backend/.env` using `backend/.env.example`.

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/id-card-generator

AUTH_SECRET=replace-with-a-long-random-auth-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-admin-password

CLIENT_URL=http://localhost:5175
CLIENT_URLS=http://localhost:5173,http://localhost:5175,https://syedishaq.me

WEBHOOK_SECRET=replace-with-a-long-random-secret
REQUEST_BODY_LIMIT=50mb
UPLOAD_FILE_SIZE_LIMIT=5mb
GOOGLE_FORM_PHOTO_MAX_SIZE=10mb

GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
GOOGLE_DRIVE_CLIENT_ID=your-google-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-client-secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your-google-refresh-token

BACKGROUND_REMOVAL_ENABLED=true
UPLOAD_BG_REMOVAL_MODE=solid
GOOGLE_FORM_REMOVE_BG=true
GOOGLE_FORM_BG_REMOVAL_MODE=solid
BG_REMOVAL_FALLBACK_ENABLED=true
BG_REMOVAL_MODEL=small
BG_REMOVAL_MAX_DIMENSION=768
BG_REMOVAL_TIMEOUT_MS=22000
```

> 🔴 Do not commit `.env` files. They contain database credentials, admin login details, webhook secrets, and Google API tokens.

---

## 🌐 Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

For Windows PowerShell:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on:

```txt
http://localhost:5175
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_UPLOAD_BACKGROUND_REMOVAL=true
```

> ⚠️ Important for local development: set `VITE_API_BASE_URL=http://localhost:5000/api`. The frontend service has a deployed Heroku backend fallback, so without this variable your local frontend may call the hosted backend instead of your local API.

---

## 🧪 Health Check

After starting the backend, test these endpoints:

```txt
http://localhost:5000/health
http://localhost:5000/ready
http://localhost:5000/api/google-form/health
```

Expected health response:

```json
{
  "status": "ok"
}
```

Expected ready response:

```json
{
  "status": "ready"
}
```

`/ready` confirms MongoDB connection, auth secret configuration, and default template seeding.

---

## 🔑 Admin Login

The app supports admin authentication from:

1. Environment variables
2. MongoDB `settings` collection
3. MongoDB `static_auth` fallback collection

Basic `.env` login setup:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
AUTH_SECRET=your-long-random-secret
```

Optional `static_auth` fallback document:

```json
{
  "key": "admin-signin",
  "username": "admin",
  "password": "Admin@123"
}
```

> ✅ Use a strong password in production. The sample password is only for local testing.

---

## 📌 API Routes

### Public Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API running message |
| `GET` | `/health` | Basic server health check |
| `GET` | `/ready` | Server readiness check |
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/files/:fileId` | Serve Google Drive image by file ID |
| `GET` | `/api/google-form/health` | Google Form webhook health check |
| `POST` | `/api/google-form/digival-card` | Create DigiVal card from Google Form |

### Protected Routes

These routes require admin authentication.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Get logged-in admin profile |
| `GET` | `/api/templates` | Get all templates |
| `POST` | `/api/templates` | Create template |
| `GET` | `/api/templates/:id` | Get template by ID |
| `PUT` | `/api/templates/:id` | Update template |
| `DELETE` | `/api/templates/:id` | Delete template |
| `GET` | `/api/cards` | Get generated cards |
| `POST` | `/api/cards` | Save generated card |
| `GET` | `/api/cards/:id` | Get generated card by ID |
| `PUT` | `/api/cards/:id` | Update generated card |
| `DELETE` | `/api/cards/:id` | Delete generated card |
| `POST` | `/api/uploads/photo` | Upload photo |
| `POST` | `/api/uploads/image` | Upload image |

---

## 📝 Google Form to DigiVal Card Flow

```txt
Google Form
   ↓
Google Sheet
   ↓
Apps Script Trigger
   ↓
POST /api/google-form/digival-card
   ↓
Express Backend
   ↓
Download Photo from Google Drive
   ↓
Optional Background Removal
   ↓
Upload Processed Image to Google Drive
   ↓
Save Generated Card in MongoDB
   ↓
View Card in Frontend Dashboard
```

Required Google Form fields:

```txt
Name
Employee ID
Blood Group
Phone Number
Email Address
Photo
```

Apps Script files are available here:

```txt
backend/integrations/google-form-apps-script.gs
backend/integrations/appsscript.json
```

Script properties required in Apps Script:

```txt
WEBHOOK_SECRET=the same value as backend WEBHOOK_SECRET
BACKEND_URL=https://your-backend-url/api/google-form/digival-card
BACKEND_DRIVE_READER_EMAILS=backend Google Drive credential email
SEND_PHOTO_BASE64_FALLBACK=true
```

---

## ☁️ Google Drive Setup

The backend stores uploaded images in Google Drive instead of relying on local server storage.

Required Drive configuration:

```env
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
GOOGLE_DRIVE_CLIENT_ID=your-google-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-client-secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your-google-refresh-token
```

For full Google API setup, read:

```txt
backend/GOOGLE_API_SETUP.md
```

To verify Drive configuration:

```bash
cd backend
npm run check:drive-config
```

---

## 🚀 Deployment

## Backend Deployment — Heroku

The repository is Heroku-ready using:

```txt
Procfile
package.json
app.json
```

One-click deploy:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ishaq019/ID-Generator)

Required Heroku config vars:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-uri
AUTH_SECRET=your-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
WEBHOOK_SECRET=your-webhook-secret
CLIENT_URL=https://your-frontend-url
CLIENT_URLS=https://your-frontend-url,http://localhost:5175
```

Optional Google Drive config vars:

```env
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
GOOGLE_DRIVE_CLIENT_ID=your-google-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-client-secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
```

Test production backend:

```txt
https://your-heroku-app-name.herokuapp.com/health
https://your-heroku-app-name.herokuapp.com/ready
```

---

## Frontend Deployment — GitHub Pages

The frontend has a GitHub Actions workflow:

```txt
.github/workflows/deploy-frontend.yml
```

The workflow:

1. Installs frontend dependencies
2. Builds the Vite app
3. Adds SPA fallback using `404.html`
4. Deploys to GitHub Pages

Make sure this environment variable points to the deployed backend:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

---

## 🧭 Main App Pages

| Page | Route | Purpose |
|---|---|---|
| 🏠 Home | `/` | Dashboard landing page |
| 🔐 Login | `/login` | Admin login |
| 🎨 Templates | `/templates` | Browse template gallery |
| 🛠️ Builder | `/builder` | Create custom templates |
| 🪪 Generate | `/generate` | Generate card from template |
| 🪪 Generate by Template | `/generate/:templateId` | Generate card from selected template |
| 📂 Saved Cards | `/cards` | View, edit, export, and delete generated cards |

---

## 🧩 Data Models

### Template

Stores card design, field configuration, category, layout type, orientation, and styling.

Important fields:

```txt
templateName
slug
layoutKey
category
orientation
cardSize
frontDesign
backDesign
fields
styles
isDefault
```

### Generated Card

Stores final card data created manually or through Google Form automation.

Important fields:

```txt
templateId
formData
photo
logo
qrData
source
googleSubmissionId
templateSnapshot
uploadsPersisted
```

---

## 🛡️ Security Notes

- Keep `.env` files private
- Use a strong `AUTH_SECRET`
- Use a strong admin password
- Do not expose Google refresh tokens
- Do not commit uploaded user images
- Restrict MongoDB Atlas network access after first deployment
- Keep `WEBHOOK_SECRET` private between Apps Script and backend
- Use this project only for internal/non-government ID cards

---

## 🐞 Troubleshooting

### Backend shows `503 Service Unavailable`

Check:

```txt
MONGO_URI
AUTH_SECRET
ADMIN_USERNAME
ADMIN_PASSWORD
WEBHOOK_SECRET
```

Then test:

```txt
/health
/ready
```

If `/health` works but `/ready` fails, Express is running but MongoDB/config/template seeding is not ready.

### Frontend cannot connect to backend

Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Also check backend CORS variables:

```env
CLIENT_URL=http://localhost:5175
CLIENT_URLS=http://localhost:5173,http://localhost:5175
```

### Image upload fails

Check Google Drive values:

```txt
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_DRIVE_REFRESH_TOKEN
```

Then run:

```bash
npm run check:drive-config
```

### Google Form card is not created

Check:

```txt
Apps Script trigger is installed
WEBHOOK_SECRET matches backend
BACKEND_URL is correct
Google Form field titles match Apps Script FIELD_TITLES
Backend Drive account can access uploaded Form photos
```

---

## 📦 Useful Commands

### Backend

```bash
cd backend
npm install
npm run dev
npm start
npm run check:drive-config
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
npm run deploy
```

---

## ✅ Production Checklist

- [ ] MongoDB Atlas database created
- [ ] Backend `.env` or Heroku config vars added
- [ ] Strong admin password configured
- [ ] `AUTH_SECRET` configured
- [ ] `WEBHOOK_SECRET` configured
- [ ] Google Drive folder created
- [ ] Google Drive OAuth refresh token generated
- [ ] Backend `/health` works
- [ ] Backend `/ready` works
- [ ] Frontend `VITE_API_BASE_URL` points to backend
- [ ] Google Form Apps Script trigger installed
- [ ] Test card generated manually
- [ ] Test card generated through Google Form
- [ ] PNG export tested
- [ ] PDF export tested
- [ ] Print tested

---

## 🤝 Contributing

Contributions are welcome.

Recommended workflow:

```bash
fork the repo
create a feature branch
commit your changes
push your branch
open a pull request
```

Keep changes clean, tested, and focused. Do not commit secrets, `.env` files, or private uploaded images.

---

## 📄 License

This project currently does not include a license file. Add a `LICENSE` file before distributing or accepting public contributions.

---

## 👨‍💻 Author

Built by **Syed Ishaq**

- GitHub: `@ishaq019`
- Frontend: `https://syedishaq.me/ID-Generator`

---

## ⭐ Support

If this project helped you, consider giving the repository a star.

