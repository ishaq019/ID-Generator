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