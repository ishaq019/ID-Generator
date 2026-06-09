const { Readable } = require("stream");
const getGoogleDrive = require("../config/googleDrive");

const safeFileName = file => {
  const originalName = String(file.originalname || "upload").replace(/[^\w.\-]+/g, "-");
  return `${Date.now()}-${originalName}`;
};

const uploadBufferToDrive = async file => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing in environment variables");
  }

  if (!file.buffer?.length) {
    throw new Error("Uploaded file is empty");
  }

  const fileName = safeFileName(file);
  const drive = getGoogleDrive();

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: file.mimetype,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    },
    media: {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer)
    },
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
    supportsAllDrives: true
  });

  const fileId = response.data.id;
  const imageUrl = `/api/files/${fileId}`;

  return {
    fileId,
    fileName: response.data.name,
    mimeType: response.data.mimeType,
    size: Number(response.data.size || file.size || file.buffer.length),
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink,
    imageUrl
  };
};

const streamToBuffer = async stream => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const downloadDriveFileAsBuffer = async fileId => {
  const drive = getGoogleDrive();

  const metadataResponse = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size",
    supportsAllDrives: true
  });

  const mediaResponse = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true
    },
    {
      responseType: "stream"
    }
  );

  const buffer = await streamToBuffer(mediaResponse.data);

  return {
    buffer,
    metadata: metadataResponse.data
  };
};

module.exports = {
  uploadBufferToDrive,
  downloadDriveFileAsBuffer
};
