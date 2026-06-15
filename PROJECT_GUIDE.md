# ID Generator Project Guide

## 1. Project Overview

This project is a MERN ID Card Generator. It has a React admin portal, an Express backend, MongoDB persistence, Google Drive image storage, and an optional Google Form automation flow for DigiVal employee ID cards.

The project supports two main workflows:

```txt
Manual admin workflow:
Admin login -> select or create template -> enter card data -> upload image -> preview -> save -> export

Google Form workflow:
Google Form submit -> Apps Script -> backend webhook -> photo processing -> Google Drive -> MongoDB -> Saved Cards
```

The frontend is responsible for user interaction, form state, preview rendering, export controls, and navigation. The backend is responsible for authentication, route protection, validation, MongoDB writes, image processing, Google Drive upload/download, and Google Form webhook processing.

Important note about unnecessary content:

- There is no frontend Settings page.
- There is no settings controller or settings route in the current app.
- App Settings should not be presented as a project functionality.
- In demos and explanations, focus on the real features: auth, templates, generation, uploads, saved cards, export, and Google Form automation.

## 2. Main Technologies

Frontend:

- React 18
- Vite
- React Router
- Axios
- qrcode.react
- html2canvas
- jsPDF
- Plain CSS

Backend:

- Node.js
- Express
- MongoDB
- Mongoose
- Multer memory uploads
- Google Drive API through `googleapis`
- `@imgly/background-removal-node`
- Node `crypto` for custom signed auth tokens

Storage:

- MongoDB stores admin login, templates, and generated card records.
- Google Drive stores uploaded and processed card images.
- The browser receives image URLs through the backend, not direct Drive credentials.

## 3. Folder Structure

```txt
backend/
  api/index.js
  config/
    db.js
    googleDrive.js
  controllers/
    authController.js
    cardController.js
    googleFormController.js
    templateController.js
  integrations/
    google-form-apps-script.gs
  middleware/
    authMiddleware.js
    errorMiddleware.js
    uploadMiddleware.js
  models/
    GeneratedCard.js
    StaticAuth.js
    Template.js
  routes/
    authRoutes.js
    cardRoutes.js
    fileRoutes.js
    googleFormRoutes.js
    templateRoutes.js
    uploadRoutes.js
  utils/
    authTokenService.js
    backgroundRemoval.js
    backgroundRemovalWorker.js
    defaultTemplates.js
    googleDriveStorage.js
    staticAuthService.js
  server.js

frontend/
  src/
    components/
      CardPreview.jsx
      ExportButtons.jsx
      FieldEditor.jsx
      Navbar.jsx
      ProtectedRoute.jsx
      PublicRoute.jsx
    context/
      AuthContext.jsx
    pages/
      GenerateCard.jsx
      GeneratedCards.jsx
      Home.jsx
      Login.jsx
      TemplateBuilder.jsx
      TemplateGallery.jsx
    services/
      api.js
    styles/
      global.css
```

## 4. Backend Startup Flow

Important file:

```txt
backend/server.js
```

Startup behavior:

1. `dotenv.config()` loads environment variables from `.env`.
2. Express app is created.
3. Request body limits are read from `getAppConfig()`.
4. CORS is enabled for API access.
5. JSON and URL-encoded body parsers are registered.
6. `/`, `/health`, and `/uploads` static route are registered.
7. For `/api` requests, `ensureServerReady` makes sure the backend has completed startup preparation.
8. Startup preparation connects to MongoDB, checks auth secret availability, and seeds default templates.
9. Public API routes are mounted.
10. Protected admin API routes are mounted behind `protect`.
11. 404 and error middleware are mounted.

Startup preparation:

```txt
prepareServer()
  -> connectDB()
  -> assertAuthSecretConfigured()
  -> seedDefaultTemplates()
```

Why the startup is structured this way:

- Health endpoints can respond simply.
- API routes wait until MongoDB is ready.
- Default templates are available automatically.
- Protected routes cannot run until auth token signing can work.
- The same Express app can run locally or in serverless deployment.

## 5. API Route Map

Public routes:

```txt
POST /api/auth/login
GET  /api/files/:fileId
GET  /api/google-form/health
POST /api/google-form/digival-card
```

Protected routes:

