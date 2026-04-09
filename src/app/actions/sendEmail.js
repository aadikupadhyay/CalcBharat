"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(prevState, formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");
  const website = formData.get("website"); // Honeypot
  const recaptchaToken = formData.get("g-recaptcha-response");

  // 1. Honeypot check
  if (website) {
    return { success: false, error: "Spam detected." };
  }

  // 2. Validate empty fields
  if (!name || !email || !message) {
    return { success: false, error: "Please fill in all required fields." };
  }

  // 3. ReCAPTCHA validation
  if (!recaptchaToken) {
    return { success: false, error: "Please complete the reCAPTCHA challenge." };
  }

  const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecretKey) {
    try {
      const recaptchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${recaptchaSecretKey}&response=${recaptchaToken}`,
      });
      const recaptchaData = await recaptchaRes.json();

      if (!recaptchaData.success) {
        return { success: false, error: "reCAPTCHA verification failed. Please try again." };
      }
    } catch (err) {
      return { success: false, error: "Error verifying reCAPTCHA." };
    }
  }

  // 4. Send Email using Resend
  try {
    const { data, error } = await resend.emails.send({
      from: "notifications@calcbharat.online",
      to: "aadikupadhyayimp@gmail.com",
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Message from CalcBharat Contact Form</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    });

    if (error) {
      // Fallback if domain is not verified or something goes wrong
      console.error("Resend main sender failed, trying fallback:", error);
      const fallbackRes = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "aadikupadhyayimp@gmail.com",
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Message from CalcBharat Contact Form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        `,
      });

      if (fallbackRes.error) {
        return { success: false, error: "Failed to send email. Please try again later." };
      }
    }

    return { 
      success: true, 
      error: null,
      message: "Message Sent! 🚀 We usually respond within 24 hours. While you wait, check out our SIP Step-Up Calculator—it’s our most popular tool for wealth building!" 
    };

  } catch (err) {
    return { success: false, error: "Internal server error. Please try again later." };
  }
}
