import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [runs, total] = await Promise.all([
    Run.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-prompt -response")
      .lean(),
    Run.countDocuments(),
  ]);

  return NextResponse.json({
    runs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
