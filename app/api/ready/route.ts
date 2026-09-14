import { NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/server/mongodb";

export const dynamic="force-dynamic";

export async function GET(){
 if(!isMongoConfigured()) return NextResponse.json({ready:false,app:true,database:false,reason:"MONGODB_URI not configured"},{status:503,headers:{"Cache-Control":"no-store"}});
 try{const db=await getMongoDb();await db.command({ping:1});return NextResponse.json({ready:true,app:true,database:true},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({ready:false,app:true,database:false,reason:"Database ping failed"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
