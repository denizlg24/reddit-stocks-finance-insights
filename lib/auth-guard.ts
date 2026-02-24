import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!session.user.approved) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
