# ID Generator Project Guide

This guide explains the project in the order you should understand it for a code review:

1. What the project does.
2. Which technical concepts are used.
3. How the main business workflows move through the code.
4. What each important file is responsible for.
5. How to explain the project clearly in a review.

## 1. Project Overview

This is a MERN ID Card Generator.

The application lets an admin:

- Open the admin portal without signing in.
- View seeded default templates.
- Create custom ID card templates.
- Generate ID cards from dynamic form fields.
- Upload photos/logos to Google Drive.
- Optionally remove photo backgrounds before upload.
- Preview front and back card sides.
- Save generated cards in MongoDB.
- Export cards as PNG/PDF or print them.
- Receive DigiVal employee ID card submissions from a Google Form webhook.

High-level flow:

```txt
React frontend
-> Express API
-> MongoDB for templates/cards/settings
-> Google Drive for uploaded images
```

Important safety note:

This project is for office, university, event, or internal organization ID cards only. It should not be used for government IDs such as Aadhaar, PAN, passport, voter ID, or driving license.

## 2. Main Concepts Used

### MERN Stack

The project uses:

- MongoDB: stores templates, generated cards, and runtime settings.
- Express: exposes REST APIs for templates, cards, uploads, files, and Google Form automation.
- React: builds the admin user interface.
- Node.js: runs backend services, file processing, and Google Drive integration.

### Access

```txt
Browser opens app
-> React renders app routes
-> axios calls Express APIs directly
-> backend handles templates, cards, uploads, and webhooks
```

The admin portal and CRUD/upload APIs no longer require login or bearer-token authentication.

### API Routes

Public routes:

```txt
GET  /api/files/:fileId
GET  /api/google-form/health
POST /api/google-form/digival-card
```

App routes:

```txt
POST   /api/uploads/photo
POST   /api/uploads/image
GET    /api/templates
POST   /api/templates
GET    /api/templates/:id
PUT    /api/templates/:id
DELETE /api/templates/:id
GET    /api/cards
POST   /api/cards
GET    /api/cards/:id
PUT    /api/cards/:id
DELETE /api/cards/:id
```

`/api/files/:fileId` is public because browser image tags cannot send authorization headers.

The Google Form route remains protected by `x-webhook-secret`.

### CRUD Operations

The project has CRUD for two main resources:

- Templates: create, read, update, delete card templates.
- Generated cards: create, read, update, delete saved cards.

Templates are design blueprints. Generated cards are filled-in cards created from a template.

### MongoDB Models

Main collections:

- `templates`: template design, fields, card size, category, default/custom flag.
- `generatedcards`: saved card data, image URLs, QR data, source, template snapshot.
- `settings`: runtime config such as Drive credentials, webhook secret, upload limits, and company defaults.

### Google Drive Storage

Images are not stored permanently on local disk.

Upload flow:

```txt
Frontend selects image
-> backend receives file with Multer memory storage
-> optional background removal
-> backend uploads image buffer to Google Drive
-> backend stores only /api/files/:fileId URL in MongoDB
-> browser loads image through backend file route
```

Why backend file route is used:

- The frontend never receives Google credentials.
- The app can control headers and caching.
- Export tools can fetch images through the app's own API.

### Background Removal

Background removal uses `@imgly/background-removal-node`.

The backend runs it in a separate worker process because the image package uses native dependencies. Keeping it in a worker avoids conflicts with the main API process.

### Google Form Automation

The DigiVal automation flow:

```txt
Google Form
-> linked Google Sheet
-> Apps Script reads submitted fields and uploaded photo Drive file ID
-> Apps Script can grant backend Drive account read access to the source file
-> Apps Script sends JSON + photoFileId to backend webhook
-> backend validates webhook secret
-> backend downloads source photo from Google Drive
-> backend uploads processed photo to Google Drive
-> backend saves generated card in MongoDB
```

This allows ID cards to be created automatically from form submissions.

