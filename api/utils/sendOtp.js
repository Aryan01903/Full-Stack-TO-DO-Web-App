

const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 443,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendOtp = async (email, otp) => {
  try {
    const { data, error } = await transporter.sendMail({
      from: `"Task.io" <${process.env.MAIL_USER}>`,
      to: [email],
      subject: "Your OTP for Task.io",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #FFAA05;">OTP Verification</h2>
          <p>Dear User,</p>
          <p>Your verification code for <strong>Task.io</strong> is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #FFAA05;">${otp}</h1>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <small>Task.io Team</small>
        </div>
      `,
    });

    return data;
  } catch (err) {
    console.error("Failed to send OTP email:", err.message || err);
    throw err;
  }
};

module.exports = sendOtp;