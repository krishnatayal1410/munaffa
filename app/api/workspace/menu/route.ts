import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleWorkspaceError, objectId, requireLocation, requireWorkspace } from "@/lib/server/workspace";
import { ensureWorkspaceIndexes } from "@/lib/server/workspaceIndexes";

const RecipeLine=z.object({inventoryId:z.string(),qty:z.coerce.number().positive().max(100000)});
const Create=z.object({locationId:z.string(),name:z.string().trim().min(2).max(140),category:z.string().trim().min(1).max(80),price:z.coerce.number().min(0).max(10000000),recipe:z.array(RecipeLine).max(100).default([])});

export async function GET(request:NextRequest){
 try{const{db,orgId}=await requireWorkspace(request);const locationId=request.nextUrl.searchParams.get("locationId")||"";const location=await requireLocation(db,orgId,locationId);await ensureWorkspaceIndexes(db);const rows=await db.collection("menuItems").find({orgId,locationId:location._id,active:{$ne:false}}).sort({category:1,name:1}).toArray();return NextResponse.json({items:rows.map(x=>({id:String(x._id),name:x.name,category:x.category,price:x.price,recipe:Array.isArray(x.recipe)?x.recipe.map((r:{inventoryId:unknown;qty:unknown})=>({inventoryId:String(r.inventoryId),qty:Number(r.qty)})):[]}))})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}

export async function POST(request:NextRequest){
 try{const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager","kitchen","inventory"].includes(user.role))return NextResponse.json({error:"Menu management access required."},{status:403});const parsed=Create.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid menu item",issues:parsed.error.flatten().fieldErrors},{status:400});const location=await requireLocation(db,orgId,parsed.data.locationId);const recipe=[] as {inventoryId:ReturnType<typeof objectId>;qty:number}[];for(const line of parsed.data.recipe){const inventoryId=objectId(line.inventoryId,"inventory item");const exists=await db.collection("inventoryItems").findOne({_id:inventoryId,orgId,locationId:location._id,active:{$ne:false}},{projection:{_id:1}});if(!exists)return NextResponse.json({error:"Recipe references an inventory item outside this location."},{status:400});recipe.push({inventoryId,qty:line.qty})}const doc={orgId,locationId:location._id,name:parsed.data.name,category:parsed.data.category,price:parsed.data.price,recipe,active:true,createdBy:objectId(user.id,"user"),createdAt:new Date()};const result=await db.collection("menuItems").insertOne(doc);return NextResponse.json({item:{id:String(result.insertedId),name:doc.name,category:doc.category,price:doc.price,recipe:recipe.map(x=>({inventoryId:String(x.inventoryId),qty:x.qty}))}},{status:201})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}
