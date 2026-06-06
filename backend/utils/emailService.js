const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

exports.sendIdCardEmail = async ({ to, employeeName, frontPath, backPath }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in .env");
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"DigiVal ID Card" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your DigiVal ID Card",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${employeeName},</h2>
        <p>Your DigiVal ID card has been generated successfully.</p>
        <p>Please find the front and back side of your ID card attached below.</p>
        <p>Regards,<br/>DigiVal Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "digival-id-card-front.png",
        path: frontPath
      },
      {
        filename: "digival-id-card-back.png",
        path: backPath
      }
    ]
  });
};