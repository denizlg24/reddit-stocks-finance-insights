"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function PendingUsers() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users/pending");
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleApprove(id: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/users/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } finally {
      setActioning(null);
    }
  }

  async function handleReject(id: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/users/${id}/approve`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No pending users
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Email</th>
            <th className="pb-2 pr-4 font-medium">Signed up</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b border-border/30">
              <td className="py-3 pr-4">{user.name}</td>
              <td className="font-mono-num py-3 pr-4 text-xs text-muted-foreground">
                {user.email}
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="py-3">
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actioning === user._id}
                    onClick={() => handleApprove(user._id)}
                  >
                    <Check className="size-3.5" />
                    <span className="hidden sm:inline">Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={actioning === user._id}
                    onClick={() => handleReject(user._id)}
                  >
                    <X className="size-3.5" />
                    <span className="hidden sm:inline">Reject</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
