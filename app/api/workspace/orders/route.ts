import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/server/mongodb";
import { handleWorkspaceError, objectId, requireLocation, requireWorkspace } from "@/lib/server/workspace";
import { ensureWorkspaceIndexes } from "@/lib/server/workspaceIndexes";

const OrderLine=z.object({menuItemId:z.string(),qty:z.coerce.number().int().min(1).max(100)});
const Create=z.object({locationId:z.string(),channel:z.enum(["staff","qr","takeaway","delivery"]).default("staff"),tableLabel:z.string().trim().max(40).optional(),guestName:z.string().trim().max(100).optional(),notes:z.string().trim().max(500).optional(),items:z.array(OrderLine).min(1).max(100)});
const Transition=z.object({locationId:z.string(),orderId:z.string(),status:z.enum(["accepted","preparing","ready","completed","cancelled"])});
const ALLOWED:Record<string,string[]>={placed:["accepted","cancelled"],accepted:["preparing","cancelled"],preparing:["ready","cancelled"],ready:["completed","cancelled"],completed:[],cancelled:[]};

type RecipeSnapshot={inventoryId:ObjectId;name:string;unit:string;qty:number;unitCost:number};
type LineSnapshot={menuItemId:ObjectId;name:string;category:string;unitPrice:number;qty:number;lineTotal:number;recipe:RecipeSnapshot[]};

function serializeOrder(order:Record<string,unknown>){return{id:String(order._id),locationId:String(order.locationId),status:order.status,channel:order.channel,tableLabel:order.tableLabel??null,guestName:order.guestName??null,notes:order.notes??null,items:order.items,total:Number(order.total||0),estimatedCogs:Number(order.estimatedCogs||0),createdAt:order.createdAt,completedAt:order.completedAt??null};}

