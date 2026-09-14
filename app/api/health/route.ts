import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "munaffa-cinematic-experience" }, { headers: { "Cache-Control": "no-store" } });
}
