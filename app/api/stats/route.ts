import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();

  const [stats] = await Run.aggregate<{
    totalRuns: number;
    successCount: number;
    failCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    totalSearchQueries: number;
    lastRunDate: Date | null;
  }>([
    {
      $group: {
        _id: null,
        totalRuns: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        totalInputTokens: { $sum: "$inputTokens" },
        totalOutputTokens: { $sum: "$outputTokens" },
        totalCost: { $sum: "$costUsd" },
        totalSearchQueries: { $sum: "$searchQueries" },
        lastRunDate: { $max: "$createdAt" },
      },
    },
  ]);

  return NextResponse.json(
    stats ?? {
      totalRuns: 0,
      successCount: 0,
      failCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      totalSearchQueries: 0,
      lastRunDate: null,
    }
  );
}
