const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const uploadDir = path.join(__dirname, "../uploads");
const assetDir = path.join(__dirname, "../assets/digival");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const escapeXml = value => {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const saveBase64Image = ({ base64, mimeType, employeeId }) => {
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const safeEmployeeId = String(employeeId || "employee").replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = `google-form-photo-${safeEmployeeId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));

  return {
    fileName,
    filePath,
    imageUrl: `/uploads/${fileName}`
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

  const safeEmployeeId = String(employeeId || "employee").replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();

  const frontFileName = `digival-front-${safeEmployeeId}-${timestamp}.png`;
  const backFileName = `digival-back-${safeEmployeeId}-${timestamp}.png`;

  const frontPath = path.join(uploadDir, frontFileName);
  const backPath = path.join(uploadDir, backFileName);

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

  const photoBuffer = await sharp(photo.filePath)
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

  await sharp(frontBase)
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
    .toFile(frontPath);

  const backBase = await sharp(Buffer.from(createBackSvg({ bloodGroup, phone })))
    .png()
    .toBuffer();

  await sharp(backBase)
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
    .toFile(backPath);

  return {
    photoUrl: photo.imageUrl,
    frontPath,
    backPath,
    frontUrl: `/uploads/${frontFileName}`,
    backUrl: `/uploads/${backFileName}`
  };
};