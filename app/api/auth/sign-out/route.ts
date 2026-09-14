import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, destroyRequestSession } from "@/lib/server/auth";
import { isMongoConfigured } from "@/lib/server/mongodb";

export async function POST(request:NextRequest){
 try{if(isMongoConfigured())await destroyRequestSession(request)}catch(error){console.error("signout cleanup failed",error)}
 const response=NextResponse.json({ok:true});clearSessionCookie(response);return response;
}