```txt
GET    /api/auth/me
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

Route protection:

- Public routes do not require the admin token.
- `/api/files/:fileId` is public because normal `<img src="">` requests cannot send an Authorization header.
- Google Form webhook is public from login, but protected by `x-webhook-secret`.
- Admin routes require `Authorization: Bearer <token>`.

## 6. MongoDB Collections

### static_auth

Stores the single admin login account.

Example:

```json
{
  "key": "admin-signin",
  "username": "admin",
  "password": "Admin@123"
}
```

Used by:

```txt
backend/models/StaticAuth.js
backend/utils/staticAuthService.js
backend/controllers/authController.js
```

Important behavior:

- Password is defined with `select: false` in the schema.
- Login logic explicitly loads it using `.select("+password")`.
- Username and password comparison uses `crypto.timingSafeEqual`.
- There is no admin registration screen.
- There is no public admin creation endpoint.

Production note:

- The current project stores the password directly because this is how the project is currently built.
- For a production-grade system, use password hashing with bcrypt or argon2.

### templates

Stores reusable ID card templates.

Each template can contain:

- `templateName`
- `slug`
- `layoutKey`
- `category`
- `orientation`
- `cardSize`
- `frontDesign`
- `backDesign`
- `fields`
- `styles`
- `isDefault`

Template fields control the dynamic generator form and the preview layout.

Important field properties:

```txt
label, key, type, side, required, defaultValue, show,
x, y, width, height,
fontSize, fontWeight, fontColor, align,
bold, italic, underline,
imageShape
```

Default templates are seeded by:

```txt
backend/utils/defaultTemplates.js
```

Default templates cannot be edited or deleted directly through the backend. Custom templates can be created from the builder.

### generatedcards

Stores saved card records.

Important fields:

- `templateId`: reference to the template.
- `formData`: data entered by the admin or received from Google Form.
- `photo`: final photo URL.
- `logo`: optional logo URL.
- `qrData`: data used by QR rendering.
- `source`: `manual` or `google-form`.
- `googleSubmissionId`: prevents duplicate Google Form processing.
- `uploadsPersisted`: marks that images are stored outside MongoDB.
- `templateSnapshot`: copy of the template at save time.

Why `templateSnapshot` matters:

- If the original template changes later, the saved card still has the layout that was used when it was created.
- Saved cards can still render even if the original populated template reference is incomplete.

### Runtime Config Note

There is no App Settings feature in the admin portal. The guide should not present App Settings as one of the project modules.

The code has internal runtime config helpers:

```txt
backend/utils/appConfig.js
```

This is runtime plumbing only. It reads values such as `AUTH_SECRET`, `WEBHOOK_SECRET`, Drive credentials, upload limits, and background-removal options. In the project explanation, describe these as backend configuration values, not as a separate app feature.

## 7. Authentication Logic

Important backend files:

```txt
backend/controllers/authController.js
backend/utils/staticAuthService.js
backend/utils/authTokenService.js
backend/middleware/authMiddleware.js
backend/models/StaticAuth.js
```

Important frontend files:

```txt
frontend/src/pages/Login.jsx
frontend/src/context/AuthContext.jsx
frontend/src/services/api.js
frontend/src/components/ProtectedRoute.jsx
frontend/src/components/PublicRoute.jsx
frontend/src/components/Navbar.jsx
```

### Login Request Flow

```txt
Login form
  -> AuthContext.login()
  -> authAPI.login()
  -> POST /api/auth/login
  -> authController.login()
  -> validateAdminLogin()
  -> StaticAuth.findOne({ key: "admin-signin" }).select("+password")
  -> timing-safe username/password comparison
  -> createAuthToken()
  -> frontend stores token and user
```

The login controller does this:

1. Reads `username` and `password` from `req.body`.
2. Trims the username.
3. Rejects missing credentials with `400`.
4. Calls `validateAdminLogin`.
5. If the admin document is missing, returns `503`.
6. If credentials are wrong, returns `401`.
7. If credentials are correct, creates a signed token.
8. Sends the token and admin user object to the frontend.

Successful response shape:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "base64urlPayload.base64urlSignature",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### Credential Validation

File:

```txt
backend/utils/staticAuthService.js
```

The admin account is loaded from MongoDB:

```txt
StaticAuth.findOne({ key: "admin-signin" }).select("+password")
```

The comparison is not a normal `===` comparison. The service converts both values into buffers and uses:

```txt
crypto.timingSafeEqual(actual, expected)
```

Why this is used:

- It avoids leaking tiny timing differences during string comparison.
- It keeps username and password comparison behavior consistent.

Length mismatch returns false before calling `timingSafeEqual`, because `timingSafeEqual` requires equal-length buffers.

### Token Generation

File:

```txt
backend/utils/authTokenService.js
```

This project uses a custom signed token, not `jsonwebtoken`.

Token structure:

```txt
base64url(JSON payload).base64url(HMAC signature)
```

Payload example:

```json
{
  "username": "admin",
  "role": "admin",
  "exp": 1780000000000
}
```

Generation steps:

1. Build the payload with username, role, and expiry time.
2. Convert the payload JSON to Base64URL.
3. Sign the encoded payload with HMAC SHA-256.
4. Join payload and signature using a dot.

Signature logic:

```txt
HMAC-SHA256(encodedPayload, AUTH_SECRET)
```

Token expiry:

```txt
24 hours
```

`AUTH_SECRET` behavior:

- If configured, it is used to sign and verify tokens.
- In production or Vercel, missing `AUTH_SECRET` throws an error.
- In local development, a temporary in-memory secret is generated if `AUTH_SECRET` is missing.
- A temporary secret means tokens become invalid when the backend process restarts.

### Token Verification

Verification steps:

```txt
Bearer token received
  -> split token by "."
  -> reject if it does not have exactly two parts
  -> recreate expected HMAC signature from encoded payload
  -> compare signatures with timingSafeEqual
  -> decode payload JSON
  -> reject if username is missing
  -> reject if exp is missing
  -> reject if Date.now() > exp
  -> return payload
