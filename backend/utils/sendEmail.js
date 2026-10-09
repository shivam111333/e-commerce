import { getMailer } from "../config/mailer.js";

const sendEmail = async ({ to, subject, html, text }) => {
  if (typeof to !== "string" || !to.trim()) {
    throw new Error("A recipient email address is required");
  }

  if (typeof subject !== "string" || !subject.trim()) {
    throw new Error("An email subject is required");
  }

  if (typeof html !== "string" && typeof text !== "string") {
    throw new Error("An HTML or plain-text email body is required");
  }

  const { transporter, from } = getMailer();

  return transporter.sendMail({
    from,
    to: to.trim(),
    subject,
    ...(html !== undefined && { html }),
    ...(text !== undefined && { text }),
  });
};

export default sendEmail;
