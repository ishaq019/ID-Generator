const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const seedDefaultTemplates = require("./utils/defaultTemplates");
const templateRoutes = require("./routes/templateRoutes");
const cardRoutes = require("./routes/cardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const googleFormRoutes = require("./routes/googleFormRoutes");
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5175",
    credentials: true
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "ID Card Generator API is running" });
});

app.use("/api/templates", templateRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/google-form", googleFormRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let isServerReady = false;

const prepareServer = async () => {
  if (!isServerReady) {
    await connectDB();
    await seedDefaultTemplates();
    isServerReady = true;
  }
};

prepareServer();

if (!process.env.VERCEL) {
  prepareServer().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