### Frontend State Management

The frontend uses React local state and context:

- `useState`: form fields, selected template, loading/saving flags.
- `useEffect`: fetch templates/cards when pages load.
- `useMemo`: memoize filtered card lists and derived values.
- React Router: navigate between workflows.

There is no Redux or global data store.

## 3. Backend Request Lifecycle

Important file:

```txt
backend/server.js
```

Startup flow:

```txt
dotenv.config()
-> create Express app
-> read static app config
-> register CORS and body parsers
-> register health/public routes
-> prepare server for /api requests
-> connect MongoDB
-> seed default templates
-> mount public API routes
-> mount app API routes
-> mount 404 and error handlers
```

Business purpose:

- API routes should not run until MongoDB is ready.
- Default templates should always exist.
- The same Express app can run locally or on Vercel.

## 4. Main Workflows

### Access Workflow

Files involved:

```txt
frontend/src/services/api.js
backend/server.js
backend/routes/templateRoutes.js
backend/routes/cardRoutes.js
backend/routes/uploadRoutes.js
```

Flow:

```txt
User opens the frontend
-> React Router renders app pages directly
-> api.js sends requests without Authorization headers
-> Express routes process CRUD and upload requests directly
```

Code review explanation:

The login and role-checking system has been removed. The app is open to anyone who can reach the frontend/backend URL, while the Google Form webhook still uses `x-webhook-secret`.

### Template CRUD Workflow

Files involved:

```txt
frontend/src/pages/TemplateGallery.jsx
frontend/src/pages/TemplateBuilder.jsx
frontend/src/components/FieldEditor.jsx
frontend/src/components/CardPreview.jsx
backend/routes/templateRoutes.js
backend/controllers/templateController.js
backend/models/Template.js
```

Flow:

```txt
TemplateBuilder builds template object
-> frontend validates required name and unique field keys
-> POST /api/templates
-> backend normalizes field label/key values
-> backend validates name and duplicate field keys
-> Template.create saves MongoDB document
```

Update/delete rules:

- Default templates cannot be edited directly.
- Default templates cannot be deleted.
- Custom templates can be created, updated, and deleted.

Business reason:

Default templates are seeded by the application and should remain stable for demos and base workflows. Users create custom templates when they need changes.

### Generate Card Workflow

Files involved:

```txt
frontend/src/pages/GenerateCard.jsx
frontend/src/components/CardPreview.jsx
frontend/src/components/ExportButtons.jsx
backend/routes/cardRoutes.js
backend/controllers/cardController.js
backend/models/GeneratedCard.js
```

Flow:

```txt
GenerateCard loads templates
-> user selects template
-> dynamic form renders from template.fields
-> user enters values and uploads image
-> CardPreview renders live front/back preview
-> saveCard sends templateId, formData, photo, logo, qrData
-> backend verifies template exists
-> backend rejects inline base64 images
-> backend stores generated card with template snapshot
```

Why save a template snapshot:

If a template changes later, old generated cards can still render using the design that existed when the card was saved.

### Image Upload Workflow

Files involved:

```txt
frontend/src/services/api.js
frontend/src/pages/GenerateCard.jsx
backend/routes/uploadRoutes.js
backend/middleware/uploadMiddleware.js
backend/utils/backgroundRemoval.js
backend/utils/backgroundRemovalWorker.js
backend/utils/googleDriveStorage.js
backend/config/googleDrive.js
backend/routes/fileRoutes.js
```

Flow:

```txt
User chooses file
-> uploadAPI.image sends multipart/form-data
-> uploadMiddleware validates image type and file size
-> uploadRoutes optionally removes background
-> googleDriveStorage uploads/replaces file in Drive
-> backend returns /api/files/:fileId?v=timestamp
-> frontend stores URL in formData
```

Business reason:

Generated cards store stable file URLs instead of large base64 strings. This keeps MongoDB records small and makes image reuse/export easier.

