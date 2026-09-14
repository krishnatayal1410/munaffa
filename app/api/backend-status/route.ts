import { NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/server/mongodb";

export const dynamic="force-dynamic";

export async function GET(){
 return NextResponse.json({
  ok:true,
  persistence:isMongoConfigured()?"mongodb-configured":"demo-browser-only",
  auth:"not-configured",
  payments:"not-configured",
  message:isMongoConfigured()?"Production persistence environment is present.":"Meeting demo is fully local to the browser until production credentials are configured."
 },{headers:{"Cache-Control":"no-store"}})
}
