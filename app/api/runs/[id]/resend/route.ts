import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { sendAnalysisEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
  }

  const { allowed, retryAfterMs } = await checkRateLimit({
    key: `resend:${id}`,
    windowMs: 60 * 1000,
    maxRequests: 1,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limited, try again shortly", retryAfterMs },
      { status: 429 }
    );
  }

  await connectDB();

  const run = await Run.findById(id).lean();

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.status !== "completed" || !run.response) {
    return NextResponse.json(
      { error: "Can only resend completed runs with a response" },
      { status: 400 }
    );
  }

  const sentTo = await sendAnalysisEmail(run.response);

  return NextResponse.json({ sentTo });
}