```

Invalid tokens return `null` from `verifyAuthToken`. The middleware then returns `401`.

### Route Authentication

File:

```txt
backend/middleware/authMiddleware.js
```

Protected route logic:

1. Read `Authorization` header.
2. Confirm it starts with `Bearer `.
3. Extract the token.
4. Call `verifyAuthToken(token)`.
5. If invalid or expired, return `401`.
6. If valid, attach this object to the request:

```js
req.user = {
  username: decoded.username,
  role: decoded.role
};
```

After that, the request continues to the protected controller.

### Frontend Auth State

File:

```txt
frontend/src/context/AuthContext.jsx
```

The frontend stores:

```txt
localStorage key: id_generator_auth_token
localStorage key: id_generator_auth_user
```

`AuthProvider` initializes state from localStorage:

```txt
token state -> getAuthToken()
user state  -> getStoredAuthUser()
```

When login succeeds:

1. `AuthContext.login` calls the backend.
2. The returned token is written to localStorage.
3. The returned user is written to localStorage.
4. React state is updated.
5. `isAuthenticated` becomes true.
6. `ProtectedRoute` allows the admin pages to render.

When logout happens:

1. `clearAuthToken()` removes token and user from localStorage.
2. React state is set to `null`.
3. `Navbar` navigates to `/login`.

### Axios Auth Interceptor

File:

```txt
frontend/src/services/api.js
```

Before every API request:

```txt
api.interceptors.request
  -> read token from localStorage
  -> if token exists, set Authorization: Bearer <token>
```

When an API response is `401`:

```txt
api.interceptors.response
  -> clear stored auth
  -> redirect to /login
```

This means expired or invalid tokens automatically send the user back to login.

### Protected and Public Routes

Files:

```txt
frontend/src/components/ProtectedRoute.jsx
frontend/src/components/PublicRoute.jsx
```

Protected route behavior:

- If `isAuthenticated` is false, redirect to `/login`.
- It also keeps the previous location in route state.
- After login, the user can be sent back to the page they originally tried to open.

Public route behavior:

- If already authenticated, redirect away from `/login` to `/`.
- This prevents logged-in admins from seeing the login page again.

## 8. How Data Moves From Backend To Frontend

The data flow uses JSON APIs plus image URLs.

General API flow:

```txt
React component
  -> API helper in frontend/src/services/api.js
  -> Axios request
  -> Express route
  -> controller
  -> Mongoose model or utility
  -> JSON response
  -> React state update
  -> UI re-renders
```

Example: loading templates:

```txt
TemplateGallery useEffect
  -> templateAPI.getAll(category)
  -> GET /api/templates?category=Office
  -> templateController.getTemplates
  -> Template.find(filter).sort(...)
  -> res.json(templates)
  -> setTemplates(response.data)
  -> selected template preview updates
```

Example: saving a card:

```txt
GenerateCard saveCard()
  -> cardAPI.create(payload)
  -> POST /api/cards
  -> cardController.createGeneratedCard
  -> Template.findById(templateId)
  -> reject inline base64 images
  -> GeneratedCard.create(...)
  -> res.status(201).json(card)
  -> setEditingSavedCardId(response.data._id)
  -> navigate to /generate/:templateId?cardId=:cardId
```

Example: image loading:

```txt
Backend returns imageUrl: /api/files/:fileId
  -> frontend resolveApiAssetUrl()
  -> browser requests GET /api/files/:fileId
  -> backend downloads file from Google Drive
  -> backend streams image bytes to browser
  -> CardPreview renders <img src="...">
```

The frontend never receives Google Drive credentials. It receives only backend URLs that are safe for browser image rendering.

## 9. Frontend Hook Usage

This project uses React hooks to keep page state, run API calls, share authentication state, and compute filtered data.

### useState

Used for component state.

Examples:

- `Login.jsx`: stores username, password, loading status, and error message.
- `AuthContext.jsx`: stores current token and user.
- `TemplateGallery.jsx`: stores templates, selected category, selected template, loading state.
- `TemplateBuilder.jsx`: stores template design values and fields.
- `GenerateCard.jsx`: stores templates, selected template, form data, QR data, selected card being edited, loading, and saving.
- `GeneratedCards.jsx`: stores saved cards, selected card, and active filter.
- `CardPreview.jsx`: stores active card side, front or back.
- `ExportButtons.jsx`: stores whether export is currently running.

Example from generator behavior:

```txt
formData state changes
  -> CardPreview receives new formData prop
  -> preview re-renders immediately
