import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleWorkspaceError, requireWorkspace } from "@/lib/server/workspace";

const Create=z.object({name:z.string().trim().min(2).max(140),type:z.enum(["restaurant","cafe","hotel","resort","qsr","cloud-kitchen"]),city:z.string().trim().min(2).max(100)});

export async function GET(request:NextRequest){
 try{const{db,orgId}=await requireWorkspace(request);const rows=await db.collection("locations").find({orgId}).sort({createdAt:1}).project({name:1,type:1,city:1,createdAt:1}).toArray();return NextResponse.json({locations:rows.map(x=>({id:String(x._id),name:x.name,type:x.type,city:x.city,createdAt:x.createdAt}))})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}

export async function POST(request:NextRequest){
 try{const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager"].includes(user.role))return NextResponse.json({error:"Owner or manager access required."},{status:403});const parsed=Create.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid location",issues:parsed.error.flatten().fieldErrors},{status:400});const doc={orgId,...parsed.data,createdAt:new Date()};const result=await db.collection("locations").insertOne(doc);return NextResponse.json({location:{id:String(result.insertedId),...parsed.data}},{status:201})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}
