import { Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RESOURCE_LEVEL_LABELS, type ResourceLevel } from "@/lib/types"

// 各级别配色：精品最醒目（金色调），市/区/校用中性梯度
const LEVEL_CLASS: Record<ResourceLevel, string> = {
  premium: "border-chart-4/40 bg-chart-4/15 text-chart-4",
  city: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  district: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  school: "border-chart-3/30 bg-chart-3/10 text-chart-3",
}

// 方角实心级别角标（对齐教师端：市/区/校/精 单字方块）
const LEVEL_CHIP_CLASS: Record<ResourceLevel, string> = {
  premium: "bg-chart-4 text-white",
  city: "bg-chart-1 text-white",
  district: "bg-chart-2 text-white",
  school: "bg-chart-3 text-white",
}
const LEVEL_SHORT: Record<ResourceLevel, string> = {
  premium: "精",
  city: "市",
  district: "区",
  school: "校",
}

export function LevelChip({ level, className }: { level: ResourceLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded text-xs font-medium",
        LEVEL_CHIP_CLASS[level],
        className,
      )}
      title={RESOURCE_LEVEL_LABELS[level]}
    >
      {LEVEL_SHORT[level]}
    </span>
  )
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
