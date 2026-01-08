import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const emailRegex = /^[^\s@]+@iitk\.ac\.in$/i;

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Please use your IITK email (…@iitk.ac.in)." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Trigger Supabase to send the OTP email
  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase(),
    options: {
      // If you are using this for signup too, set this to true:
      shouldCreateUser: true, 
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 400 } // Or 500 depending on the error
    );
  }

  // Supabase handles the email sending; we just confirm success to the client
  return NextResponse.json({ ok: true }, { status: 200 });
}