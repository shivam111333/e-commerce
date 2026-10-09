const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const verifyEmail = (verificationUrl) => {
  const safeVerificationUrl = escapeHtml(verificationUrl);

  return {
    subject: "Verify your email address",
    text: [
      "Thanks for creating an account.",
      "Verify your email address using this link:",
      verificationUrl,
      "This link expires in 24 hours.",
      "If you did not create this account, you can ignore this email.",
    ].join("\n\n"),
    html: `
      <p>Thanks for creating an account.</p>
      <p>
        <a href="${safeVerificationUrl}">Verify your email address</a>
      </p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  };
};

export default verifyEmail;