### Export Workflow

Files involved:

```txt
frontend/src/components/CardPreview.jsx
frontend/src/components/ExportButtons.jsx
backend/routes/fileRoutes.js
```

Flow:

```txt
CardPreview renders visible card side
-> also renders hidden export copies for front and back
-> ExportButtons clones the export DOM
-> images are converted to data URLs
-> canvas pixels for QR codes are copied
-> html2canvas renders PNG
-> jsPDF combines front/back into PDF
```

Why hidden export nodes exist:

The app can export both sides even when only one side is currently visible in the preview UI.

### Google Form Automation Workflow

Files involved:

```txt
backend/integrations/google-form-apps-script.gs
backend/routes/googleFormRoutes.js
backend/controllers/googleFormController.js
backend/utils/appConfig.js
backend/utils/backgroundRemoval.js
backend/utils/googleDriveStorage.js
backend/models/GeneratedCard.js
backend/models/Template.js
```

Flow:

```txt
Apps Script sends webhook
-> backend checks x-webhook-secret
-> backend normalizes field names from common aliases
-> backend validates required fields and email format
-> backend prevents duplicate submissionId
-> backend finds DigiVal template
-> backend reads photoFileId or legacy photoBase64
-> backend downloads Drive photo or decodes legacy base64 photo
-> optional background removal
-> upload photo to Google Drive
-> create GeneratedCard with source google-form
```

Business reason:

HR or operations can use a Google Form as a simple data-entry tool, while the backend still controls validation, image processing, storage, and final card creation.

## 5. Backend File-by-File Guide

### backend/server.js

Main Express app.

Code logic:

- Loads `.env`.
- Creates Express app.
- Configures CORS, JSON parsing, URL-encoded parsing.
- Exposes `/` and `/health`.
- Uses `prepareServer()` before `/api` routes.
- Mounts public routes first.
- Mounts app API routes directly.
- Registers not-found and error middleware.

Business logic:

- Makes sure MongoDB and default templates are ready before real API work.
- Keeps file streaming and Google Form webhook public for technical/business reasons.

### backend/api/index.js

Vercel entry point.

Code logic:

- Imports the Express app from `server.js`.
- Exports it for serverless deployment.

### backend/config/db.js

MongoDB connection helper.

Code logic:

- Requires `MONGO_URI`.
- Reuses existing connected/connecting Mongoose connection.
- Connects only when needed.

Business logic:

- Prevents duplicate database connections in local dev and serverless environments.

### backend/config/googleDrive.js

Google Drive client factory.

Code logic:

- Reads runtime config.
- Supports OAuth refresh-token credentials.
- Supports service-account credentials.
- Caches Drive client until credentials change.
- Returns `google.drive({ version: "v3", auth })`.

Business logic:

- Allows uploads to work with either a user OAuth setup or service account setup.

### backend/utils/appConfig.js

Runtime configuration layer.

Code logic:

- Reads MongoDB `settings` document when connected.
- Falls back to environment variables.
- Supports aliases for runtime settings such as CORS, webhook, Drive, upload, and background-removal fields.
- Parses lists, booleans, byte sizes, and background-removal dimensions.
- Caches Mongo settings briefly.

Business logic:

- Lets deployed configuration be changed from MongoDB without requiring code changes.
- Keeps `.env` useful for local development.

### backend/models/AppSetting.js

MongoDB model for runtime settings.

Code logic:

- Uses `strict: false`, so the settings document can contain many config fields.
- Collection name is `settings`.

Business logic:

- One flexible config document stores operational values like secrets, Drive credentials, upload limits, and company defaults.

### Removed Auth Files

The former login, token, static admin account, and route-protection files have been removed. Backend app routes are mounted directly in `server.js`.

### backend/models/Template.js

Template schema.

Code logic:

- Defines field schema for label, key, type, side, coordinates, size, styling, image shape.
- Defines design schema for front/back backgrounds.
- Defines template metadata: name, slug, category, orientation, card size, layout key, default flag.

