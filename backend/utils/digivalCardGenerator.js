const fs = require("fs");
const os = require("os");
const path = require("path");
const sharp = require("sharp");

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
const assetDir = path.join(__dirname, "../assets/digival");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  // Serverless runtimes can expose the project directory as read-only.
}

const escapeXml = value => {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const normalizeMimeType = mimeType => {
  const normalized = String(mimeType || "image/png").toLowerCase().trim();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
};

const getExtension = mimeType => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
};

const getSafeEmployeeId = employeeId => {
  return String(employeeId || "employee").replace(/[^a-zA-Z0-9_-]/g, "") || "employee";
};

const toDataUrl = (mimeType, buffer) => {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

const writeImageFile = (fileName, buffer) => {
  const uploadPath = path.join(uploadDir, fileName);

  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(uploadPath, buffer);

    return {
      filePath: uploadPath,
      imageUrl: `/uploads/${fileName}`,
      persisted: true
    };
  } catch (error) {
    const tempPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tempPath, buffer);

    return {
      filePath: tempPath,
      imageUrl: "",
      persisted: false
    };
  }
};

const saveBase64Image = ({ base64, mimeType, employeeId }) => {
  const rawBase64 = String(base64 || "").trim();
  const dataUrlMatch = rawBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const normalizedMimeType = normalizeMimeType(dataUrlMatch?.[1] || mimeType);

  if (!SUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error("Photo must be a JPG, PNG, or WEBP image");
  }

  const cleanBase64 = dataUrlMatch ? dataUrlMatch[2] : rawBase64;
  const imageBuffer = Buffer.from(cleanBase64, "base64");

  if (!imageBuffer.length) {
    throw new Error("Photo image data is empty");
  }

  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Photo image is too large. Upload an image under 10 MB.");
  }

  const extension = getExtension(normalizedMimeType);
  const safeEmployeeId = getSafeEmployeeId(employeeId);
  const fileName = `google-form-photo-${safeEmployeeId}-${Date.now()}.${extension}`;
  const savedFile = writeImageFile(fileName, imageBuffer);

  return {
    fileName,
    ...savedFile,
    buffer: imageBuffer,
    mimeType: normalizedMimeType,
    dataUrl: toDataUrl(normalizedMimeType, imageBuffer)
  };
};

const getDotPattern = (startX, startY) => {
  let dots = "";

  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      dots += `<circle cx="${startX + col * 18.9}" cy="${startY + row * 18.9}" r="1.7" fill="#2f9be8" />`;
    }
  }

  return dots;
};

const createFrontSvg = ({ name, employeeId }) => {
  return `
    <svg width="420" height="679" viewBox="0 0 420 679" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="414" height="673" rx="26" fill="#ffffff" stroke="#111111" stroke-width="3"/>

      ${getDotPattern(25, 22)}
      ${getDotPattern(318, 22)}

      <path
        d="M62 200
           H185
           C290 200 362 260 362 342
           C362 430 292 484 190 484
           H62
           Z"
        fill="#12a8f4"
      />

      <text x="44" y="544" font-size="22" font-weight="700" font-family="Arial, sans-serif" fill="#2196f3">
        ${escapeXml(name)}
      </text>

      <text x="44" y="584" font-size="26" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        ${escapeXml(employeeId)}
      </text>
    </svg>
  `;
};

const createBackSvg = ({ bloodGroup, phone }) => {
  return `
    <svg width="420" height="679" viewBox="0 0 420 679" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="414" height="673" rx="26" fill="#ffffff" stroke="#111111" stroke-width="3"/>

      ${getDotPattern(25, 22)}
      ${getDotPattern(318, 22)}

      <text x="44" y="410" font-size="18" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        Blood Group: ${escapeXml(bloodGroup)}
      </text>

      <text x="44" y="446" font-size="18" font-weight="700" font-family="Arial, sans-serif" fill="#2196f3">
        Office Address
      </text>

      <text x="44" y="485" font-size="13" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        5th Floor Right Wing, Chennai Citi Centre,
      </text>

      <text x="44" y="510" font-size="13" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        Dr Radhakrishnan Salai, Mylapore,
      </text>

      <text x="44" y="535" font-size="13" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        Chennai - 600004, Tamil Nadu, India
      </text>

      <text x="44" y="560" font-size="13" font-weight="700" font-family="Arial, sans-serif" fill="#111111">
        Ph no: ${escapeXml(phone)}
      </text>

      <text x="210" y="640" text-anchor="middle" font-size="16" font-weight="700" font-family="Arial, sans-serif" fill="#2196f3">
        www.digi-val.com
      </text>
    </svg>
  `;
};

const getAssetPath = fileName => {
  const filePath = path.join(assetDir, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing asset: backend/assets/digival/${fileName}`);
  }

  return filePath;
};

exports.generateDigivalCardImages = async ({
  name,
  employeeId,
  bloodGroup,
  phone,
  photoBase64,
  photoMimeType
}) => {
  const photo = saveBase64Image({
    base64: photoBase64,
    mimeType: photoMimeType || "image/png",
    employeeId
  });

  const safeEmployeeId = getSafeEmployeeId(employeeId);
  const timestamp = Date.now();

  const frontFileName = `digival-front-${safeEmployeeId}-${timestamp}.png`;
  const backFileName = `digival-back-${safeEmployeeId}-${timestamp}.png`;

  const logoBuffer = await sharp(getAssetPath("digival-logo.png"))
    .resize({
      width: 160,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const qrBuffer = await sharp(getAssetPath("digival-qr.png"))
    .resize({
      width: 252,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  const photoBuffer = await sharp(photo.buffer)
    .rotate()
    .resize({
      width: 300,
      height: 346,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const frontBase = await sharp(Buffer.from(createFrontSvg({ name, employeeId })))
    .png()
    .toBuffer();

  const frontBuffer = await sharp(frontBase)
    .composite([
      {
        input: logoBuffer,
        left: 130,
        top: 39
      },
      {
        input: photoBuffer,
        left: 62,
        top: 138
      }
    ])
    .png()
    .toBuffer();

  const frontFile = writeImageFile(frontFileName, frontBuffer);

  const backBase = await sharp(Buffer.from(createBackSvg({ bloodGroup, phone })))
    .png()
    .toBuffer();

  const backBuffer = await sharp(backBase)
    .composite([
      {
        input: logoBuffer,
        left: 130,
        top: 39
      },
      {
        input: qrBuffer,
        left: 91,
        top: 148
      }
    ])
    .png()
    .toBuffer();

  const backFile = writeImageFile(backFileName, backBuffer);

  return {
    photoUrl: photo.imageUrl,
    photoDataUrl: photo.dataUrl,
    photoPath: photo.filePath,
    frontPath: frontFile.filePath,
    backPath: backFile.filePath,
    frontUrl: frontFile.imageUrl,
    backUrl: backFile.imageUrl,
    frontDataUrl: toDataUrl("image/png", frontBuffer),
    backDataUrl: toDataUrl("image/png", backBuffer),
    frontBuffer,
    backBuffer,
    persistedToUploads: photo.persisted && frontFile.persisted && backFile.persisted
  };
};
