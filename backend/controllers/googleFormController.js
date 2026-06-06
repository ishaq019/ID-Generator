const Template = require("../models/Template");
const GeneratedCard = require("../models/GeneratedCard");
const { generateDigivalCardImages } = require("../utils/digivalCardGenerator");
const { sendIdCardEmail } = require("../utils/emailService");

const getDigivalTemplateSlug = () => {
  return process.env.DIGIVAL_TEMPLATE_SLUG || "digival-employee-id-card";
};
const DIGIVAL_ADDRESS =
  "5th Floor Right Wing, Chennai Citi Centre,\nDr Radhakrishnan Salai, Mylapore,\nChennai - 600004, Tamil Nadu, India";

const FIELD_ALIASES = {
  name: ["name", "employeeName", "fullName", "Name", "Employee Name", "Full Name"],
  employeeId: [
    "employeeId",
    "employeeID",
    "employee_id",
    "empId",
    "empID",
    "idNumber",
    "Employee ID",
    "Emp ID",
    "ID Number"
  ],
  bloodGroup: ["bloodGroup", "blood_group", "Blood Group", "Bloodgroup"],
  phone: [
    "phone",
    "phoneNumber",
    "mobile",
    "mobileNumber",
    "contactNumber",
    "Phone",
    "Phone Number",
    "Mobile Number",
    "Contact Number"
  ],
  email: ["email", "emailAddress", "Email", "Email Address"],
  photoBase64: [
    "photoBase64",
    "photoDataUrl",
    "photoDataURL",
    "imageBase64",
    "Photo Base64",
    "Photo Data URL"
  ],
  photoMimeType: ["photoMimeType", "mimeType", "Photo MIME Type"],
  submissionId: [
    "submissionId",
    "googleSubmissionId",
    "responseId",
    "rowNumber",
    "Timestamp",
    "timestamp"
  ]
};

const isValidEmail = email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeLookupKey = key => {
  return String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
};

const normalizeScalar = value => {
  if (Array.isArray(value)) {
    return normalizeScalar(value[0]);
  }

  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const getValueFromSource = (source, aliases) => {
  if (!source || typeof source !== "object") return "";

  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(source, alias)) {
      return normalizeScalar(source[alias]);
    }
  }

  const normalizedKeyMap = new Map(
    Object.keys(source).map(key => [normalizeLookupKey(key), key])
  );

  for (const alias of aliases) {
    const actualKey = normalizedKeyMap.get(normalizeLookupKey(alias));

    if (actualKey) {
      return normalizeScalar(source[actualKey]);
    }
  }

  return "";
};

const getBodyValue = (body, key) => {
  const aliases = FIELD_ALIASES[key] || [key];
  const sources = [body, body?.formData, body?.namedValues];

  for (const source of sources) {
    const value = getValueFromSource(source, aliases);

    if (value) return value;
  }

  return "";
};

const normalizeGoogleFormPayload = body => {
  return {
    name: getBodyValue(body, "name"),
    employeeId: getBodyValue(body, "employeeId"),
    bloodGroup: getBodyValue(body, "bloodGroup"),
    phone: getBodyValue(body, "phone"),
    email: getBodyValue(body, "email").toLowerCase(),
    photoBase64: getBodyValue(body, "photoBase64"),
    photoMimeType: getBodyValue(body, "photoMimeType") || "image/png",
    submissionId: getBodyValue(body, "submissionId")
  };
};

const dataUrlToBuffer = dataUrl => {
  const match = String(dataUrl || "").match(/^data:image\/png;base64,(.+)$/);

  if (!match) return null;

  return Buffer.from(match[1], "base64");
};

const sendEmailForExistingCard = async card => {
  const frontBuffer = dataUrlToBuffer(card.generatedFrontImage);
  const backBuffer = dataUrlToBuffer(card.generatedBackImage);

  if (!frontBuffer || !backBuffer) {
    throw new Error("Saved card images are not available for email retry");
  }

  await sendIdCardEmail({
    to: card.recipientEmail,
    employeeName: card.formData?.name || "Employee",
    frontBuffer,
    backBuffer
  });

  card.emailStatus = "sent";
  card.emailSentAt = new Date();
  card.emailError = "";
  await card.save();

  return card;
};

