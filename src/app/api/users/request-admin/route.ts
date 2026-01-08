import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { targetUserId } = await request.json(); // Better to use ID than email for updates
  const supabase = await createClient();

  // 1. Verify the requester is an Admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id) // Check the requester's ID
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ ok: false, message: "Admin privileges required." }, { status: 403 });
  }

  // 2. Approve the target user
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetUserId); // Using UUID is safer than email

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to approve user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}