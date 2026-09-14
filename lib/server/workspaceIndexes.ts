import type { Db } from "mongodb";

export async function ensureWorkspaceIndexes(db:Db){
 await Promise.all([
  db.collection("menuItems").createIndex({orgId:1,locationId:1,active:1}),
  db.collection("inventoryItems").createIndex({orgId:1,locationId:1,active:1}),
  db.collection("orders").createIndex({orgId:1,locationId:1,createdAt:-1}),
  db.collection("orders").createIndex({orgId:1,locationId:1,status:1}),
  db.collection("purchases").createIndex({orgId:1,locationId:1,createdAt:-1}),
  db.collection("guestIssues").createIndex({orgId:1,locationId:1,status:1,createdAt:-1}),
  db.collection("financeEvents").createIndex({orgId:1,locationId:1,createdAt:-1}),
  db.collection("financeEvents").createIndex({orgId:1,sourceType:1,sourceId:1},{unique:true,sparse:true}),
  db.collection("inventoryMovements").createIndex({orgId:1,sourceType:1,sourceId:1,itemId:1},{unique:true,sparse:true}),
  db.collection("inventoryMovements").createIndex({orgId:1,locationId:1,itemId:1,createdAt:-1})
 ]);
}
