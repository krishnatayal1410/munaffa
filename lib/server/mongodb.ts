import { MongoClient, type Db } from "mongodb";

const uri=process.env.MONGODB_URI;
const dbName=process.env.MONGODB_DB||"munaffa";
let clientPromise:Promise<MongoClient>|null=null;

export function isMongoConfigured(){return Boolean(uri)}

export async function getMongoDb():Promise<Db>{
 if(!uri) throw new Error("MONGODB_URI is not configured");
 if(!clientPromise){const client=new MongoClient(uri,{maxPoolSize:10,minPoolSize:0});clientPromise=client.connect()}
 const client=await clientPromise;
 return client.db(dbName);
}
