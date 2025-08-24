import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

import dotenv from "dotenv";

dotenv.config();

const verificationMailTemplate = fs.readFileSync(
  path.join(process.cwd(), "src/Utils/MailTemplate/verificationMail.html"),
  "utf8"
);
const resetPasswordMailTemplate = fs.readFileSync(
  path.join(process.cwd(), "src/Utils/MailTemplate/ResetPasswordMail.html"),
  "utf8"
);

export async function sendEmailForFirstTimeVerification(user, type) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const accessToken = await oauth2Client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "no-reply@pradetra.com",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN_NO_REPLY,
      accessToken: accessToken.token,
    },
  });
  await new Promise((resolve, reject) => {
    // verify connection configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Server is ready to take our messages");
        resolve(success);
      }
    });
  });
  let mailOptions = {};
  if (type === "verification") {
    mailOptions = {
      to: user.email,
      subject: "Verify Your Account",
      html: verificationMailTemplate
        .replace("{{userName}}", user.name)
        .replace(
          "{{verificationLink}}",
          `${process.env.BASE_URL}/auth/verify/?token=${user.verificationToken}`
        )
        .replace(
          "{{verificationLink}}",
          `${process.env.BASE_URL}/auth/verify/?token=${user.verificationToken}`
        )
        .replace(
          "{{verificationLink}}",
          `${process.env.BASE_URL}/auth/verify/?token=${user.verificationToken}`
        ),
    };
  } else if (type === "resetPassword") {
    mailOptions = {
      to: user.email,
      subject: "Reset Your Password",
      html: resetPasswordMailTemplate
        .replace("{{name}}", user.name)
        .replace(
          "{{reset_link}}",
          `${process.env.BASE_URL}/auth/reset-password?token=${user.resetPasswordToken}`
        ),
    };
  } else if (type == "contact us") {
    mailOptions = {
      to: "contact@pradetra.com",
      subject: `New Enquiry came from ${user.name}`,
      html: `<table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Poppins', sans-serif; background-color: #f4f4f4; padding: 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color: #6a82fb; padding: 20px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">📬 New Contact Message from ${user.name}</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">You've received a new message via your contact form:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
              <tr>
                <td style="padding: 8px 0;"><strong>Name:</strong></td>
                <td style="padding: 8px 0;">${user.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Country:</strong></td>
                <td style="padding: 8px 0;">${user.country}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;" colspan="2"><strong>Message:</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; background-color: #f9f9f9; border-radius: 6px; color: #333;">
                  ${user.message}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color: #eeeeee; padding: 20px; text-align: center; font-size: 13px; color: #666;">
            This message was sent from user ${user.name}.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
    };
  }

  console.log("Triggering Mail from Mailer.js to ", user.email);

  await transporter.sendMail(mailOptions);
}