Business logic:

- Templates are reusable blueprints for generating cards.

### backend/controllers/templateController.js

Template CRUD controller.

Code logic:

- Normalizes field labels and keys.
- Validates template name.
- Validates field label/key presence.
- Rejects duplicate field keys.
- Forces created templates to `isDefault = false`.
- Prevents default templates from update/delete.
- Supports category filtering.

Business logic:

- Allows admins to create custom card designs while protecting seeded templates.

### backend/routes/templateRoutes.js

Template route definitions.

Code logic:

- `/` handles list and create.
- `/:id` handles get, update, delete.

### backend/utils/defaultTemplates.js

Seed data for starter templates.

Code logic:

- Defines DigiVal, office, corporate, university, and minimal templates.
- Uses `findOneAndUpdate` with `upsert` by slug.

Business logic:

- Guarantees the app has usable templates after startup.
- The DigiVal template supports the Google Form automation flow.

### backend/models/GeneratedCard.js

Generated card schema.

Code logic:

- Stores `templateId`.
- Stores flexible `formData`.
- Stores `photo`, `logo`, and `qrData`.
- Stores `source` as manual or google-form.
- Stores `googleSubmissionId` for duplicate detection.
- Stores `templateSnapshot`.

Business logic:

- A generated card is a saved instance of a template with real person/card data.

### backend/controllers/cardController.js

Generated card CRUD controller.

Code logic:

- Requires valid `templateId` on create.
- Fetches template before creating card.
- Rejects inline `data:image/...` values to prevent large MongoDB records.
- Sets `uploadsPersisted = true`.
- Saves a `templateSnapshot`.
- Lists cards newest first.
- Populates template metadata.
- Updates cards and refreshes template snapshot when `templateId` is present.
- Deletes cards by ID.

Business logic:

- Keeps generated cards clean, small, and renderable even after templates change.

### backend/routes/cardRoutes.js

Generated card route definitions.

Code logic:

- `/` handles list and create.
- `/:id` handles get, update, delete.

### backend/middleware/uploadMiddleware.js

Multer upload parser.

Code logic:

- Uses memory storage.
- Accepts PNG, JPG, JPEG, and WEBP.
- Reads file size limit from runtime config.
- Returns multer middleware for a given field.

Business logic:

- Validates uploaded images before Drive upload and background removal.

### backend/routes/uploadRoutes.js

Upload endpoint handler.

Code logic:

- Supports `/photo` and `/image`.
- Runs upload middleware.
- Handles Multer size errors.
- Checks whether background removal was requested.
- Calls `removeBackgroundFromUpload` when enabled.
- Uploads final image to Google Drive.
- Returns versioned image URL.

Business logic:

- Converts a browser image file into a Drive-backed URL the card can store.

### backend/utils/backgroundRemoval.js

Main-process background-removal wrapper.

Code logic:

- Builds safe output PNG filename.
- Normalizes model and max dimension.
- Creates temp input/output/request files.
- Spawns `backgroundRemovalWorker.js`.
- Reads processed PNG buffer.
- Cleans temp directory.

Business logic:

- Provides optional clean employee photos without blocking main API logic with package-specific details.

### backend/utils/backgroundRemovalWorker.js

Worker process for image processing.

Code logic:

- Reads request JSON.
- Loads the package-specific `sharp`.
- Normalizes image orientation and size.
- Calls `@imgly/background-removal-node`.
- Converts result to PNG.
- Writes output file.

Business logic:

- Isolates native image dependencies from the main backend process.

### backend/utils/googleDriveStorage.js

Google Drive storage helper.

Code logic:

- Sanitizes file names.
- Finds existing file by name in configured Drive folder.
- Creates new file or replaces existing file.
- Returns `/api/files/:fileId`.
- Downloads Drive files as buffers for the public file route.

Business logic:

- Gives the app durable image storage without storing files in MongoDB or depending on local disk.

### backend/routes/fileRoutes.js

Public image streaming route.

Code logic:

- Validates Drive file ID shape.
- Downloads file from Google Drive.
- Sets content type, length, CORS, cache headers.
- Sends image buffer.

Business logic:

- Lets browser previews and exports load Drive images through the backend.

### backend/controllers/googleFormController.js

DigiVal Google Form webhook controller.

Code logic:

- Reads runtime config and webhook secret.
- Validates `x-webhook-secret`.
- Normalizes common field aliases.
- Validates required fields.
- Validates email format.
- Prevents duplicate processing by `submissionId`.
- Finds DigiVal template by slug or layout key.
- Reads `photoFileId` or legacy `photoBase64`.
- Downloads Drive photo or decodes legacy base64 photo.
- Checks photo MIME type and size.
- Optionally removes background.
- Uploads photo to Drive.
- Builds DigiVal formData.
- Creates `GeneratedCard` with `source: "google-form"`.

Business logic:

- Converts a Google Form submission into a saved DigiVal card automatically.

### backend/routes/googleFormRoutes.js

Google Form route definitions.

Code logic:

- `GET /health` confirms route availability.
- `POST /digival-card` calls webhook controller.

### backend/integrations/google-form-apps-script.gs

Google Apps Script integration.

Code logic:

- Runs on Google Sheet form submit trigger.
- Reads configured form field titles.
- Extracts uploaded photo Drive file ID from the response sheet.
- Sends POST request to backend webhook.

Business logic:

- Bridges Google Forms and this backend without building a separate frontend form.

### backend/middleware/errorMiddleware.js

Central error handling.

Code logic:

- Handles unknown routes.
- Converts Mongoose cast errors to invalid ID response.
- Converts duplicate-key errors to duplicate response.
- Converts oversized JSON body errors to 413.
- Sends JSON error message.

Business logic:

- Keeps controllers simpler and gives the frontend consistent error messages.

## 6. Frontend File-by-File Guide

### frontend/src/main.jsx

React entry point.

Code logic:

- Creates React root.
- Wraps app in `BrowserRouter`.
- Uses basename `/ID-Generator`.
- Imports global CSS.

Business logic:

- Sets up browser routing and global styles.

### frontend/src/App.jsx

Route tree.

Code logic:

- `AppLayout` shows `Navbar` above app pages.
- Unknown routes redirect to `/`.

Business logic:

- Anyone with access to the app URL can open card features.

### frontend/src/services/api.js

Axios API client.

Code logic:

- Computes API base URL.
- Exposes `templateAPI`, `cardAPI`, and `uploadAPI`.
- Resolves backend image paths into full URLs.

Business logic:

- Centralizes frontend/backend communication.

### frontend/src/components/Navbar.jsx

Main navigation.

Code logic:

- Shows links for Home, Templates, Builder, Generate, Saved Cards.

Business logic:

- Gives users access to the main workflows.

### frontend/src/pages/Home.jsx

Landing/dashboard page.

Code logic:

- Shows overview content.
- Links to template gallery and builder.

Business logic:

- Starting point for the app.

### frontend/src/pages/TemplateGallery.jsx

Template browser.

Code logic:

- Fetches templates by selected category.
- Displays template cards.
- Shows selected template preview.
- Links to generate card and view cards for a template.

Business logic:

- Lets admins choose a template before card generation.

### frontend/src/pages/TemplateBuilder.jsx

Custom template builder.

Code logic:

- Stores template settings, design, card size, and fields in state.
- Adds/removes fields.
- Validates template name and unique field keys.
- Sends `templateAPI.create`.
- Shows live preview with current template object.

Business logic:

- Lets admins define their own card layout without coding.

### frontend/src/components/FieldEditor.jsx

Field editing UI.

Code logic:

- Updates one field at a time.
- Supports label, key, type, side, position, size, typography, image shape, required/show flags.
- Removes fields.