```

### useEffect

Used for side effects, mainly API calls after render or after dependency changes.

Examples:

`TemplateGallery.jsx`:

```txt
category changes
  -> useEffect runs
  -> fetch templates for category
  -> update templates and selectedTemplate
```

`GenerateCard.jsx` initial load:

```txt
templateId/cardId changes
  -> useEffect runs
  -> fetch all templates
  -> if cardId exists, fetch saved card
  -> populate formData and selected template ID
```

`GenerateCard.jsx` selected template load:

```txt
selectedTemplateId changes
  -> useEffect runs
  -> fetch template by ID
  -> setSelectedTemplate
  -> create empty form data for its fields when not editing
```

`GeneratedCards.jsx`:

```txt
page mounts
  -> fetch saved cards
```

Another effect keeps the selected saved card valid when filters change.

### useMemo

Used when a computed value should only be rebuilt when its inputs change.

`AuthContext.jsx`:

```txt
useMemo builds the context value from token and user
```

This keeps the context object stable between renders unless auth state changes.

`GeneratedCards.jsx`:

```txt
useMemo filters cards by templateId and DigiVal filter
```

This avoids recalculating filtered cards on unrelated renders.

### useContext

Used through the custom `useAuth()` hook.

Flow:

```txt
AuthProvider wraps the app
  -> useAuth() reads AuthContext
  -> Login gets login()
  -> Navbar gets user and logout()
  -> ProtectedRoute and PublicRoute get isAuthenticated
```

The custom hook throws an error if someone tries to use it outside `AuthProvider`, which catches incorrect component usage early.

### React Router Hooks

Used for navigation and URL-driven state.

`useNavigate`:

- Login redirects after successful login.
- Navbar redirects after logout.
- Generate page updates the URL after template change or card save.

`useParams`:

- Generate page reads `templateId` from `/generate/:templateId`.

`useSearchParams`:

- Generate page reads `cardId` when editing a saved card.
- Generated Cards page reads `templateId` when showing cards for one template only.

### Hooks Not Used

The project does not currently use `useCallback`, `useReducer`, Redux, Zustand, or React Query. State management is simple enough to stay inside React state, context, effects, and memoized derived data.

## 10. Frontend API Client

Important file:

```txt
frontend/src/services/api.js
```

The API base URL is selected like this:

```txt
VITE_API_BASE_URL
  ||
ngrok backend if VITE_USE_NGROK_BACKEND=true
  ||
http://localhost:5000/api
```

The helper normalizes the base URL:

- If the value already ends with `/api`, it is used as-is.
- If it does not end with `/api`, `/api` is appended.

Exported API groups:

```txt
authAPI
templateAPI
cardAPI
uploadAPI
```

Asset URL resolution:

```txt
resolveApiAssetUrl(value)
```

This function makes image URLs usable in the browser:

- Data URLs, blob URLs, and full HTTP URLs are returned directly.
- `/api/...` URLs are prefixed with the API origin.
- Other absolute paths are prefixed with the API origin.

This is important because backend image URLs are often stored as:

```txt
/api/files/:fileId
```

The frontend converts them into:

```txt
https://backend-domain.com/api/files/:fileId
```

or local equivalent.

## 11. Template Functionality

Important backend files:

```txt
backend/models/Template.js
backend/controllers/templateController.js
backend/routes/templateRoutes.js
backend/utils/defaultTemplates.js
```

Important frontend files:

```txt
frontend/src/pages/TemplateGallery.jsx
frontend/src/pages/TemplateBuilder.jsx
frontend/src/components/FieldEditor.jsx
frontend/src/components/CardPreview.jsx
```

### Template Gallery Flow

```txt
TemplateGallery mounts
  -> useEffect fetches templates
  -> templateAPI.getAll(category)
  -> backend filters by category if not "All"
  -> templates stored in state
  -> first template selected for preview
```

The category filter calls the backend with:

```txt
GET /api/templates?category=Office
```

If category is `All`, no category filter is sent.

### Template Builder Flow

The builder keeps a template object in React state.

State groups:

- Template name
- Category
- Orientation
- Card size
- Front design
- Back design
- Fields
- Saving status

When the admin changes values, the template preview updates immediately because `CardPreview` receives the current in-memory template object.

Field editor behavior:

```txt
Add Field
  -> create field with generated key field1, field2, ...
  -> fields state updates
  -> CardPreview receives new field list
```

When a field is edited:

```txt
updateField(index, key, value)
  -> copy fields array
  -> update selected field
  -> setFields(updatedFields)
