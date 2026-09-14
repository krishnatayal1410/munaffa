import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie, createSession, ensureAuthIndexes, hashPassword } from "@/lib/server/auth";
import { getMongoDb, isMongoConfigured } from "@/lib/server/mongodb";

const Input=z.object({
 name:z.string().trim().min(2).max(100),
 business:z.string().trim().min(2).max(140),
 email:z.string().trim().email().max(180).transform(v=>v.toLowerCase()),
 password:z.string().min(10).max(128),
 businessType:z.enum(["restaurant","cafe","hotel","resort","qsr","cloud-kitchen"]),
 city:z.string().trim().min(2).max(100)
});

export async function POST(request:NextRequest){
 if(!isMongoConfigured())return NextResponse.json({error:"Production persistence is not configured."},{status:503});
 try{
  const parsed=Input.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid account details",issues:parsed.error.flatten().fieldErrors},{status:400});
  const db=await getMongoDb();await ensureAuthIndexes(db);
  const existing=await db.collection("users").findOne({email:parsed.data.email},{projection:{_id:1}});if(existing)return NextResponse.json({error:"An account with this email already exists."},{status:409});
  const userId=new ObjectId();const orgId=new ObjectId();const locationId=new ObjectId();const createdAt=new Date();
  const passwordHash=await hashPassword(parsed.data.password);
  await db.collection("organizations").insertOne({_id:orgId,name:parsed.data.business,createdBy:userId,createdAt});
  await db.collection("locations").insertOne({_id:locationId,orgId,name:`${parsed.data.business} · Main`,type:parsed.data.businessType,city:parsed.data.city,createdAt});
  await db.collection("users").insertOne({_id:userId,orgId,name:parsed.data.name,email:parsed.data.email,passwordHash,role:"owner",createdAt});
  await db.collection("memberships").insertOne({orgId,userId,role:"owner",status:"active",createdAt});
  const session=await createSession(db,userId);
  const response=NextResponse.json({ok:true,user:{id:String(userId),name:parsed.data.name,email:parsed.data.email,role:"owner"},organization:{id:String(orgId),name:parsed.data.business},location:{id:String(locationId),name:`${parsed.data.business} · Main`}} ,{status:201});
  attachSessionCookie(response,session.token,session.expiresAt);return response;
 }catch(error){
  const code=typeof error==="object"&&error&&"code" in error?Number((error as {code?:unknown}).code):0;
  if(code===11000)return NextResponse.json({error:"An account with this email already exists."},{status:409});
  console.error("signup failed",error);return NextResponse.json({error:"Unable to create account."},{status:500});
 }
}
