import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/server/mongodb";
import { handleWorkspaceError,objectId,requireLocation,requireWorkspace } from "@/lib/server/workspace";
import { ensureWorkspaceIndexes } from "@/lib/server/workspaceIndexes";

const Line=z.object({inventoryId:z.string(),qty:z.coerce.number().positive().max(1_000_000),unitCost:z.coerce.number().min(0).max(100_000_000)});
const Create=z.object({locationId:z.string(),supplier:z.string().trim().min(1).max(160),invoiceRef:z.string().trim().max(100).optional(),notes:z.string().trim().max(500).optional(),items:z.array(Line).min(1).max(100)});

function serialize(x:Record<string,unknown>){return{id:String(x._id),locationId:String(x.locationId),supplier:x.supplier,invoiceRef:x.invoiceRef??null,items:x.items,total:Number(x.total||0),createdAt:x.createdAt};}

export async function GET(request:NextRequest){try{const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager","cashier"].includes(user.role))return NextResponse.json({error:"Purchasing access required."},{status:403});const location=await requireLocation(db,orgId,request.nextUrl.searchParams.get("locationId")||"");await ensureWorkspaceIndexes(db);const rows=await db.collection("purchases").find({orgId,locationId:location._id}).sort({createdAt:-1}).limit(200).toArray();return NextResponse.json({purchases:rows.map(x=>serialize(x as Record<string,unknown>))})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}}

export async function POST(request:NextRequest){try{
 const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager"].includes(user.role))return NextResponse.json({error:"Manager purchasing access required."},{status:403});
 const parsed=Create.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid purchase",issues:parsed.error.flatten().fieldErrors},{status:400});
 const location=await requireLocation(db,orgId,parsed.data.locationId);await ensureWorkspaceIndexes(db);
 const ids=[...new Set(parsed.data.items.map(x=>x.inventoryId))].map(id=>objectId(id,"inventory item"));const inventory=await db.collection("inventoryItems").find({_id:{$in:ids},orgId,locationId:location._id,active:{$ne:false}}).toArray();if(inventory.length!==ids.length)return NextResponse.json({error:"One or more inventory items are unavailable."},{status:400});const map=new Map(inventory.map(x=>[String(x._id),x]));
 const items=parsed.data.items.map(line=>{const inv=map.get(line.inventoryId)!;return{inventoryId:inv._id,name:String(inv.name),unit:String(inv.unit),qty:line.qty,unitCost:line.unitCost,lineTotal:line.qty*line.unitCost}});const total=items.reduce((s,x)=>s+x.lineTotal,0);const purchaseId=new ObjectId();const now=new Date();const client=await getMongoClient();
 await client.withSession(async session=>session.withTransaction(async()=>{await db.collection("purchases").insertOne({_id:purchaseId,orgId,locationId:location._id,supplier:parsed.data.supplier,invoiceRef:parsed.data.invoiceRef||null,notes:parsed.data.notes||null,items,total,createdBy:objectId(user.id,"user"),createdAt:now},{session});for(const line of items){const updated=await db.collection("inventoryItems").updateOne({_id:line.inventoryId,orgId,locationId:location._id},{$inc:{theoreticalQty:line.qty,physicalQty:line.qty},$set:{unitCost:line.unitCost,updatedAt:now}},{session});if(!updated.matchedCount)throw new Error(`Inventory item ${line.name} changed during receipt.`);await db.collection("inventoryMovements").insertOne({orgId,locationId:location._id,itemId:line.inventoryId,sourceType:"purchase",sourceId:purchaseId,kind:"stock-receipt",qty:line.qty,unit:line.unit,unitCost:line.unitCost,createdAt:now},{session})}await db.collection("financeEvents").insertOne({orgId,locationId:location._id,sourceType:"purchase",sourceId:purchaseId,kind:"expense",amount:total,createdAt:now},{session})}));
 return NextResponse.json({purchase:serialize({_id:purchaseId,locationId:location._id,supplier:parsed.data.supplier,invoiceRef:parsed.data.invoiceRef||null,items,total,createdAt:now})},{status:201});
}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}}
