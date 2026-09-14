export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true, service: "munaffa-immersive-3d", version: "2.0.0" });
}
