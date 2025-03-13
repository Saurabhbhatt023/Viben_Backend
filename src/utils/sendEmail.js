const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("./sesClient.js");

/**
 * Creates a SendEmailCommand with the specified parameters
 * @param {string} toAddress - Recipient email address
 * @param {string} fromAddress - Sender email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @returns {SendEmailCommand} - AWS SES command object
 */
const createSendEmailCommand = (toAddress, fromAddress, subject, body) => {
  return new SendEmailCommand({
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
              <h2 style="color: #333;">${subject}</h2>
              <div style="margin: 20px 0; line-height: 1.5;">
                ${body}
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                This is an automated message from our platform. Please do not reply to this email.
              </div>
            </div>
          `,
        },
        Text: {
          Charset: "UTF-8",
          Data: `${subject}\n\n${body}\n\nThis is an automated message from our platform. Please do not reply to this email.`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: fromAddress,
  });
};

/**
 * Sends an email using AWS SES
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @param {string} toAddress - Optional recipient email (defaults to admin email)
 * @returns {Promise} - Result of the send operation
 */
const run = async (subject, body, toAddress = "saurabhbhatt023@gmail.com") => {
  if (!subject || !body) {
    throw new Error("Email subject and body are required");
  }

  const sendEmailCommand = createSendEmailCommand(
    toAddress,
    "admin@vibenweb.xyz",
    subject,
    body
  );

  try {
    return await sesClient.send(sendEmailCommand);
  } catch (caught) {
    if (caught instanceof Error && caught.name === "MessageRejected") {
      console.error("Email message rejected:", caught);
      return caught;
    }
    throw caught;
  }
};

module.exports = { run };