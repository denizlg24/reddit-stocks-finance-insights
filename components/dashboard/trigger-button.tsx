"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Loader2 } from "lucide-react";

interface TriggerButtonProps {
  onComplete: () => void;
}

export function TriggerButton({ onComplete }: TriggerButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrigger() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze",{method: "GET"});

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Analysis failed");
        return;
      }

      setOpen(false);
      onComplete();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Play className="size-3" />
          Run Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Analysis</DialogTitle>
          <DialogDescription>
            This will analyze r/stocks, generate a report, and email it to all
            active recipients. It typically takes 30–60 seconds.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-destructive text-xs">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleTrigger} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="size-3" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
