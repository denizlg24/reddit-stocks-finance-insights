import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { MongoClient, ObjectId } from "mongodb";

const mongoUri =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/finance-insights";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    const result = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(id) }, { $set: { approved: true } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    const result = await db
      .collection("user")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}