```

This avoids mutating React state directly.

### Template Validation

Frontend validation:

- Template name is required.
- Every field must have a label.
- Every field must have a key.
- Field keys must be unique.

Backend validation repeats the important checks:

- Template name is required.
- Field labels are required.
- Field keys are required.
- Duplicate field keys are rejected.

The backend also forces:

```txt
isDefault = false
delete slug
```

for custom templates. This prevents admins from creating templates that conflict with seeded default template slugs.

### Default Template Protection

The backend blocks editing or deleting default templates:

```txt
if (template.isDefault) reject
```

Why:

- Default templates are seeded at startup.
- They are treated as base templates.
- Custom templates should be created separately.

## 12. Dynamic Card Generation

Important frontend file:

```txt
frontend/src/pages/GenerateCard.jsx
```

Important backend file:

```txt
backend/controllers/cardController.js
```

### Loading The Generator

The page supports:

```txt
/generate
/generate/:templateId
/generate/:templateId?cardId=:cardId
```

Initial load flow:

```txt
GenerateCard mounts
  -> fetch all templates
  -> if cardId exists, fetch saved card
  -> set formData from saved card
  -> set qrData from saved card
  -> set selectedTemplateId
  -> fetch selected template
```

If no card is being edited:

```txt
selected template fields
  -> buildEmptyFormData(fields)
  -> formData = { [field.key]: "" }
```

### Dynamic Form Rendering

The generator does not hardcode all card fields. It reads:

```txt
selectedTemplate.fields
```

Each field controls which input appears:

- `text` -> text input
- `email` -> email input
- `number` -> number input
- `date` -> date input
- `phone` -> text input
- `textarea` -> textarea
- `image` -> file input
- `qr` -> rendered in preview, not as a normal form input

When an input changes:

```txt
updateValue(field.key, newValue)
  -> update formData
  -> update qrData
  -> CardPreview re-renders
```

For generic templates, QR data defaults to JSON stringified form data. For DigiVal templates, QR data is fixed to:

```txt
STATIC_DIGIVAL_QR
```

### Manual Image Upload In The Generator

When the admin selects an image file:

```txt
handleImageUpload(fieldKey, file)
  -> reject non-image files in browser
  -> uploadAPI.image(file, options)
  -> POST /api/uploads/photo
  -> backend uploads image to Google Drive
  -> response contains imageUrl
  -> formData[fieldKey] = imageUrl
  -> preview updates
```

For photo fields, the frontend asks the backend to remove background:

```txt
removeBackground: fieldKey === "photo"
```

For DigiVal photos, the frontend also stores photo positioning defaults:

```json
{
  "photoX": "0",
  "photoY": "0",
  "photoWidth": "300",
  "photoHeight": "346"
}
```

### Form Validation Before Save

Before saving:

- Required fields must have values.
- Email fields must match a basic email pattern.
- A template must be selected.

If validation fails, the save request is not sent.

### Save Card Flow

Payload sent by frontend:

```json
{
  "templateId": "template Mongo ID",
  "formData": {
    "name": "Employee Name",
    "employeeId": "EMP001",
    "photo": "/api/files/driveFileId"
  },
  "photo": "/api/files/driveFileId",
  "logo": "",
  "qrData": "STATIC_DIGIVAL_QR",
  "templateSnapshot": {}
}
```

Backend save flow:

```txt
POST /api/cards
  -> require templateId
  -> Template.findById(templateId)
  -> reject inline data:image values
  -> copy template into templateSnapshot
  -> GeneratedCard.create(...)
  -> return saved card
```

Important backend rule:

```txt
Inline base64 images are rejected.
```

Reason:

- MongoDB records should stay small.
- Base64 image fields can exceed request limits.
- The project uses Google Drive for persistent image storage.
- Saved cards should store Drive-backed URLs, not raw image bytes.

### Edit Saved Card Flow

Edit link:

```txt
/generate/:templateId?cardId=:cardId
```

Flow:

```txt
GenerateCard sees cardId
  -> cardAPI.getById(cardId)
  -> fill formData from saved card
  -> set editingSavedCardId
  -> save button becomes Update Card
  -> cardAPI.update(cardId, payload)
```

## 13. Card Preview Rendering

Important file:

```txt
frontend/src/components/CardPreview.jsx
```

The preview supports two rendering modes:

```txt
generic layout
digival layout
```

### Generic Layout

Generic templates are rendered from the template field definitions.

Rendering flow:

```txt
CardPreview
  -> CardSide
  -> GenericCardSide
  -> fields filtered by side
  -> renderField(field, formData, qrData)
