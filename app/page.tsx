"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RunHistory } from "@/components/dashboard/run-history";
import { TriggerButton } from "@/components/dashboard/trigger-button";
import { RecipientsManager } from "@/components/dashboard/recipients-manager";
import { PendingUsers } from "@/components/dashboard/pending-users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Mail, Users, Clock } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session) return null;

  if (!session.user.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <Clock className="size-10 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold">Pending Approval</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account is awaiting admin approval. You&apos;ll be able to
                access the dashboard once approved.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
              }}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Sign out
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleAnalysisComplete() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <Header />
      <StatsCards key={refreshKey} />

      <div className="flex items-center justify-between">
        <div />
        <TriggerButton onComplete={handleAnalysisComplete} />
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">
            <History className="size-3" />
            Run History
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <Mail className="size-3" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="size-3" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle>Analysis Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <RunHistory refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle>Email Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipientsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle>Pending Users</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingUsers />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
