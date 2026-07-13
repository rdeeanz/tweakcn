import { cn } from "@/presentation/lib/utils";
import type { AvailabilityStatus } from "@simfas/shared";
import { availabilityStatusLabel } from "@simfas/shared";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
      {...props}
    />
  );
}

/** Badge warna status availability (PRD §7.3). */
export function AvailabilityBadge({
  status,
  pct,
}: {
  status: AvailabilityStatus | null | undefined;
  pct?: number | null;
}) {
  if (!status) {
    return <Badge className="text-muted-foreground">—</Badge>;
  }
  return (
    <Badge className={`status-${status} border`}>
      {availabilityStatusLabel(status)}
      {pct != null ? ` ${pct.toFixed(1)}%` : ""}
    </Badge>
  );
}
