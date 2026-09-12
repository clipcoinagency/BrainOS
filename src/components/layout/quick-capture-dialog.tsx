"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "@/features/notes/actions";

const QUICK_CAPTURE_EVENT = "brainos:open-quick-capture";

/** Programmatically open the quick-capture dialog from anywhere on the
 * client — the topbar's Capture button and the command palette's "Quick
 * capture" item both trigger this instead of managing their own dialog
 * state, matching `openCommandMenu()`'s event-based pattern. */
export function openQuickCapture() {
  window.dispatchEvent(new Event(QUICK_CAPTURE_EVENT));
}

/**
 * A fast, always-available capture box: jot something down without leaving
 * the page you're on, and it's saved as a new note. Deliberately doesn't
 * navigate away on save — the point is to capture and get back to what you
 * were doing, not to switch context into the editor.
 */
export function QuickCaptureDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onOpenEvent = () => setOpen(true);
    window.addEventListener(QUICK_CAPTURE_EVENT, onOpenEvent);
    return () => window.removeEventListener(QUICK_CAPTURE_EVENT, onOpenEvent);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setContent("");
  }

  function handleCapture() {
    const trimmed = content.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await createNote({ content: trimmed });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      handleOpenChange(false);
      toast.success("Captured to Notes.", {
        action: {
          label: "Open",
          onClick: () => router.push(`/notes/${result.data.id}`),
        },
      });
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleCapture();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick capture</DialogTitle>
          <DialogDescription>
            Jot something down — it&apos;s saved as a note you can organize
            later.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          aria-label="Quick capture content"
          autoFocus
          className="min-h-32 resize-none"
        />

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-muted-foreground text-xs">
            <kbd className="bg-muted rounded border px-1 py-0.5 font-mono">
              ⌘
            </kbd>
            <kbd className="bg-muted rounded border px-1 py-0.5 font-mono">
              Enter
            </kbd>{" "}
            to save
          </span>
          <Button
            onClick={handleCapture}
            disabled={!content.trim() || isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
