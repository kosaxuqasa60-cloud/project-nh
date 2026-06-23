import { Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RESOURCE_LEVEL_LABELS, type ResourceLevel } from "@/lib/types"

// 各级别配色：精品最醒目（金色调），市/区/校用中性梯度
const LEVEL_CLASS: Record<ResourceLevel, string> = {
  premium: "border-chart-4/40 bg-chart-4/15 text-chart-4",
  city: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  district: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  school: "border-border bg-muted text-muted-foreground",
}

export function LevelBadge({
  level,
  ownerScope,
  className,
}: {
  level: ResourceLevel
  ownerScope?: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", LEVEL_CLASS[level], className)}>
      {level === "premium" && <Crown className="size-3" />}
      {RESOURCE_LEVEL_LABELS[level]}
      {level !== "premium" && ownerScope ? ` · ${ownerScope}` : ""}
    </Badge>
  )
}
