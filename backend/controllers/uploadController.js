const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl
  });
};

exports.removeBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({
        message: "REMOVE_BG_API_KEY is missing in backend .env file"
      });
    }

    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(req.file.path));
    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        responseType: "arraybuffer",
        timeout: 45000,
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": process.env.REMOVE_BG_API_KEY
        }
      }
    );

    const outputFileName = `removed-bg-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.png`;

    const outputPath = path.join(__dirname, "../uploads", outputFileName);

    fs.writeFileSync(outputPath, response.data);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${outputFileName}`;

    res.status(201).json({
      message: "Background removed successfully",
      imageUrl
    });
  } catch (error) {
    console.error("Background removal error:", error.response?.data || error.message);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message:
        "Background removal failed. Please try another image or upload a transparent PNG."
    });
  }
};