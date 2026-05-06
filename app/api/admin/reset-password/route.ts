// app/api/admin/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    console.log("-> 1. Naghahanap ng match para sa Email at OTP Code...");

    // 1. HANAPIN ANG ADMIN GAMIT ANG EMAIL AT OTP CODE
    const { data: admin, error: findError } = await supabaseAdmin
      .from('admin_users')
      .select('id, reset_token, reset_token_expiry')
      .eq('email', email)
      .eq('reset_token', code)
      .gt('reset_token_expiry', new Date().toISOString())
      .single();

    if (findError || !admin) {
      console.error("-> ERROR SA PAGHANAP:", findError?.message || "Hindi tumugma ang code o expired na.");
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    console.log("-> 2. Tumugma ang OTP! Iha-hash na ang bagong password...");

    // 2. HASH ANG BAGONG PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("-> 3. Password na-hash. Ise-save na sa Supabase...");

    // 3. I-UPDATE ANG PASSWORD AT BURAHIN ANG CODE
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash: hashedPassword, // PAKI-CHECK KUNG 'password' TALAGA ANG PANGALAN NG COLUMN MO SA DATABASE
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error("-> 4. ERROR SA SUPABASE UPDATE:", updateError.message, updateError.details);
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    console.log("-> 5. SUCCESS! Nabago na ang password.");
    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error) {
    console.error("-> UNEXPECTED ERROR:", error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}