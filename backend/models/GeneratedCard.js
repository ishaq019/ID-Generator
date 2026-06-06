const mongoose = require("mongoose");

const generatedCardSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true
    },

    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    photo: { type: String, default: "" },
    logo: { type: String, default: "" },
    qrData: { type: String, default: "" },

    generatedFrontImage: { type: String, default: "" },
    generatedBackImage: { type: String, default: "" },

    recipientEmail: { type: String, default: "" },

    source: {
      type: String,
      enum: ["manual", "google-form"],
      default: "manual"
    },

    googleSubmissionId: {
      type: String,
      default: "",
      index: true
    },

    templateSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GeneratedCard", generatedCardSchema);