// app/api/admin/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. HANAPIN ANG EMAIL (May validation na kung wala sa database)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Email not found in the database.' },
        { status: 404 } // Error 404 kapag hindi admin
      );
    }

    // 2. MAG-GENERATE NG 6-DIGIT CODE
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry for OTP

    // 3. I-SAVE ANG CODE SA DATABASE
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        reset_token: otpCode,
        reset_token_expiry: tokenExpiry,
      })
      .eq('id', admin.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    // 4. I-SEND ANG CODE VIA EMAIL
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Password Reset Code - LuxuryLevel',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0f172a;">Password Reset Code</h2>
            <p>Hi,</p>
            <p>You requested to reset your admin password. Please use the 6-digit code below to complete the process. This code will expire in 15 minutes.</p>
            <div style="margin: 30px 0; text-align: center;">
              <span style="background: #f1f5f9; color: #0f172a; padding: 16px 32px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Verification code sent to your email.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}