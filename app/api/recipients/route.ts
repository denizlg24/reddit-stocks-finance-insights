import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Recipient } from "@/lib/models/recipient";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();

  const recipients = await Recipient.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json(recipients);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const body: unknown = await request.json();

  if (
    !body ||
    typeof body !== "object" ||
    !("email" in body) ||
    !("name" in body) ||
    typeof (body as Record<string, unknown>).email !== "string" ||
    typeof (body as Record<string, unknown>).name !== "string"
  ) {
    return NextResponse.json(
      { error: "email and name are required" },
      { status: 400 }
    );
  }

  const { email, name } = body as { email: string; name: string };

  await connectDB();

  const existing = await Recipient.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "Recipient already exists" },
      { status: 409 }
    );
  }

  const recipient = await Recipient.create({ email, name });

  return NextResponse.json(recipient, { status: 201 });
}
