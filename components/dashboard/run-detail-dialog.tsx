"use client";

import { useState, useEffect } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRunDetail } from "@/lib/hooks/use-runs";
import { Code, Eye, Send, Loader2 } from "lucide-react";

interface RunDetailDialogProps {
  runId: string | null;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeTableRows(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    const isSeparator =
      trimmed.startsWith("|") &&
      trimmed.endsWith("|") &&
      /^[|\s\-:]+$/.test(trimmed);

    if (isSeparator) {
      const expectedPipes = (trimmed.match(/\|/g) ?? []).length;
      result.push(lines[i]);
      i++;

      while (i < lines.length) {
        const rowStart = lines[i].trim();

        if (!rowStart.startsWith("|")) {
          break;
        }

        let row = rowStart;
        i++;

        while (
          i < lines.length &&
          (row.match(/\|/g) ?? []).length < expectedPipes
        ) {
          const next = lines[i].trim();
          if (next === "") break;
          row += " " + next;
          i++;
        }

        result.push(row);
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="markdown-table-wrap">
      <table>{children}</table>
    </div>
  ),
};

export function RunDetailDialog({ runId, onClose }: RunDetailDialogProps) {
  const { run, loading } = useRunDetail(runId);
  const [showRaw, setShowRaw] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setResendResult(null);
  }, [runId]);

  async function handleResend() {
    if (!runId || resending) return;
    setResending(true);
    setResendResult(null);
    try {
      const res = await fetch(`/api/runs/${runId}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResendResult({ type: "error", message: data.error ?? "Failed to resend" });
        return;
      }
      setResendResult({
        type: "success",
        message: `Sent to ${data.sentTo.length} recipient${data.sentTo.length !== 1 ? "s" : ""}`,
      });
    } catch {
      setResendResult({ type: "error", message: "Network error" });
    } finally {
      setResending(false);
    }
  }

  return (
    <Dialog open={!!runId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Analysis Report</DialogTitle>
          <DialogDescription>
            {run ? formatDate(run.createdAt) : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {run && (
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={run.status === "completed" ? "default" : "destructive"}
              >
                {run.status}
              </Badge>
              <span className="font-mono-num text-muted-foreground text-[0.6875rem]">
                {run.inputTokens.toLocaleString()} in /{" "}
                {run.outputTokens.toLocaleString()} out
              </span>
              <span className="font-mono-num text-muted-foreground text-[0.6875rem]">
                ${run.costUsd.toFixed(4)}
              </span>
              {run.emailsSentTo.length > 0 && (
                <span className="text-muted-foreground text-[0.6875rem]">
                  Sent to {run.emailsSentTo.length} recipient
                  {run.emailsSentTo.length !== 1 && "s"}
                </span>
              )}
              {run.status !== "failed" && (
                <div className="ml-auto flex items-center gap-1">
                  {resendResult && (
                    <span
                      className={`text-[0.6875rem] ${resendResult.type === "success" ? "text-emerald-400" : "text-destructive"}`}
                    >
                      {resendResult.message}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    <span className="hidden sm:inline">Resend</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRaw((v) => !v)}
                  >
                    {showRaw ? <Eye className="size-3" /> : <Code className="size-3" />}
                    <span className="hidden sm:inline">{showRaw ? "Rendered" : "Raw"}</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {run.status === "failed" && run.errorMessage ? (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive text-xs">
                  {run.errorMessage}
                </div>
              ) : showRaw ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-[0.6875rem] text-muted-foreground leading-relaxed select-all">
                  {run.response}
                </pre>
              ) : (
                <div className="markdown-body text-xs leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {normalizeTableRows(run.response)}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
