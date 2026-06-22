"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FileStack, FileText, Radio, Trash2, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SYNC_RESOURCE_LABELS, SYNC_RESOURCE_TYPES, type SyncResourceType } from "@/lib/types"

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

export function MountedResourcesPanel({ textbookId }: { textbookId: string }) {
  const { chapters, resourcesByKind, unmountResource } = useStore()
  const [kind, setKind] = useState<SyncResourceType>("question")
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const chapterTitle = (id: string) =>
    chapters.find((c) => c.id === id)?.title ?? "未归类"

  // 每个类型挂载在本教材的数量（用于 tab 角标）
  const countByKind = useMemo(() => {
    const map = {} as Record<SyncResourceType, number>
    for (const k of SYNC_RESOURCE_TYPES) {
      map[k] = resourcesByKind(k).filter((r) =>
        r.chapterMounts.some((m) => m.textbookId === textbookId),
      ).length
    }
    return map
  }, [resourcesByKind, textbookId])

  // 当前类型挂在本教材的资源，按章节分组
  const groups = useMemo(() => {
    const list = resourcesByKind(kind).filter((r) =>
      r.chapterMounts.some((m) => m.textbookId === textbookId),
    )
    const byChapter = new Map<
      string,
      { id: string; title: string; subtitle?: string; otherCount: number }[]
    >()
    for (const r of list) {
      if (keyword && !r.title.includes(keyword)) continue
      const mount = r.chapterMounts.find((m) => m.textbookId === textbookId)
      const chId = mount?.chapterId ?? "none"
      const otherCount = r.chapterMounts.filter((m) => m.textbookId !== textbookId).length
      if (!byChapter.has(chId)) byChapter.set(chId, [])
      byChapter.get(chId)!.push({ id: r.id, title: r.title, subtitle: r.subtitle, otherCount })
    }
    return Array.from(byChapter.entries()).map(([chapterId, items]) => ({
      chapterId,
      title: chapterTitle(chapterId),
      items,
    }))
  }, [resourcesByKind, kind, textbookId, keyword, chapters])

  const visibleIds = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.id)),
    [groups],
  )
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  function switchKind(k: SyncResourceType) {
    setKind(k)
    setSelected(new Set())
    setKeyword("")
  }
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(visibleIds))
  }

  // 移出单个（找到它在本教材下的章节锚点逐一解除）
  function removeOne(id: string) {
    const r = resourcesByKind(kind).find((x) => x.id === id)
    if (!r) return
    r.chapterMounts
      .filter((m) => m.textbookId === textbookId)
      .forEach((m) => unmountResource(kind, id, textbookId, m.chapterId))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    toast.success("已移出本教材")
  }
  function removeSelected() {
    if (selected.size === 0) return
    const list = resourcesByKind(kind)
    selected.forEach((id) => {
      const r = list.find((x) => x.id === id)
      r?.chapterMounts
        .filter((m) => m.textbookId === textbookId)
        .forEach((m) => unmountResource(kind, id, textbookId, m.chapterId))
    })
    toast.success(`已移出 ${selected.size} 个${SYNC_RESOURCE_LABELS[kind]}`)
    setSelected(new Set())
  }

  return (
    <div className="space-y-4">
      {/* 类型切换 */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {SYNC_RESOURCE_TYPES.map((k) => {
          const Icon = KIND_ICON[k]
          const active = kind === k
          return (
            <button
              key={k}
              onClick={() => switchKind(k)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {SYNC_RESOURCE_LABELS[k]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {countByKind[k]}
              </span>
            </button>
          )
        })}
      </div>

      {/* 工具条 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={visibleIds.length === 0} />
          全选（{visibleIds.length}）
        </label>
        <div className="flex items-center gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题…"
            className="h-8 w-44"
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            <Trash2 className="size-4" /> 批量移出（{selected.size}）
          </Button>
        </div>
      </div>

      {/* 分组列表 */}
      {groups.length > 0 ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.chapterId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">{g.title}</h3>
                <span className="text-xs text-muted-foreground">{g.items.length} 项</span>
              </div>
              <div className="space-y-1.5">
                {g.items.map((it) => {
                  const checked = selected.has(it.id)
                  return (
                    <div
                      key={it.id}
                      className={cn(
                        "flex items-start gap-3 rounded-md border p-3 transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(it.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm leading-snug text-foreground/90">{it.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {it.subtitle && (
                            <Badge variant="secondary" className="font-normal">
                              {it.subtitle}
                            </Badge>
                          )}
                          {it.otherCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-chart-2/30 bg-chart-2/10 font-normal text-chart-2"
                            >
                              另挂 {it.otherCount} 个教材
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 text-xs text-destructive hover:text-destructive"
                        onClick={() => removeOne(it.id)}
                      >
                        移出
                      </Button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {keyword
            ? `没有匹配「${keyword}」的${SYNC_RESOURCE_LABELS[kind]}。`
            : `本教材还没有挂载${SYNC_RESOURCE_LABELS[kind]}，可在「章节目录」中点节点的「批量挂载」挂入。`}
        </p>
      )}
    </div>
  )
}