```

For each field:

- Position comes from `x` and `y`.
- Size comes from `width` and `height`.
- Font styling comes from field style values.
- Image fields render `<img>`.
- QR fields render `QRCodeCanvas`.
- Hidden fields are skipped if `show === false`.

Design values:

- `frontDesign` controls the front side background, border, radius, and shadow.
- `backDesign` controls the back side.
- `cardSize` controls width and height.

### DigiVal Layout

DigiVal uses a special fixed layout:

```txt
layoutKey: "digival"
```

Special rendering:

- Front side uses DigiVal logo, dot patterns, employee photo, name, and employee ID.
- Back side uses DigiVal logo, static QR image, blood group, office address, phone, and website.
- Photo positioning can be adjusted with `photoX`, `photoY`, `photoWidth`, and `photoHeight`.
- DigiVal QR uses a static image from `frontend/public/digival/digival-qr.png`.

### Preview Side State

`CardPreview` uses:

```txt
activeSide state: "front" or "back"
```

The preview toolbar changes `activeSide`, and the card side re-renders.

### Hidden Export Stage

The component also renders hidden export versions:

```txt
#front-card-export
#back-card-export
```

These hidden nodes are used by `ExportButtons` for PNG/PDF generation. They make sure both front and back can be exported even when only one side is currently visible in the preview.

## 14. Image Upload, Background Removal, And Drive Storage

Important files:

```txt
frontend/src/services/api.js
backend/routes/uploadRoutes.js
backend/middleware/uploadMiddleware.js
backend/utils/backgroundRemoval.js
backend/utils/backgroundRemovalWorker.js
backend/utils/googleDriveStorage.js
backend/config/googleDrive.js
backend/routes/fileRoutes.js
```

### Upload From Frontend

Frontend sends `FormData`:

```txt
photo: File
removeBackground: "true" or omitted
fileName: optional stable file name
```

Request:

```txt
POST /api/uploads/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Multer Upload Parsing

Multer uses memory storage:

```txt
multer.memoryStorage()
```

Accepted MIME types:

- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`

Rejected file types return `400`.

Files larger than the configured upload limit return `413`.

The parsed file is available as:

```txt
req.file.buffer
req.file.originalname
req.file.mimetype
req.file.size
```

### Background Removal

If `removeBackground` is requested and background removal is enabled:

```txt
upload route
  -> removeBackgroundFromUpload(req.file)
  -> child process runs backgroundRemovalWorker.js
  -> output becomes PNG
  -> PNG buffer replaces original upload buffer
```

Why a child process is used:

- The remover package uses native image tooling.
- Running it separately avoids native dependency conflicts in the main Express process.
- Worker failures can be caught and returned as clear API errors.

Worker flow:

```txt
write temp input file
write temp request JSON
spawn backgroundRemovalWorker.js
worker normalizes image with sharp
worker calls removeBackground()
worker writes output.png
parent reads output buffer
parent cleans temp files
```

Output:

- Always PNG.
- File name is normalized to `.png`.
- Model is limited to `small` or `medium`.
- Max dimension is clamped to a safe range.

### Google Drive Upload

Flow:

```txt
uploadBufferToDrive(file)
  -> check file buffer exists
  -> read Drive folder ID
  -> sanitize file name
  -> get Google Drive client
  -> find existing file by name in folder
  -> replace existing file or create new file
  -> return /api/files/:fileId
```

Why existing files are replaced:

- Employee photo names can stay stable, for example `EMP001-photo.png`.
- Re-uploading a corrected photo updates the Drive file instead of creating many duplicates.

Upload response example:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "backgroundRemoved": true,
  "imageUrl": "/api/files/driveFileId?v=timestamp",
  "fileId": "driveFileId",
  "file": {
    "fileId": "driveFileId",
    "fileName": "EMP001-photo.png",
    "mimeType": "image/png",
    "size": 123456,
    "imageUrl": "/api/files/driveFileId?v=timestamp",
    "wasReplaced": true
  }
}
```

The `?v=timestamp` value helps the browser load the newest image instead of showing a cached old image.

### Google Drive Authentication

The backend supports:

1. OAuth refresh token credentials.
2. Service account credentials.

OAuth values:

```txt
GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_DRIVE_REDIRECT_URI
GOOGLE_DRIVE_REFRESH_TOKEN
```

Service account values:

```txt
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SERVICE_ACCOUNT_JSON
```

The Google Drive client is cached and recreated only when credential values change.

### File Streaming Back To Browser

Browser image request:

```txt
GET /api/files/:fileId
```

Backend behavior:

1. Validate file ID format.
2. Download file metadata and media stream from Google Drive.
3. Convert stream to buffer.
4. Set image/CORS/cache headers.
5. Send image bytes to the browser.

This makes images usable in previews and exports without exposing Google Drive credentials.

## 15. Generated Cards Page

Important files:

```txt
frontend/src/pages/GeneratedCards.jsx
backend/controllers/cardController.js
```

Page load flow:

```txt
GeneratedCards mounts
  -> cardAPI.getAll()
  -> GET /api/cards
  -> GeneratedCard.find().populate("templateId", ...)
  -> cards stored in state
  -> first card selected
```

Filter behavior:

- `activeFilter = "all"` shows all cards.
- `activeFilter = "digival"` shows only DigiVal cards.
- URL query `templateId` filters cards for a specific template.

The filtered card list is computed with `useMemo`.

Selecting a card:

```txt
click saved card
  -> setSelectedCard(card)
  -> CardPreview receives selectedCard.templateSnapshot and selectedCard.formData
```

Deleting a card:

```txt
Delete button
  -> confirm()
  -> cardAPI.delete(card._id)
  -> DELETE /api/cards/:id
  -> refresh card list
```

Editing a card:

```txt
Edit button
  -> /generate/:templateId?cardId=:cardId
  -> GenerateCard loads existing card data
```

