import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type TextbookStatus } from "@/lib/types"

const STYLES: Record<TextbookStatus, string> = {
  published: "border-transparent bg-chart-3/15 text-chart-3",
  draft: "border-transparent bg-chart-4/15 text-chart-4",
  archived: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({ status }: { status: TextbookStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
