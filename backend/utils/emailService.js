const nodemailer = require("nodemailer");

const escapeHtml = value => {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const dataUrlToBuffer = dataUrl => {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);

  if (!match) return null;

  return {
    content: Buffer.from(match[2], "base64"),
    contentType: match[1]
  };
};

const createAttachment = ({ filename, path, content, dataUrl }) => {
  if (content) {
    return {
      filename,
      content,
      contentType: "image/png"
    };
  }

  const dataUrlAttachment = dataUrlToBuffer(dataUrl);

  if (dataUrlAttachment) {
    return {
      filename,
      ...dataUrlAttachment
    };
  }

  if (!path) {
    throw new Error(`${filename} attachment is missing`);
  }

  return {
    filename,
    path
  };
};

exports.sendIdCardEmail = async ({
  to,
  employeeName,
  frontPath,
  backPath,
  frontBuffer,
  backBuffer,
  frontDataUrl,
  backDataUrl
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in .env");
  }

  const transporter = createTransporter();
  const safeEmployeeName = escapeHtml(employeeName);

  await transporter.sendMail({
    from: `"DigiVal ID Card" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your DigiVal ID Card",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${safeEmployeeName},</h2>
        <p>Your DigiVal ID card has been generated successfully.</p>
        <p>Please find the front and back side of your ID card attached below.</p>
        <p>Regards,<br/>DigiVal Team</p>
      </div>
    `,
    attachments: [
      createAttachment({
        filename: "digival-id-card-front.png",
        path: frontPath,
        content: frontBuffer,
        dataUrl: frontDataUrl
      }),
      createAttachment({
        filename: "digival-id-card-back.png",
        path: backPath,
        content: backBuffer,
        dataUrl: backDataUrl
      })
    ]
  });
};
