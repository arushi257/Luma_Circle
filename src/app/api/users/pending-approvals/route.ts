import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Check if the requester is an Admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ ok: false, message: "Admin privileges required." }, { status: 403 });
  }

  // 2. Fetch all users waiting for approval
  const { data: pendingUsers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, username') // Select only what you need
    .eq('role', 'pending_admin');

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pending: pendingUsers,
  });
}