import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { google } from 'googleapis';

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
        ).replace(
          "{{verificationLink}}",
          `${process.env.BASE_URL}/auth/verify/?token=${user.verificationToken}`
        ).replace(
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
        .replace("{{reset_link}}", `${process.env.BASE_URL}/auth/reset-password?token=${user.resetPasswordToken}`),
    };
  }else if( type == "contact us"){
    mailOptions = {
      to: user.email,
      subject: "New Enquiry came",
       text: "Please check in dashboard"
    };
  }

  console.log("Triggering Mail from Mailer.js to ", user.email);

  await transporter.sendMail(mailOptions);
}
