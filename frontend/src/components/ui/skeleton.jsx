import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton-shine rounded-md bg-muted", className)} {...props} />;
}

