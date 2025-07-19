import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function sendEmailForFirstTimeVerification(user) {
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
  const mailOptions = {
    to: user.email,
    subject: "Verify Your Account",
    html: `
      <p>Hello ${user.name},</p>
      <p>Welcome to PRDS</p>
      <br>
      <p>Please verify your account by clicking <a href="${process.env.BASE_URL}/api/v1/auth/verify/?token=${user.verificationToken}">here</a>.</p>
      <br>
      <p>${process.env.BASE_URL}/api/v1/auth/verify/?token=${user.verificationToken}</p>
    `,
  };

  console.log("Triggering Mail from Mailer.js to ", user.email);

  await transporter.sendMail(mailOptions);
}
