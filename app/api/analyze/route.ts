import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { runAnalysis } from "@/lib/analyze";
import { sendAnalysisEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth-guard";
import { buildAnalysisPrompt } from "@/lib/prompt";
import { fetchRedditData } from "@/lib/reddit";

function isCronAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  const cronAuth = isCronAuthorized(request);

  if (!cronAuth) {
    const { error } = await requireAuth();
    if (error) return error;
  }

  const { allowed, retryAfterMs } = await checkRateLimit({
    key: "analyze",
    windowMs: 5 * 60 * 1000,
    maxRequests: 1,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs },
      { status: 429 }
    );
  }

  await connectDB();

  const redditResult = await fetchRedditData();
  const redditData = redditResult.success ? redditResult.data : undefined;

  if (!redditResult.success) {
    console.warn("Reddit fetch failed, proceeding with web_search-only mode:", redditResult.error);
  }

  const run = await Run.create({
    status: "pending",
    prompt: buildAnalysisPrompt(!!redditData),
  });

  try {
    const result = await runAnalysis(redditData);

    const sentTo = await sendAnalysisEmail(result.response);

    run.status = "completed";
    run.response = result.response;
    run.inputTokens = result.inputTokens;
    run.outputTokens = result.outputTokens;
    run.searchQueries = result.searchQueries;
    run.costUsd = result.costUsd;
    run.emailsSentTo = sentTo;
    run.redditSource = redditData?.source ?? "none";
    run.redditPostCount = redditData?.posts.length ?? 0;
    run.completedAt = new Date();
    await run.save();

    return NextResponse.json(run);
  } catch (err) {
    run.status = "failed";
    run.errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    run.completedAt = new Date();
    await run.save();

    return NextResponse.json(
      { error: "Analysis failed", runId: run._id },
      { status: 500 }
    );
  }
}
