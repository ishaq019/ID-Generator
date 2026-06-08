const Template = require("../models/Template");
const GeneratedCard = require("../models/GeneratedCard");
const { sendIdCardSubmissionEmail } = require("../utils/emailService");

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

const buildImageDataUrl = ({ photoBase64, photoMimeType }) => {
  if (!photoBase64) return "";

  if (String(photoBase64).startsWith("data:image")) {
    return photoBase64;
  }

  return `data:${photoMimeType || "image/png"};base64,${photoBase64}`;
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

const sendConfirmationForExistingCard = async card => {
  await sendIdCardSubmissionEmail({
    to: card.recipientEmail,
    employeeName: card.formData?.name || "Employee"
  });

  card.emailStatus = "sent";
  card.emailSentAt = new Date();
  card.emailError = "";
  await card.save();

  return card;
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
          const emailedCard = await sendConfirmationForExistingCard(existingCard);

          return res.status(200).json({
            message:
              "This Google Form submission was already saved; confirmation email was resent successfully",
            card: emailedCard
          });
        } catch (emailError) {
          existingCard.emailStatus = "failed";
          existingCard.emailError = emailError.message;
          await existingCard.save();

          return res.status(502).json({
            message:
              "This Google Form submission was already saved, but confirmation email retry failed",
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

    const photoDataUrl = buildImageDataUrl({
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
      photo: photoDataUrl
    };

    const card = await GeneratedCard.create({
      templateId: template._id,
      formData,
      photo: photoDataUrl,
      qrData: "STATIC_DIGIVAL_QR",

      // No image attachment generation now.
      generatedFrontImage: "",
      generatedBackImage: "",
      generatedFrontFileUrl: "",
      generatedBackFileUrl: "",

      recipientEmail: payload.email,
      emailStatus: "pending",
      source: "google-form",
      googleSubmissionId: payload.submissionId || "",
      uploadsPersisted: false,
      templateSnapshot: template.toObject()
    });

    try {
      await sendIdCardSubmissionEmail({
        to: payload.email,
        employeeName: payload.name
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
        message:
          "Google Form data was saved and ID card is available on website, but confirmation email sending failed",
        error: emailError.message,
        card
      });
    }

    res.status(201).json({
      message:
        "Google Form data saved successfully. ID card is available on website and confirmation email sent.",
      card
    });
  } catch (error) {
    next(error);
  }
};