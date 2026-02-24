"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRuns } from "@/lib/hooks/use-runs";
import { RunDetailDialog } from "@/components/dashboard/run-detail-dialog";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RunHistoryProps {
  refreshKey: number;
}

export function RunHistory({ refreshKey }: RunHistoryProps) {
  const [page, setPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { runs, pagination, loading } = useRuns(page);

  void refreshKey;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">No runs yet</p>
        <p className="text-muted-foreground text-xs">
          Trigger an analysis to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Searches</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Emails</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow
              key={run._id}
              className="cursor-pointer"
              onClick={() => setSelectedRunId(run._id)}
            >
              <TableCell className="font-mono-num text-muted-foreground">
                {formatDate(run.createdAt)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    run.status === "completed"
                      ? "default"
                      : run.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {run.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono-num text-right">
                {(run.inputTokens + run.outputTokens).toLocaleString()}
              </TableCell>
              <TableCell className="font-mono-num text-right">
                {run.searchQueries}
              </TableCell>
              <TableCell className="font-mono-num text-right">
                ${run.costUsd.toFixed(4)}
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {run.emailsSentTo.length}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRunId(run._id);
                  }}
                >
                  <Eye className="size-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="font-mono-num text-muted-foreground text-[0.6875rem]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}

      <RunDetailDialog
        runId={selectedRunId}
        onClose={() => setSelectedRunId(null)}
      />
    </>
  );
}
