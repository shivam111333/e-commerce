import nodemailer from "nodemailer";

let transporter;

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required email configuration: ${name}`);
  }

  return value;
};

export const getMailer = () => {
  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(getRequiredEnv("SMTP_PORT"));
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return {
    transporter,
    from: process.env.SMTP_FROM?.trim() || user,
  };
};
