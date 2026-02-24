"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Activity } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-border/50 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
          <Activity className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="glow-primary text-base font-semibold tracking-tight">
            Finance Insights
          </h1>
          <p className="text-muted-foreground text-[0.6875rem]">
            AI-powered market analysis from r/stocks
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {session?.user && (
          <span className="font-mono-num text-muted-foreground hidden text-[0.6875rem] sm:inline">
            {session.user.email}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="size-3" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