export async function GET(request:NextRequest){
 try{const{db,orgId}=await requireWorkspace(request);const locationId=request.nextUrl.searchParams.get("locationId")||"";const location=await requireLocation(db,orgId,locationId);await ensureWorkspaceIndexes(db);const limit=Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit"))||50,1),200);const rows=await db.collection("orders").find({orgId,locationId:location._id}).sort({createdAt:-1}).limit(limit).toArray();return NextResponse.json({orders:rows.map(x=>serializeOrder(x as Record<string,unknown>))})}catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}

export async function POST(request:NextRequest){
 try{
  const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager","cashier","server"].includes(user.role))return NextResponse.json({error:"Order entry access required."},{status:403});
  const parsed=Create.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid order",issues:parsed.error.flatten().fieldErrors},{status:400});
  const location=await requireLocation(db,orgId,parsed.data.locationId);await ensureWorkspaceIndexes(db);
  const ids=[...new Set(parsed.data.items.map(x=>x.menuItemId))].map(id=>objectId(id,"menu item"));
  const menu=await db.collection("menuItems").find({_id:{$in:ids},orgId,locationId:location._id,active:{$ne:false}}).toArray();
  if(menu.length!==ids.length)return NextResponse.json({error:"One or more menu items are unavailable at this location."},{status:400});
  const menuMap=new Map(menu.map(x=>[String(x._id),x]));
  const inventoryIds=[...new Set(menu.flatMap(x=>Array.isArray(x.recipe)?x.recipe.map((r:{inventoryId:unknown})=>String(r.inventoryId)):[]))].map(id=>objectId(id,"inventory item"));
  const inventory=inventoryIds.length?await db.collection("inventoryItems").find({_id:{$in:inventoryIds},orgId,locationId:location._id,active:{$ne:false}}).toArray():[];
  const inventoryMap=new Map(inventory.map(x=>[String(x._id),x]));
  const lines:LineSnapshot[]=[];
  for(const requested of parsed.data.items){const item=menuMap.get(requested.menuItemId);if(!item)return NextResponse.json({error:"Menu item unavailable."},{status:400});const recipe:RecipeSnapshot[]=[];for(const raw of Array.isArray(item.recipe)?item.recipe:[]){const inv=inventoryMap.get(String(raw.inventoryId));if(!inv)return NextResponse.json({error:`Recipe for ${item.name} references unavailable inventory.`},{status:409});recipe.push({inventoryId:inv._id,name:String(inv.name),unit:String(inv.unit),qty:Number(raw.qty),unitCost:Number(inv.unitCost||0)})}const unitPrice=Number(item.price||0);lines.push({menuItemId:item._id,name:String(item.name),category:String(item.category||""),unitPrice,qty:requested.qty,lineTotal:unitPrice*requested.qty,recipe})}
  const total=lines.reduce((s,x)=>s+x.lineTotal,0);const estimatedCogs=lines.reduce((s,x)=>s+x.recipe.reduce((r,y)=>r+y.qty*y.unitCost*x.qty,0),0);const now=new Date();
  const doc={orgId,locationId:location._id,status:"placed",channel:parsed.data.channel,tableLabel:parsed.data.tableLabel||null,guestName:parsed.data.guestName||null,notes:parsed.data.notes||null,items:lines,total,estimatedCogs,createdBy:objectId(user.id,"user"),createdAt:now,updatedAt:now};
  const result=await db.collection("orders").insertOne(doc);return NextResponse.json({order:serializeOrder({_id:result.insertedId,...doc})},{status:201});
 }catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}

export async function PATCH(request:NextRequest){
 try{
  const{db,user,orgId}=await requireWorkspace(request);if(!["owner","manager","cashier","server","kitchen"].includes(user.role))return NextResponse.json({error:"Order workflow access required."},{status:403});
  const parsed=Transition.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid order transition",issues:parsed.error.flatten().fieldErrors},{status:400});
  const location=await requireLocation(db,orgId,parsed.data.locationId);const orderId=objectId(parsed.data.orderId,"order");await ensureWorkspaceIndexes(db);
  const existing=await db.collection("orders").findOne({_id:orderId,orgId,locationId:location._id});if(!existing)return NextResponse.json({error:"Order not found."},{status:404});
  if(existing.status===parsed.data.status)return NextResponse.json({order:serializeOrder(existing as Record<string,unknown>),idempotent:true});
  if(!(ALLOWED[String(existing.status)]||[]).includes(parsed.data.status))return NextResponse.json({error:`Cannot move order from ${existing.status} to ${parsed.data.status}.`},{status:409});
  if(parsed.data.status!=="completed"){
   const now=new Date();const result=await db.collection("orders").findOneAndUpdate({_id:orderId,orgId,locationId:location._id,status:existing.status},{$set:{status:parsed.data.status,updatedAt:now,cancelledAt:parsed.data.status==="cancelled"?now:null}},{returnDocument:"after"});if(!result)return NextResponse.json({error:"Order changed concurrently; refresh and retry."},{status:409});return NextResponse.json({order:serializeOrder(result as Record<string,unknown>)});
  }
  const client=await getMongoClient();let completed:Record<string,unknown>|null=null;
  await client.withSession(async session=>{await session.withTransaction(async()=>{
   const current=await db.collection("orders").findOne({_id:orderId,orgId,locationId:location._id},{session});if(!current)throw new Error("Order disappeared during completion.");if(current.status==="completed"){completed=current as Record<string,unknown>;return}if(current.status!=="ready")throw new Error("Order is no longer ready for completion.");
   const usage=new Map<string,{inventoryId:ObjectId;qty:number;name:string;unit:string}>();for(const line of Array.isArray(current.items)?current.items:[]){for(const recipe of Array.isArray(line.recipe)?line.recipe:[]){const key=String(recipe.inventoryId);const previous=usage.get(key);const qty=Number(recipe.qty||0)*Number(line.qty||0);if(previous)previous.qty+=qty;else usage.set(key,{inventoryId:recipe.inventoryId,qty,name:String(recipe.name||""),unit:String(recipe.unit||"")})}}
   const now=new Date();for(const use of usage.values()){const update=await db.collection("inventoryItems").updateOne({_id:use.inventoryId,orgId,locationId:location._id,active:{$ne:false}},{$inc:{theoreticalQty:-use.qty},$set:{updatedAt:now}},{session});if(!update.matchedCount)throw new Error(`Inventory item ${use.name||use.inventoryId} is unavailable.`);await db.collection("inventoryMovements").insertOne({orgId,locationId:location._id,itemId:use.inventoryId,sourceType:"order",sourceId:orderId,kind:"recipe-consumption",qty:-use.qty,unit:use.unit,createdAt:now},{session})}
   await db.collection("financeEvents").insertOne({orgId,locationId:location._id,sourceType:"order",sourceId:orderId,kind:"revenue",amount:Number(current.total||0),estimatedCogs:Number(current.estimatedCogs||0),createdAt:now},{session});
   const updated=await db.collection("orders").findOneAndUpdate({_id:orderId,orgId,locationId:location._id,status:"ready"},{$set:{status:"completed",completedAt:now,updatedAt:now,completedBy:objectId(user.id,"user")}},{returnDocument:"after",session});if(!updated)throw new Error("Order changed concurrently during completion.");completed=updated as Record<string,unknown>;
  })});
  if(!completed)return NextResponse.json({error:"Unable to complete order."},{status:409});return NextResponse.json({order:serializeOrder(completed)});
 }catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}
