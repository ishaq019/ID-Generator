exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const base64Image = req.file.buffer.toString("base64");

  const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

  res.status(201).json({
    message: "Image converted to Base64 successfully",
    imageUrl
  });
};