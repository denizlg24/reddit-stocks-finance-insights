import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { MongoClient } from "mongodb";

const mongoUri =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/finance-insights";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    const pendingUsers = await db
      .collection("user")
      .find({
        approved: { $ne: true },
        emailVerified: true,
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(pendingUsers);
  } finally {
    await client.close();
  }
}
