const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { uploadBufferToDrive } = require("../utils/googleDriveStorage");

const router = express.Router();

const getUploadErrorStatus = error => {
  if (error?.code === 401 || error?.response?.status === 401) return 401;
  if (error?.code === 403 || error?.response?.status === 403) return 403;

  return 500;
};

const getUploadErrorMessage = error => {
  const message = error?.message || "Image upload failed";

  if (message.includes("DECODER routines") || message.includes("unsupported")) {
    return "Google Drive credentials are invalid for the selected auth method. Check your OAuth client ID, client secret, refresh token, and remove invalid private-key values.";
  }

  if (message.includes("invalid_grant")) {
    return "Google Drive refresh token is invalid or expired. Generate a new refresh token.";
  }

  if (message.includes("insufficient authentication scopes")) {
    return "Google Drive refresh token does not include Drive upload permission. Generate it with Drive API scope.";
  }

  return message;
};

const createUploadHandler = fieldName => [
  upload.single(fieldName),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `Image file is required in the "${fieldName}" field`
        });
      }

      const uploadedFile = await uploadBufferToDrive(req.file);

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: uploadedFile.imageUrl,
        fileId: uploadedFile.fileId,
        file: uploadedFile
      });
    } catch (error) {
      res.status(getUploadErrorStatus(error)).json({
        success: false,
        message: getUploadErrorMessage(error)
      });
    }
  }
];

router.post("/photo", ...createUploadHandler("photo"));

// Backward-compatible route for older frontend builds.
router.post("/image", ...createUploadHandler("image"));

router.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Image upload failed"
    });
  }

  next();
});

module.exports = router;
