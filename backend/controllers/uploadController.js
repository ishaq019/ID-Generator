const { uploadBufferToDrive } = require("../utils/googleDriveStorage");

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const uploadedFile = await uploadBufferToDrive(req.file);

    res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: uploadedFile.imageUrl,
      fileId: uploadedFile.fileId,
      file: uploadedFile
    });
  } catch (error) {
    next(error);
  }
};
