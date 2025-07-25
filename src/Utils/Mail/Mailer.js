import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
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
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
    connectionTimeout: 6000,
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
  }

  console.log("Triggering Mail from Mailer.js to ", user.email);

  await transporter.sendMail(mailOptions);
}