## 16. Export Functionality

Important files:

```txt
frontend/src/components/ExportButtons.jsx
frontend/src/components/CardPreview.jsx
```

Export options:

- Download front PNG.
- Download back PNG.
- Download PDF.
- Print.

### PNG Export Flow

```txt
Download Front PNG
  -> renderElementToCanvas("front-card-export")
  -> clone export DOM node
  -> copy QR canvas pixels
  -> inline remote images as data URLs
  -> html2canvas renders clone
  -> canvas.toDataURL("image/png")
  -> browser downloads PNG
```

Why images are inlined:

- Browser canvas export can fail when remote images are not CORS-safe.
- The export code fetches image URLs and converts them to data URLs before rendering.

Why QR canvas pixels are copied:

- QR codes are rendered as `<canvas>`.
- Cloning a canvas does not automatically copy its pixels.
- `copyCanvasPixels` copies the QR image into the cloned canvas before html2canvas runs.

### PDF Export Flow

```txt
Download PDF
  -> render front export node to canvas
  -> render back export node to canvas
  -> create jsPDF A4 document
  -> add front image
  -> add back image
  -> save id-card.pdf
```

### Print

Print uses:

```txt
window.print()
```

The browser print dialog handles final print output.

## 17. Google Form Automation

Important files:

```txt
backend/integrations/google-form-apps-script.gs
backend/controllers/googleFormController.js
backend/routes/googleFormRoutes.js
backend/models/GeneratedCard.js
```

### Google Form Fields

Expected form fields:

```txt
Name
Employee ID
Blood Group
Phone Number
Email Address
Photo or ID Card Image
```

The Apps Script has `FIELD_TITLES`. These values must match the Google Form question titles or Google Sheet column headers.

### Apps Script Flow

```txt
Google Form submitted
  -> onFormSubmit(e) runs
  -> read WEBHOOK_SECRET from script properties
  -> read BACKEND_URL from script properties
  -> read text answers
  -> resolve uploaded photo file
  -> read Drive blob
  -> convert blob bytes to base64
  -> build payload
  -> POST payload to backend webhook
```

The script can find the uploaded file in three ways:

1. From the form response object.
2. From `namedValues` if it contains a Drive URL or file ID.
3. From the linked sheet cell if it contains a rich text link, formula, display value, or raw value.

Payload sent to backend:

```json
{
  "name": "Employee Name",
  "employeeId": "EMP001",
  "bloodGroup": "O+",
  "phone": "9876543210",
  "email": "employee@example.com",
  "photoBase64": "base64 image bytes",
  "photoMimeType": "image/png",
  "submissionId": "unique submission id"
}
```

The request includes:

```txt
x-webhook-secret: shared secret value
```

### Backend Webhook Flow

Endpoint:

```txt
POST /api/google-form/digival-card
```

Backend steps:

```txt
get runtime config
  -> validate WEBHOOK_SECRET
  -> normalize field aliases
  -> check required fields
  -> validate email
  -> check duplicate googleSubmissionId
  -> find DigiVal template
  -> decode base64 image
  -> validate image MIME type and size
  -> remove background if enabled
  -> upload photo to Google Drive
  -> create GeneratedCard record
  -> return saved card
```

Required fields:

- `name`
- `employeeId`
- `bloodGroup`
- `phone`
- `email`
- `photoBase64`

Duplicate prevention:

```txt
GeneratedCard.findOne({ googleSubmissionId: payload.submissionId })
```

If the same Google Form submission is sent again, the backend returns the already-created card instead of creating a duplicate.

Template lookup:

```txt
find template by configured DigiVal slug
  ||
find first template with layoutKey: "digival"
```

Saved card values:

```json
{
  "source": "google-form",
  "qrData": "STATIC_DIGIVAL_QR",
  "uploadsPersisted": true,
  "googleSubmissionId": "submission id"
}
```

Why base64 is used for Google Form photos:

- Apps Script can read the uploaded photo blob directly.
- The backend does not need permission to read the original form upload folder.
- The backend only needs permission for the final Drive output folder.

## 18. Error Handling

Important files:

```txt
backend/middleware/errorMiddleware.js
backend/middleware/uploadMiddleware.js
backend/routes/uploadRoutes.js
```

Common error responses:

```txt
400 - missing required input, invalid file type, invalid ID format
401 - missing/invalid/expired auth token or invalid webhook secret
404 - template/card/file/route not found
413 - request body or uploaded file too large
500 - missing server config or unexpected server error
502 - Google Form photo could not be processed or saved to Drive
```

Specific backend handling:

- Mongoose `CastError` returns `400 Invalid ID format`.
- Duplicate key error `11000` returns `400 Duplicate value already exists`.
- Body parser `entity.too.large` returns `413 Request body is too large`.
- Multer file size limit returns `413 Image file is too large`.
- Upload file type validation returns `400`.

Frontend behavior:

- Most pages display backend error messages with `alert`.
- Login displays the error inside the login card.
- A `401` response clears auth and redirects to login through the Axios interceptor.

