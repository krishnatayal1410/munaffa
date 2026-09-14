import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie, createSession, ensureAuthIndexes, verifyPassword } from "@/lib/server/auth";
import { getMongoDb, isMongoConfigured } from "@/lib/server/mongodb";

const Input=z.object({email:z.string().trim().email().max(180).transform(v=>v.toLowerCase()),password:z.string().min(1).max(128)});

export async function POST(request:NextRequest){
 if(!isMongoConfigured())return NextResponse.json({error:"Production persistence is not configured."},{status:503});
 try{
  const parsed=Input.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid credentials."},{status:400});
  const db=await getMongoDb();await ensureAuthIndexes(db);
  const user=await db.collection("users").findOne({email:parsed.data.email});
  if(!user||typeof user.passwordHash!=="string"||!(await verifyPassword(parsed.data.password,user.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});
  const session=await createSession(db,user._id);
  const response=NextResponse.json({ok:true,user:{id:String(user._id),name:String(user.name),email:String(user.email),role:String(user.role||"owner")}});
  attachSessionCookie(response,session.token,session.expiresAt);return response;
 }catch(error){console.error("signin failed",error);return NextResponse.json({error:"Unable to sign in."},{status:500})}
}
