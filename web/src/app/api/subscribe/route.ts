import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = getSupabase();
    const confirmToken = crypto.randomBytes(32).toString("hex");
    const unsubToken = crypto.randomUUID();

    // Upsert subscriber
    const { error } = await supabase.from("subscribers").upsert(
      {
        email: email.toLowerCase().trim(),
        confirmed: false,
        confirm_token: confirmToken,
        unsub_token: unsubToken,
      },
      { onConflict: "email" }
    );

    if (error) {
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // TODO: Send confirmation email via Resend
    // For now, auto-confirm (remove this once Resend is configured)
    await supabase
      .from("subscribers")
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq("email", email.toLowerCase().trim());

    return NextResponse.json({
      message: "You're subscribed! You'll receive the next digest.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