Business logic:

- Field definitions become both the generation form and the preview layout.

### frontend/src/pages/GenerateCard.jsx

Manual card generation page.

Code logic:

- Loads templates and optional saved card by `cardId`.
- Tracks selected template and form data.
- Renders inputs dynamically from `selectedTemplate.fields`.
- Uploads image fields through `uploadAPI.image`.
- Validates required fields and email fields.
- Saves new cards or updates existing cards.
- Handles special DigiVal fields and QR data.

Business logic:

- Main manual workflow: fill data, preview card, upload photo, save generated card.

### frontend/src/components/CardPreview.jsx

Card renderer.

Code logic:

- Renders generic cards from template fields and styles.
- Renders special DigiVal front/back layout when `layoutKey === "digival"`.
- Renders text, image, textarea, and QR fields.
- Uses `QRCodeCanvas` for QR fields.
- Maintains active front/back side.
- Renders hidden export copies for both sides.

Business logic:

- Converts template design plus form data into the visible ID card.

### frontend/src/components/ExportButtons.jsx

PNG/PDF/print export tools.

Code logic:

- Clones export DOM nodes.
- Converts images into data URLs for canvas export.
- Copies QR canvas pixels into the clone.
- Uses `html2canvas` to create PNG.
- Uses `jsPDF` to create a PDF with front and back sides.
- Calls `window.print()` for print.

Business logic:

- Lets admins produce usable output after generating a card.

### frontend/src/pages/GeneratedCards.jsx

Saved cards page.

Code logic:

- Fetches all saved cards.
- Filters cards by template query parameter and DigiVal source/layout.
- Shows selected card preview.
- Supports edit link and delete action.
- Provides export buttons for selected saved card.

Business logic:

- Lets admins manage previously generated cards.

### frontend/src/styles/global.css

Application styling.

Code logic:

- Defines layout, navbar, forms, template cards, builder panels, preview card styles, DigiVal card styles, and responsive behavior.

Business logic:

- Makes the admin portal usable and keeps card previews visually consistent.

## 7. Data Models Explained Simply

### Template

A template answers:

- What size is the card?
- Is it vertical or horizontal?
- What does the front/back background look like?
- Which fields exist?
- Where should each field be placed?
- How should each field look?

Example field concept:

```json
{
  "label": "Employee Name",
  "key": "name",
  "type": "text",
  "side": "front",
  "required": true,
  "x": 20,
  "y": 205,
  "width": 220,
  "height": 32
}
```

The `key` is important because the generated card stores data under that key:

```json
{
  "formData": {
    "name": "Aisha Khan"
  }
}
```

### GeneratedCard

A generated card answers:

- Which template was used?
- What values were entered?
- Which photo/logo URLs were uploaded?
- What QR data should be used?
- Was it manual or from Google Form?
- What did the template look like at save time?

### AppSetting

Settings answer:

- What is the webhook secret?
- What are the Google Drive credentials?
- What are upload limits?
- Is background removal enabled?

## 8. Code Review Explanation Script

Use this structure in your review:

### Short Project Intro

This is a MERN-based ID card generator. The frontend is a React admin portal. The backend is an Express API. MongoDB stores templates and generated cards, and Google Drive stores uploaded images. The app supports both manual card generation and automatic DigiVal card creation from Google Form submissions.

### Access Explanation

The app no longer requires login or role checks. React routes render directly, and the frontend calls template, card, and upload APIs without bearer tokens. The Google Form webhook still validates `x-webhook-secret`.

### Template Explanation

Templates are blueprints for cards. A template stores card size, orientation, front/back design, and fields. Each field has a key, type, side, position, size, and style. The same fields are used to build the dynamic form and render the preview.

### Card Generation Explanation

When an admin selects a template, the frontend renders inputs based on the template fields. The entered values become `formData`. Images are uploaded first and replaced with backend image URLs. When the card is saved, MongoDB stores the form data, image URLs, QR data, and a snapshot of the template.

