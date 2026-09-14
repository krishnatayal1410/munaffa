import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const MAX_BODY_BYTES = 16_000;

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(25).optional().or(z.literal("")),
  businessName: z.string().trim().min(2).max(150),
  businessType: z.enum(["hotel", "restaurant", "cafe", "qsr", "cloud-kitchen", "resort", "bar-lounge", "other"]),
  city: z.string().trim().min(2).max(120),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.enum(["demo", "contact"]).default("demo"),
  website: z.string().max(0).optional(),
});

function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin submission rejected." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the form and try again." }, { status: 400 });
  }

  // Honeypot bots receive a neutral success so the endpoint does not reveal the trap.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return NextResponse.json({ error: "Lead delivery is not configured on this deployment yet." }, { status: 503 });
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { website: _website, ...lead } = parsed.data;
  const { error } = await supabase.from("demo_requests").insert({
    name: lead.name,
    email: lead.email.toLowerCase(),
    phone: lead.phone || null,
    business_name: lead.businessName,
    business_type: lead.businessType,
    city: lead.city,
    message: lead.message || null,
    source: lead.source,
  });

  if (error) {
    console.error("Munaffa lead insert failed", error.code);
    return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
