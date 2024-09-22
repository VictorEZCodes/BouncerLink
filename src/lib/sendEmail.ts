import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendNotificationEmail(to: string, shortCode: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Your BouncerLink was accessed",
    text: `Your shortened link (${shortCode}) was just accessed.`,
    html: `<p>Your shortened link (<strong>${shortCode}</strong>) was just accessed.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