## 19. Security Decisions

Current protections:

- Admin routes require signed auth token.
- Token expires after 24 hours.
- Token signature uses HMAC SHA-256 and `AUTH_SECRET`.
- Token verification uses timing-safe signature comparison.
- Admin login checks MongoDB `static_auth`.
- Google Form webhook requires `x-webhook-secret`.
- Manual card save rejects inline base64 images.
- Google Drive credentials stay in the backend.
- Browser receives only backend image URLs.

Known limitations:

- Admin password is stored directly in MongoDB.
- There is only one admin role.
- CORS is currently open for flexible local, hosted, ngrok, and Apps Script testing.
- There is no audit log for admin actions.
- There is no retry queue for failed Google Form submissions.

Recommended production improvements:

- Hash admin passwords.
- Restrict CORS to known frontend domains.
- Add role-based access if multiple admin types are needed.
- Add audit logging for create/update/delete actions.
- Add retry/error tracking for Google Form webhook failures.

## 20. Setup Summary

Backend:

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Required backend environment values:

```txt
MONGO_URI
AUTH_SECRET
WEBHOOK_SECRET
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_DRIVE_REFRESH_TOKEN
```

Required admin MongoDB document:

```json
{
  "key": "admin-signin",
  "username": "admin",
  "password": "Admin@123"
}
```

Frontend environment:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
```

or hosted backend:

```txt
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## 21. Demo Script

Use this flow when explaining the project:

1. Open the frontend login page.
2. Explain that login checks MongoDB `static_auth`.
3. Login and show the protected admin portal.
4. Open Templates and explain that templates come from MongoDB.
5. Show default templates seeded by the backend.
6. Open Builder and create a custom template field.
7. Explain that template fields control both the form and preview.
8. Open Generate and select a template.
9. Enter details and show live preview updating from React state.
10. Upload a photo and explain multipart upload, background removal, Drive storage, and returned image URL.
11. Save the card and explain `generatedcards`.
12. Open Saved Cards and show filtering, preview, edit, delete, and export.
13. Download PNG/PDF and explain html2canvas/jsPDF.
14. Open the Apps Script file and explain Google Form automation.
15. Explain `x-webhook-secret`, base64 photo transfer, duplicate submission prevention, and automatic DigiVal card creation.

Do not spend demo time on App Settings. It is not a user-facing feature in the current project.

## 22. Common Scenarios

### Invalid Login

If username or password does not match the MongoDB `static_auth` document, backend returns:

```txt
401 Invalid username or password
```

### Missing Admin Account

If the `admin-signin` document does not exist, login returns:

```txt
503 Admin account is not configured
```

### Expired Token

If a token is older than 24 hours:

```txt
protected API returns 401
frontend clears localStorage
frontend redirects to /login
```

### Invalid Upload Type

If the uploaded file is not PNG/JPG/JPEG/WEBP:

```txt
400 Only PNG, JPG, JPEG, and WEBP images are allowed
```

### Oversized Upload

If the upload is too large:

```txt
413 Image file is too large
```

### Drive Misconfiguration

If Drive folder or credentials are missing:

```txt
image upload fails
backend returns clear upload error
card save should not store raw base64 image data
```

### Duplicate Google Form Submission

If Apps Script sends the same `submissionId` again:

```txt
backend returns existing card
no duplicate generatedcard is created
```

### Missing Webhook Secret

If `WEBHOOK_SECRET` is missing:

```txt
Google Form webhook returns server config error
```

### Wrong Webhook Secret

If Apps Script sends the wrong secret:

```txt
401 Invalid webhook secret
```

## 23. What Is Not Used As A Feature

These should not be presented as active user-facing modules:

- Frontend Settings page.
- Settings route or settings controller.
- Admin registration page.
- Email/Nodemailer flow.
- Local disk image storage as the main persistence layer.
- Raw base64 image storage in generated card documents.
- Government ID generation such as Aadhaar, PAN, voter ID, passport, or driving license.

The actual project value is in:

- Mongo-backed admin authentication.
- Template-based dynamic forms.
- Live card preview.
- Google Drive image persistence.
- Manual card save/edit/export.
- Google Form to DigiVal ID card automation.

## 24. One-Minute Explanation

This is a MERN ID card generation system. The admin logs in with credentials stored in MongoDB. After login, the backend gives the frontend a signed 24-hour token. The frontend sends that token with protected API calls. Templates stored in MongoDB define both the dynamic form fields and the card preview layout. When the admin uploads a photo, the backend validates the file, optionally removes the background, uploads it to Google Drive, and returns a backend image URL. When a card is saved, MongoDB stores the entered data, image URLs, QR data, and a snapshot of the template. The saved card can then be previewed, edited, printed, or exported as PNG/PDF. For DigiVal automation, Apps Script reads a Google Form submission, sends the form data and photo bytes to the backend webhook, and the backend creates a saved DigiVal card automatically.
