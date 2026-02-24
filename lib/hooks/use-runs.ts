"use client";

import { useState, useEffect, useCallback } from "react";

interface RunSummary {
  _id: string;
  status: "pending" | "completed" | "failed";
  inputTokens: number;
  outputTokens: number;
  searchQueries: number;
  costUsd: number;
  errorMessage?: string;
  emailsSentTo: string[];
  createdAt: string;
  completedAt?: string;
}

interface RunDetail extends RunSummary {
  prompt: string;
  response: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalRuns: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalSearchQueries: number;
  lastRunDate: string | null;
}

interface Recipient {
  _id: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export function useRuns(page = 1, limit = 20) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs?page=${page}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
        setPagination(data.pagination);
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, pagination, loading, refetch: fetchRuns };
}

export function useRunDetail(id: string | null) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setRun(null);
      return;
    }

    setLoading(true);
    fetch(`/api/runs/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRun(data))
      .catch(() => setRun(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { run, loading };
}

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/recipients");
      if (res.ok) setRecipients(await res.json());
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const addRecipient = async (email: string, name: string) => {
    const res = await fetch("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to add recipient");
    }
    await fetchRecipients();
  };

  const toggleRecipient = async (id: string, active: boolean) => {
    await fetch(`/api/recipients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    await fetchRecipients();
  };

  const deleteRecipient = async (id: string) => {
    await fetch(`/api/recipients/${id}`, { method: "DELETE" });
    await fetchRecipients();
  };

  return {
    recipients,
    loading,
    addRecipient,
    toggleRecipient,
    deleteRecipient,
    refetch: fetchRecipients,
  };
}
