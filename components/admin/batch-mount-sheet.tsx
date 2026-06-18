"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Check, FileStack, FileText, Radio, Sparkles, Video, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SYNC_RESOURCE_LABELS, SYNC_RESOURCE_TYPES, type SyncResourceType } from "@/lib/types"

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

export function BatchMountSheet({
  textbookId,
  chapterId,
  open,
  onOpenChange,
}: {
  textbookId: string
  chapterId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const {
    chapters,
    knowledgePoints,
    resourcesByKind,
    batchMountResources,
    autoCollectByKnowledgePoints,
    setChapterKnowledgePoints,
  } = useStore()

  const chapter = chapters.find((c) => c.id === chapterId)
  const [kind, setKind] = useState<SyncResourceType>("question")
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const resources = useMemo(() => resourcesByKind(kind), [resourcesByKind, kind])

  // 命中本章节知识点、且尚未挂载到本章节的资源（自动归集预览）
  const autoMatches = useMemo(() => {
    if (!chapter) return []
    const kpSet = new Set(chapter.knowledgePointIds)
    return resources.filter(
      (r) =>
        r.knowledgePointIds.some((id) => kpSet.has(id)) &&
        !r.chapterMounts.some(
          (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
        ),
    )
  }, [chapter, resources, textbookId])

  // 手动选资源列表：未挂入本章节
  const manualList = useMemo(() => {
    if (!chapter) return []
    return resources.filter((r) => {
      const notMounted = !r.chapterMounts.some(
        (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
      )
      const matchKw = !keyword || r.title.includes(keyword)
      return notMounted && matchKw
    })
  }, [chapter, resources, textbookId, keyword])

  if (!chapter) return null

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  function switchKind(k: SyncResourceType) {
    setKind(k)
    setSelected(new Set())
    setKeyword("")
  }

  function runAutoCollect() {
    const n = autoCollectByKnowledgePoints(kind, textbookId, chapter!.id)
    if (n > 0) toast.success(`已按知识点自动归集 ${n} 个${SYNC_RESOURCE_LABELS[kind]}到本节`)
    else toast.info("没有可新增的资源（已全部归集或未声明知识点）")
  }

  function mountSelected() {
    if (selected.size === 0) {
      toast.error("请先勾选资源")
      return
    }
    batchMountResources(kind, textbookId, chapter!.id, Array.from(selected))
    toast.success(`已批量挂入 ${selected.size} 个${SYNC_RESOURCE_LABELS[kind]}`)
    setSelected(new Set())
  }

  const kpItems = knowledgePoints.filter((kp) => kp.subject === "数学")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base">批量挂载 · {chapter.title}</SheetTitle>
          <SheetDescription>
            为本节挂载题目 / 作业 / 微课 / 空中课堂。优先用知识点一键归集，再手动批量补充。
          </SheetDescription>
        </SheetHeader>

        {/* 资源类型切换 */}
        <div className="flex gap-1 border-b border-border px-6 py-2.5">
          {SYNC_RESOURCE_TYPES.map((k) => {
            const Icon = KIND_ICON[k]
            const active = kind === k
            return (
              <button
                key={k}
                onClick={() => switchKind(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                {SYNC_RESOURCE_LABELS[k]}
              </button>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* 知识点声明 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">本节声明的知识点</h3>
              <span className="text-xs text-muted-foreground">点击标签增减 · 四类资源共用</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {kpItems.map((kp) => {
                const on = chapter.knowledgePointIds.includes(kp.id)
                return (
                  <button
                    key={kp.id}
                    onClick={() => {
                      const next = on
                        ? chapter.knowledgePointIds.filter((id) => id !== kp.id)
                        : [...chapter.knowledgePointIds, kp.id]
                      setChapterKnowledgePoints(chapter.id, next)
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {on && <Check className="size-3" />}
                    {kp.name}
                  </button>
                )
              })}
            </div>
          </section>

          {/* 一键归集 */}
          <section className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">按知识点一键归集{SYNC_RESOURCE_LABELS[kind]}</p>
                <p className="text-xs text-muted-foreground">
                  命中本节知识点、且尚未挂入的{SYNC_RESOURCE_LABELS[kind]}有{" "}
                  <span className="font-semibold text-primary tabular-nums">
                    {autoMatches.length}
                  </span>{" "}
                  个。
                </p>
              </div>
              <Button size="sm" onClick={runAutoCollect} disabled={autoMatches.length === 0}>
                <Zap className="size-4" /> 一键归集
              </Button>
            </div>
            {autoMatches.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-primary/15 pt-3">
                {autoMatches.slice(0, 3).map((r) => (
                  <p key={r.id} className="truncate text-xs text-muted-foreground">
                    · {r.title}
                  </p>
                ))}
                {autoMatches.length > 3 && (
                  <p className="text-xs text-muted-foreground/70">
                    等共 {autoMatches.length} 个…
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator className="my-5" />

          {/* 手动批量选资源 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">手动批量选{SYNC_RESOURCE_LABELS[kind]}</h3>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题…"
                className="h-8 w-44"
              />
            </div>
            <div className="space-y-1.5">
              {manualList.map((r) => {
                const checked = selected.has(r.id)
                return (
                  <label
                    key={r.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(r.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm leading-snug text-foreground/90">{r.title}</p>
                      <div className="flex flex-wrap gap-1">
                        {r.subtitle && (
                          <Badge variant="secondary" className="font-normal">
                            {r.subtitle}
                          </Badge>
                        )}
                        {r.knowledgePointIds.map((id) => {
                          const kp = knowledgePoints.find((k) => k.id === id)
                          return kp ? (
                            <Badge
                              key={id}
                              variant="outline"
                              className="border-chart-2/30 bg-chart-2/10 font-normal text-chart-2"
                            >
                              {kp.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </label>
                )
              })}
              {manualList.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  没有可挂入的{SYNC_RESOURCE_LABELS[kind]}。
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            已勾选 <span className="font-semibold text-foreground">{selected.size}</span> 个
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button onClick={mountSelected} disabled={selected.size === 0}>
              批量挂入选中{SYNC_RESOURCE_LABELS[kind]}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
