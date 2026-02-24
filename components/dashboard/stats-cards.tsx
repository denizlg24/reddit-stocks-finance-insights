"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/hooks/use-runs";
import {
  BarChart3,
  CheckCircle2,
  Coins,
  Clock,
  Zap,
} from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const cards = [
  {
    key: "totalRuns",
    label: "Total Runs",
    icon: BarChart3,
    format: (s: NonNullable<ReturnType<typeof useStats>["stats"]>) =>
      s.totalRuns.toString(),
  },
  {
    key: "successRate",
    label: "Success Rate",
    icon: CheckCircle2,
    format: (s: NonNullable<ReturnType<typeof useStats>["stats"]>) =>
      s.totalRuns === 0
        ? "—"
        : `${Math.round((s.successCount / s.totalRuns) * 100)}%`,
  },
  {
    key: "tokens",
    label: "Tokens Used",
    icon: Zap,
    format: (s: NonNullable<ReturnType<typeof useStats>["stats"]>) =>
      formatNumber(s.totalInputTokens + s.totalOutputTokens),
  },
  {
    key: "cost",
    label: "Total Cost",
    icon: Coins,
    format: (s: NonNullable<ReturnType<typeof useStats>["stats"]>) =>
      formatCost(s.totalCost),
  },
  {
    key: "lastRun",
    label: "Last Run",
    icon: Clock,
    format: (s: NonNullable<ReturnType<typeof useStats>["stats"]>) =>
      formatDate(s.lastRunDate),
  },
] as const;

export function StatsCards() {
  const { stats, loading } = useStats();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="glow-card" size="sm">
            <CardHeader>
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <Card key={key} className="glow-card" size="sm">
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-[0.6875rem] font-normal">
              <Icon className="size-3 text-primary/70" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono-num text-sm font-semibold">
              {stats ? format(stats) : "—"}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
