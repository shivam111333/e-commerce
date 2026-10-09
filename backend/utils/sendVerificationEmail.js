import sendEmail from "./sendEmail.js";
import verifyEmail from "../templates/emails/verifyEmail.js";

const createVerificationUrl = (token) => {
  const frontendUrlValue = process.env.FRONTEND_URL?.trim();
  if (!frontendUrlValue) {
    throw new Error("Missing required email configuration: FRONTEND_URL");
  }

  const frontendUrl = new URL(frontendUrlValue);

  if (!["http:", "https:"].includes(frontendUrl.protocol)) {
    throw new Error("FRONTEND_URL must use HTTP or HTTPS");
  }

  frontendUrl.pathname = `${frontendUrl.pathname.replace(/\/+$/, "")}/verify-email`;
  frontendUrl.search = "";
  frontendUrl.hash = "";
  frontendUrl.searchParams.set("token", token);

  return frontendUrl.toString();
};

export const sendVerificationEmail = async (email, verificationToken) => {
  if (!email?.trim()) {
    throw new Error("A recipient email address is required");
  }

  if (!verificationToken) {
    throw new Error("A verification token is required");
  }

  const verificationUrl = createVerificationUrl(verificationToken);
  const message = verifyEmail(verificationUrl);

  return sendEmail({
    to: email.trim(),
    ...message,
  });
};

export default sendVerificationEmail;