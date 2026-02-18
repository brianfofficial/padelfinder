import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["facility_name", "address", "city", "state", "zip_code", "submitter_name", "submitter_email"];
  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json(
        { error: `${field.replace(/_/g, " ")} is required` },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.from("submissions").insert({
    facility_name: body.facility_name.trim(),
    address: body.address.trim(),
    city: body.city.trim(),
    state: body.state.trim(),
    zip_code: body.zip_code.trim(),
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    website: body.website?.trim() || null,
    total_courts: body.total_courts ? parseInt(body.total_courts, 10) : null,
    description: body.description?.trim() || null,
    submitter_name: body.submitter_name.trim(),
    submitter_email: body.submitter_email.trim(),
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
