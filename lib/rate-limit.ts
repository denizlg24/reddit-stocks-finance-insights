import { connectDB } from "@/lib/db";
import { RateLimit } from "@/lib/models/rate-limit";

interface RateLimitConfig {
  key: string;
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit({
  key,
  windowMs,
  maxRequests,
}: RateLimitConfig): Promise<{ allowed: boolean; retryAfterMs: number }> {
  await connectDB();

  const windowStart = new Date(Date.now() - windowMs);

  const doc = await RateLimit.findOneAndUpdate(
    { key },
    {
      $pull: { timestamps: { $lt: windowStart } },
    },
    { upsert: true, new: true }
  );

  if (doc.timestamps.length >= maxRequests) {
    const oldest = doc.timestamps[0];
    const retryAfterMs = oldest
      ? new Date(oldest.toString()).getTime() + windowMs - Date.now()
      : windowMs;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  await RateLimit.updateOne({ key }, { $push: { timestamps: new Date() } });

  return { allowed: true, retryAfterMs: 0 };
}
