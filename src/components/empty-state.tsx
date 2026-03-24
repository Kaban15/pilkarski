import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  return (
    <Card className="py-16 text-center animate-fade-in">
      <CardContent>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {actionLabel}
          </Link>
        )}
        {actionLabel && actionOnClick && !actionHref && (
          <button
            type="button"
            onClick={actionOnClick}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
