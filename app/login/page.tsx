"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

type Notice = { type: "verification" | "approval"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          setError(error.message ?? "Sign up failed");
          return;
        }
        setNotice({
          type: "verification",
          message: "Check your email to verify your account.",
        });
        return;
      }

      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        const msg = error.message ?? "Sign in failed";
        if (msg.toLowerCase().includes("verify")) {
          setNotice({
            type: "verification",
            message: "Please verify your email before signing in.",
          });
        } else if (msg.toLowerCase().includes("approv") || error.status === 403) {
          setNotice({
            type: "approval",
            message: "Your account is pending admin approval.",
          });
        } else {
          setError(msg);
        }
        return;
      }
      router.push("/");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            Finance Insights
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create an account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              {notice.type === "verification" ? (
                <CheckCircle2 className="size-8 text-primary" />
              ) : (
                <Clock className="size-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">{notice.message}</p>
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setIsSignUp(false);
                }}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                />
              </div>
              {error && (
                <p className="text-destructive text-xs">{error}</p>
              )}
              <Button type="submit" size="lg" disabled={loading}>
                {loading
                  ? "Loading..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
