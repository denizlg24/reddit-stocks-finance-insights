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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRecipients } from "@/lib/hooks/use-runs";
import { Plus, Trash2 } from "lucide-react";

export function RecipientsManager() {
  const { recipients, loading, addRecipient, toggleRecipient, deleteRecipient } =
    useRecipients();
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);

    try {
      await addRecipient(email, name);
      setEmail("");
      setName("");
      setAddOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {recipients.length} recipient{recipients.length !== 1 && "s"}
        </span>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="size-3" />
              Add Recipient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recipient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-name">Name</Label>
                <Input
                  id="rec-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-email">Email</Label>
                <Input
                  id="rec-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john@example.com"
                />
              </div>
              {addError && (
                <p className="text-destructive text-xs">{addError}</p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recipients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground text-sm">No recipients yet</p>
          <p className="text-muted-foreground text-xs">
            Add email addresses to receive analysis reports
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.name}</TableCell>
                <TableCell className="font-mono-num text-muted-foreground">
                  {r.email}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={r.active}
                    onCheckedChange={(checked) =>
                      toggleRecipient(r._id, checked)
                    }
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon-xs">
                        <Trash2 className="size-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove recipient</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove {r.name} ({r.email}) from the recipient list?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRecipient(r._id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
