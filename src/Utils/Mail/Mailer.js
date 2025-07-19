import nodemailer from "nodemailer";

export async function sendEmailForFirstTimeVerification(user) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    to: user.email,
    subject: 'Verify Your Account',
    html: `
      <p>Hello ${user.name},</p>
      <p>Welcome to PRDS</p>
      <br>
      <p>Please verify your account by clicking <a href="${process.env.BASE_URL}/api/v1/auth/verify/?token=${user.verificationToken}">here</a>.</p>
      <br>
      <p>${BASE_URL}/api/v1/auth/verify/?token=${user.verificationToken}</P>
    `,
  };

  console.log('Triggering Mail from Mailer.js to ', user.email);

  await transporter.sendMail(mailOptions);

}