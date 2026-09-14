import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ObjectId, type Db } from "mongodb";
import type { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "./mongodb";

const scrypt=promisify(scryptCallback);
export const SESSION_COOKIE="munaffa_session";
const SESSION_DAYS=30;

export async function ensureAuthIndexes(db:Db){
 await Promise.all([
  db.collection("users").createIndex({email:1},{unique:true}),
  db.collection("sessions").createIndex({tokenHash:1},{unique:true}),
  db.collection("sessions").createIndex({expiresAt:1},{expireAfterSeconds:0}),
  db.collection("locations").createIndex({orgId:1}),
  db.collection("memberships").createIndex({orgId:1,userId:1},{unique:true})
 ]);
}

export async function hashPassword(password:string){
 const salt=randomBytes(16);
 const derived=await scrypt(password,salt,64) as Buffer;
 return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password:string,stored:string){
 const [algorithm,saltHex,hashHex]=stored.split(":");
 if(algorithm!=="scrypt"||!saltHex||!hashHex)return false;
 const expected=Buffer.from(hashHex,"hex");
 const actual=await scrypt(password,Buffer.from(saltHex,"hex"),expected.length) as Buffer;
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}

function hashToken(token:string){return createHash("sha256").update(token).digest("hex")}

export async function createSession(db:Db,userId:ObjectId){
 const token=randomBytes(32).toString("base64url");
 const expiresAt=new Date(Date.now()+SESSION_DAYS*24*60*60*1000);
 await db.collection("sessions").insertOne({tokenHash:hashToken(token),userId,createdAt:new Date(),expiresAt});
 return {token,expiresAt};
}

export function attachSessionCookie(response:NextResponse,token:string,expiresAt:Date){
 response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});
}

export function clearSessionCookie(response:NextResponse){response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:new Date(0)})}

export async function destroyRequestSession(request:NextRequest){
 const token=request.cookies.get(SESSION_COOKIE)?.value;if(!token)return;
 const db=await getMongoDb();await db.collection("sessions").deleteOne({tokenHash:hashToken(token)});
}

export async function getRequestUser(request:NextRequest){
 const token=request.cookies.get(SESSION_COOKIE)?.value;if(!token)return null;
 const db=await getMongoDb();
 const session=await db.collection("sessions").findOne({tokenHash:hashToken(token),expiresAt:{$gt:new Date()}});if(!session)return null;
 const user=await db.collection("users").findOne({_id:session.userId as ObjectId});if(!user)return null;
 return {id:String(user._id),name:String(user.name),email:String(user.email),orgId:String(user.orgId),role:String(user.role||"owner")};
}
