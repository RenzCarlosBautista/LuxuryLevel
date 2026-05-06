import { BaseEmailProps } from "@/lib/types";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message }: BaseEmailProps = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. BAGUHIN ANG TRANSPORTER PARA SA GMAIL
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL, // Ito dapat ay luxurylevelco00@gmail.com sa Vercel
        pass: process.env.SMTP_EMAIL_PASSWORD, // Ito yung 16-digit App Password
      },
    });

const mailOptions = {
      // Si luxurylevelco00 ang "Machine" na nagpapadala
      from: `"Luxury Level Inquiry" <${process.env.SMTP_EMAIL}>`, 
      
      // DITO MO ILAGAY ANG EMAIL NI BOSS (Para siya ang makatanggap)
      to: "rahimghanaei@luxurylevelco.com", 
      
      // KAPAG NAG-REPLY SI BOSS, DITO PUPUNTA ANG SAGOT (Sa email ng customer)
      replyTo: email, 
      
      subject: `New Inquiry: ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #333;">New Product Inquiry</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { success: false, error: (error as { message: string }).message },
      { status: 500 }
    );
  }
}