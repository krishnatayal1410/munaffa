import type { Db } from "mongodb";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function requestFingerprint(request: NextRequest, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${email}`).digest("hex");
}

export async function ensureAuthRateLimitIndexes(db: Db) {
  await Promise.all([
    db.collection("authAttempts").createIndex({ key: 1 }, { unique: true }),
    db.collection("authAttempts").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ]);
}

export async function isSignInAllowed(db: Db, request: NextRequest, email: string) {
  await ensureAuthRateLimitIndexes(db);
  const key = requestFingerprint(request, email);
  const now = new Date();
  const row = await db.collection("authAttempts").findOne({ key });
  if (!row || !(row.expiresAt instanceof Date) || row.expiresAt <= now) return { allowed: true, key };
  return { allowed: Number(row.failures || 0) < MAX_FAILURES, key };
}

export async function recordSignInFailure(db: Db, key: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);
  await db.collection("authAttempts").updateOne(
    { key },
    { $inc: { failures: 1 }, $set: { updatedAt: now, expiresAt }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}

export async function clearSignInFailures(db: Db, key: string) {
  await db.collection("authAttempts").deleteOne({ key });
}
