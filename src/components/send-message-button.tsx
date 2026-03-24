"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SendMessageButtonProps {
  recipientUserId: string;
}

export function SendMessageButton({ recipientUserId }: SendMessageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const send = api.message.send.useMutation({
    onSuccess: (result) => {
      router.push(`/messages/${result.conversationId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSend() {
    if (!message.trim()) return;
    send.mutate({ recipientUserId, content: message.trim() });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Napisz wiadomość
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Napisz wiadomość..."
        maxLength={2000}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button onClick={handleSend} disabled={send.isPending || !message.trim()} size="sm">
        {send.isPending ? "..." : "Wyślij"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setMessage(""); }}>
        Anuluj
      </Button>
    </div>
  );
}
