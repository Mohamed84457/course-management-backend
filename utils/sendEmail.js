import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_GMAIL,
    pass: process.env.MY_GMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Mail configuration error:", error);
    console.log(process.env.MY_GMAIL);
    console.log(process.env.MY_GMAIL_PASS);
  } else {
    console.log("Mail server is ready.");
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  return await transporter.sendMail({
    from: `"Course Management" <${process.env.MY_GMAIL}>`,
    to,
    subject,
    text,
    html,
  });
};
