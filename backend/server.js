const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");
const seedDefaultTemplates = require("./utils/defaultTemplates");
const templateRoutes = require("./routes/templateRoutes");
const cardRoutes = require("./routes/cardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const fileRoutes = require("./routes/fileRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const googleFormRoutes = require("./routes/googleFormRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
  "https://syedishaq.me",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : [])
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-webhook-secret"]
  })
);

app.options("*", cors());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "ID Card Generator API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

let serverReadyPromise = null;

const prepareServer = async () => {
  if (!serverReadyPromise) {
    serverReadyPromise = (async () => {
      await connectDB();
      await seedDefaultTemplates();
    })().catch(error => {
      serverReadyPromise = null;
      throw error;
    });
  }

  return serverReadyPromise;
};

const ensureServerReady = async (req, res, next) => {
  try {
    await prepareServer();
    next();
  } catch (error) {
    next(error);
  }
};

app.use("/api/uploads", uploadRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/files", fileRoutes);

app.use("/api", ensureServerReady);
app.use("/api/templates", templateRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/google-form", googleFormRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  prepareServer()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(error => {
      console.error("Server startup failed:", error.message);
      process.exit(1);
    });
}

module.exports = app;
