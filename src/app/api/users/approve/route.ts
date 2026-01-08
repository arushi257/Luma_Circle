import { createClient } from "@/utils/supabase/server"; // Import your Supabase helper
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient(); // Create the client
  
  // 1. Get the current logged-in user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  // 2. Update their profile to ask for admin access
  // We check if they are already an admin first to avoid downgrading them.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') {
    return NextResponse.json({ ok: false, message: "You are already an admin." }, { status: 400 });
  }

  // Set role to 'pending_admin' (you need to decide on this string value)
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'pending_admin' })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}