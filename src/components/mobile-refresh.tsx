"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface MobileRefreshProps {
  onRefresh: () => void;
  loading?: boolean;
}

export function MobileRefresh({ onRefresh, loading }: MobileRefreshProps) {
  return (
    <div className="mb-4 flex justify-end md:hidden">
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-xs text-muted-foreground"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Odśwież
      </Button>
    </div>
  );
}