const getMissingFields = payload => {
  return [
    ["name", payload.name],
    ["employeeId", payload.employeeId],
    ["bloodGroup", payload.bloodGroup],
    ["phone", payload.phone],
    ["email", payload.email],
    ["photoBase64", payload.photoBase64]
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);
};

exports.createDigivalCardFromGoogleForm = async (req, res, next) => {
  try {
    if (!process.env.WEBHOOK_SECRET) {
      return res.status(500).json({
        message: "WEBHOOK_SECRET is not configured on the backend"
      });
    }

    const secret = String(req.headers["x-webhook-secret"] || "");

    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const payload = normalizeGoogleFormPayload(req.body);
    const missingFields = getMissingFields(payload);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required Google Form fields",
        missingFields
      });
    }

    if (!isValidEmail(payload.email)) {
      return res.status(400).json({
        message: "Invalid email address"
      });
    }

    const existingCard = payload.submissionId
      ? await GeneratedCard.findOne({ googleSubmissionId: payload.submissionId })
      : null;

    if (existingCard) {
      if (["pending", "failed"].includes(existingCard.emailStatus)) {
        try {
          const emailedCard = await sendEmailForExistingCard(existingCard);

          return res.status(200).json({
            message:
              "This Google Form submission was already saved; email was resent successfully",
            card: emailedCard
          });
        } catch (emailError) {
          existingCard.emailStatus = "failed";
          existingCard.emailError = emailError.message;
          await existingCard.save();

          return res.status(502).json({
            message:
              "This Google Form submission was already saved, but email retry failed",
            error: emailError.message,
            card: existingCard
          });
        }
      }

      return res.status(200).json({
        message: "This Google Form submission was already processed",
        card: existingCard
      });
    }

    const template = await Template.findOne({
      slug: getDigivalTemplateSlug()
    });

    if (!template) {
      return res.status(404).json({
        message: "DigiVal template not found"
      });
    }

    const generatedImages = await generateDigivalCardImages({
      name: payload.name,
      employeeId: payload.employeeId,
      bloodGroup: payload.bloodGroup,
      phone: payload.phone,
      photoBase64: payload.photoBase64,
      photoMimeType: payload.photoMimeType
    });

    const formData = {
      name: payload.name,
      employeeId: payload.employeeId,
      bloodGroup: payload.bloodGroup,
      phone: payload.phone,
      email: payload.email,
      address: DIGIVAL_ADDRESS,
      website: "www.digi-val.com",
      photo: generatedImages.photoDataUrl || generatedImages.photoUrl
    };

    const card = await GeneratedCard.create({
      templateId: template._id,
      formData,
      photo: generatedImages.photoDataUrl || generatedImages.photoUrl,
      qrData: "STATIC_DIGIVAL_QR",
      generatedFrontImage: generatedImages.frontDataUrl,
      generatedBackImage: generatedImages.backDataUrl,
      generatedFrontFileUrl: generatedImages.frontUrl,
      generatedBackFileUrl: generatedImages.backUrl,
      recipientEmail: payload.email,
      emailStatus: "pending",
      source: "google-form",
      googleSubmissionId: payload.submissionId || "",
      uploadsPersisted: generatedImages.persistedToUploads,
      templateSnapshot: template.toObject()
    });

    try {
      await sendIdCardEmail({
        to: payload.email,
        employeeName: payload.name,
        frontPath: generatedImages.frontPath,
        backPath: generatedImages.backPath,
        frontBuffer: generatedImages.frontBuffer,
        backBuffer: generatedImages.backBuffer
      });

      card.emailStatus = "sent";
      card.emailSentAt = new Date();
      card.emailError = "";
      await card.save();
    } catch (emailError) {
      card.emailStatus = "failed";
      card.emailError = emailError.message;
      await card.save();

      return res.status(502).json({
        message: "DigiVal ID card was generated and saved, but email sending failed",
        error: emailError.message,
        card
      });
    }

    res.status(201).json({
      message: "DigiVal ID card generated, saved, and emailed successfully",
      card
    });
  } catch (error) {
    next(error);
  }
};
