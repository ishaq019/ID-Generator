const Template = require("../models/Template");
const GeneratedCard = require("../models/GeneratedCard");
const { generateDigivalCardImages } = require("../utils/digivalCardGenerator");
const { sendIdCardEmail } = require("../utils/emailService");

const isValidEmail = email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.createDigivalCardFromGoogleForm = async (req, res, next) => {
  try {
    const secret = req.headers["x-webhook-secret"];

    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const {
      name,
      employeeId,
      bloodGroup,
      phone,
      email,
      photoBase64,
      photoMimeType,
      submissionId
    } = req.body;

    if (!name || !employeeId || !bloodGroup || !phone || !email || !photoBase64) {
      return res.status(400).json({
        message: "Missing required Google Form fields"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email address"
      });
    }

    const existingCard = submissionId
      ? await GeneratedCard.findOne({ googleSubmissionId: submissionId })
      : null;

    if (existingCard) {
      return res.status(200).json({
        message: "This Google Form submission was already processed",
        card: existingCard
      });
    }

    const template = await Template.findOne({
      slug: "digival-employee-id-card"
    });

    if (!template) {
      return res.status(404).json({
        message: "DigiVal template not found"
      });
    }

    const generatedImages = await generateDigivalCardImages({
      name,
      employeeId,
      bloodGroup,
      phone,
      photoBase64,
      photoMimeType: photoMimeType || "image/png"
    });

    const formData = {
      name,
      employeeId,
      bloodGroup,
      phone,
      email,
      address:
        "5th Floor Right Wing, Chennai Citi Centre,\nDr Radhakrishnan Salai, Mylapore,\nChennai - 600004, Tamil Nadu, India",
      website: "www.digi-val.com",
      photo: generatedImages.photoUrl
    };

    const card = await GeneratedCard.create({
      templateId: template._id,
      formData,
      photo: generatedImages.photoUrl,
      qrData: "STATIC_DIGIVAL_QR",
      generatedFrontImage: generatedImages.frontUrl,
      generatedBackImage: generatedImages.backUrl,
      recipientEmail: email,
      source: "google-form",
      googleSubmissionId: submissionId || "",
      templateSnapshot: template.toObject()
    });

    await sendIdCardEmail({
      to: email,
      employeeName: name,
      frontPath: generatedImages.frontPath,
      backPath: generatedImages.backPath
    });

    res.status(201).json({
      message: "DigiVal ID card generated, saved, and emailed successfully",
      card
    });
  } catch (error) {
    next(error);
  }
};