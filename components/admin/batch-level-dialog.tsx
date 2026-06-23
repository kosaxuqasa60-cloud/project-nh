"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import {
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  SCOPE_OPTIONS,
  SYNC_RESOURCE_LABELS,
  type ResourceLevel,
  type SyncResourceType,
} from "@/lib/types"

// 批量设置选中资源的级别（授权范围）。精品全员可见无需归属；市/区/校需选具体归属。
export function BatchLevelDialog({
  kind,
  ids,
  open,
  onOpenChange,
  onDone,
}: {
  kind: SyncResourceType
  ids: string[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}) {
  const { batchUpdateLevel } = useStore()
  const [level, setLevel] = useState<ResourceLevel>("city")
  const [scope, setScope] = useState("")

  const needScope = level !== "premium"
  const scopeOptions = needScope ? SCOPE_OPTIONS[level as Exclude<ResourceLevel, "premium">] : []

  function handleConfirm() {
    if (needScope && !scope) {
      toast.error(`请选择${RESOURCE_LEVEL_LABELS[level]}归属`)
      return
    }
    batchUpdateLevel(kind, ids, level, needScope ? scope : undefined)
    toast.success(`已将 ${ids.length} 个${SYNC_RESOURCE_LABELS[kind]}设为${RESOURCE_LEVEL_LABELS[level]}`, {
      description: needScope ? `归属：${scope}` : "精品资源 · 全员可见",
    })
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量设置级别 / 授权范围</DialogTitle>
          <DialogDescription>
            将选中的 {ids.length} 个{SYNC_RESOURCE_LABELS[kind]}统一设为以下级别与归属。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>级别</Label>
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v as ResourceLevel)
                setScope("")
              }}
              items={RESOURCE_LEVEL_LABELS}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {RESOURCE_LEVEL_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needScope ? (
            <div className="grid gap-2">
              <Label>{RESOURCE_LEVEL_LABELS[level]}归属</Label>
              <Select
                value={scope}
                onValueChange={setScope}
                items={Object.fromEntries(scopeOptions.map((s) => [s, s]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`选择${RESOURCE_LEVEL_LABELS[level]}归属`} />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-sm text-chart-4">
              精品资源由平台管理员维护，全员可见，无需指定归属。
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
