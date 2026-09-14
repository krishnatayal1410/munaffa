import { NextResponse } from "next/server";
import { z } from "zod";
import { getMongoDb, isMongoConfigured } from "@/lib/server/mongodb";

const Lead=z.object({name:z.string().trim().min(2).max(100),business:z.string().trim().min(2).max(140),email:z.string().trim().email().max(180),phone:z.string().trim().max(30).optional().default(""),locations:z.coerce.number().int().min(1).max(5000).default(1),note:z.string().trim().max(1000).optional().default(""),website:z.string().max(0).optional().default("")});

export async function POST(request:Request){
 try{
  const length=Number(request.headers.get("content-length")||0);if(length>20000)return NextResponse.json({error:"Payload too large"},{status:413});
  const origin=request.headers.get("origin");const host=request.headers.get("host");if(origin&&host&&!origin.includes(host))return NextResponse.json({error:"Origin rejected"},{status:403});
  const parsed=Lead.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid request",issues:parsed.error.flatten().fieldErrors},{status:400});
  if(parsed.data.website)return NextResponse.json({ok:true});
  if(!isMongoConfigured())return NextResponse.json({error:"Production lead storage is not configured yet."},{status:503});
  const db=await getMongoDb();const {website,...lead}=parsed.data;await db.collection("leads").insertOne({...lead,status:"new",createdAt:new Date(),source:"website"});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to submit request"},{status:500})}
}
