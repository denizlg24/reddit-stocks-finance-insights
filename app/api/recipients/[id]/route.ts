import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Recipient } from "@/lib/models/recipient";
import { requireAuth } from "@/lib/auth-guard";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid recipient ID" },
      { status: 400 }
    );
  }

  const body: unknown = await request.json();

  if (
    !body ||
    typeof body !== "object" ||
    !("active" in body) ||
    typeof (body as Record<string, unknown>).active !== "boolean"
  ) {
    return NextResponse.json(
      { error: "active (boolean) is required" },
      { status: 400 }
    );
  }

  const { active } = body as { active: boolean };

  await connectDB();

  const recipient = await Recipient.findByIdAndUpdate(
    id,
    { active },
    { new: true }
  ).lean();

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(recipient);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid recipient ID" },
      { status: 400 }
    );
  }

  await connectDB();

  const recipient = await Recipient.findByIdAndDelete(id);

  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}