### Drive Storage Explanation

The app does not store large images inside MongoDB. Images are uploaded to Google Drive through the backend. The backend returns a `/api/files/:fileId` URL, and that URL is saved in the card data. The browser loads images through the backend, so Google credentials stay private.

### Google Form Explanation

The Google Form flow is an automation path for DigiVal cards. Apps Script sends form data and the uploaded photo's Drive file ID to the backend webhook. The backend validates the secret, normalizes fields, downloads and processes the photo, uploads it to Drive, and creates a generated card in MongoDB. Legacy `photoBase64` payloads are still accepted as a fallback.

### Export Explanation

The card preview renders both visible and hidden card sides. Export buttons clone the hidden DOM, inline images, copy QR canvas pixels, and use `html2canvas` for PNG and `jsPDF` for PDF output.

## 9. Important Validation And Security Points

- Uploads only accept image MIME types.
- Upload size is controlled by runtime config.
- Inline base64 images are rejected when saving cards.
- Google Form webhook requires `x-webhook-secret`.
- Duplicate Google Form submissions are prevented by `submissionId`.
- Default templates cannot be edited or deleted.
- Google Drive credentials stay on the backend.

## 10. Environment Variables

Minimum local backend setup:

```env
PORT=5000
MONGO_URI=your MongoDB connection string
```

For uploads:

```env
GOOGLE_DRIVE_FOLDER_ID=your Drive folder ID
GOOGLE_DRIVE_CLIENT_ID=your OAuth client ID
GOOGLE_DRIVE_CLIENT_SECRET=your OAuth client secret
GOOGLE_DRIVE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_DRIVE_REFRESH_TOKEN=your OAuth refresh token
```

For Google Form automation:

```env
WEBHOOK_SECRET=a long random webhook secret
```

Optional:

```env
REQUEST_BODY_LIMIT=50mb
UPLOAD_FILE_SIZE_LIMIT=5mb
BACKGROUND_REMOVAL_ENABLED=true
GOOGLE_FORM_REMOVE_BG=true
BG_REMOVAL_MODEL=small
BG_REMOVAL_MAX_DIMENSION=1024
```

## 11. Common Questions In Review

### Why not store images in MongoDB?

Because images are large. MongoDB should store card data and image URLs, while Google Drive stores the actual image files.

### Why is `/api/files/:fileId` public?

The file ID route is public, validates file ID format, and streams the image from Drive so previews and exports can load images normally.

### Why use a template snapshot?

So saved cards keep their original design even if the template is changed later.

### Why prevent editing default templates?

Default templates are seeded by the app. Protecting them keeps baseline templates stable.

### Why use a worker for background removal?

The background-removal package uses native image dependencies. Running it in a worker process avoids conflicts with the main API process.

### What is the difference between manual and Google Form cards?

Manual cards are created in the React UI. Google Form cards are created automatically by the webhook and saved with `source: "google-form"`.

## 12. End-to-End Demo Order

For a project review, demo in this order:

1. Open Template Gallery and explain seeded templates.
2. Open Template Builder and explain fields, positions, and preview.
3. Generate a card from a template.
4. Upload a photo and explain Drive storage.
5. Save the generated card.
6. Open Saved Cards and show edit/delete/export.
7. Explain Google Form automation with the webhook flow.
8. Show that app routes are available without login and that the webhook still uses `x-webhook-secret`.

## 13. One-Minute Summary

This project is a MERN ID card generation system. React pages call Express APIs directly without login. Templates in MongoDB define card design and dynamic fields. The frontend uses those fields to build forms and live previews. Uploaded images go through the backend, optionally through background removal, then into Google Drive. Generated cards store form data, image URLs, QR data, and a template snapshot in MongoDB. A separate Google Form webhook can automatically create DigiVal cards from submitted form data and uploaded photos.
