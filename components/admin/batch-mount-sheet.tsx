"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Check, Sparkles, Zap } from "lucide-react"
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
import { QUESTION_TYPE_LABELS } from "@/lib/types"

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
    questions,
    knowledgePoints,
    batchMountQuestions,
    autoCollectByKnowledgePoints,
    setChapterKnowledgePoints,
  } = useStore()

  const chapter = chapters.find((c) => c.id === chapterId)
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const chapterKps = useMemo(
    () => knowledgePoints.filter((kp) => chapter?.knowledgePointIds.includes(kp.id)),
    [knowledgePoints, chapter],
  )

  // 命中本章节知识点、且尚未挂载到本章节的题目（自动归集预览）
  const autoMatches = useMemo(() => {
    if (!chapter) return []
    const kpSet = new Set(chapter.knowledgePointIds)
    return questions.filter(
      (q) =>
        q.knowledgePointIds.some((id) => kpSet.has(id)) &&
        !q.chapterMounts.some(
          (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
        ),
    )
  }, [chapter, questions, textbookId])

  // 手动选题列表：同学科、未挂入本章节
  const manualList = useMemo(() => {
    if (!chapter) return []
    return questions.filter((q) => {
      const notMounted = !q.chapterMounts.some(
        (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
      )
      const matchKw = !keyword || q.stem.includes(keyword)
      return notMounted && matchKw
    })
  }, [chapter, questions, textbookId, keyword])

  if (!chapter) return null

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  function runAutoCollect() {
    const n = autoCollectByKnowledgePoints(textbookId, chapter!.id)
    if (n > 0) toast.success(`已按知识点自动归集 ${n} 道题到本节`)
    else toast.info("没有可新增的题目（已全部归集或未声明知识点）")
  }

  function mountSelected() {
    if (selected.size === 0) {
      toast.error("请先勾选题目")
      return
    }
    batchMountQuestions(textbookId, chapter!.id, Array.from(selected))
    toast.success(`已批量挂入 ${selected.size} 道题`)
    setSelected(new Set())
  }

  const kpItems = knowledgePoints.filter((kp) => kp.subject === "数学")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base">批量挂题 · {chapter.title}</SheetTitle>
          <SheetDescription>
            优先用知识点一键归集，特殊题目再手动批量勾选补充。
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* 知识点声明 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">本节声明的知识点</h3>
              <span className="text-xs text-muted-foreground">点击标签增减</span>
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
                <p className="text-sm font-medium">按知识点一键归集</p>
                <p className="text-xs text-muted-foreground">
                  命中本节知识点、且尚未挂入的题目有{" "}
                  <span className="font-semibold text-primary tabular-nums">
                    {autoMatches.length}
                  </span>{" "}
                  道。换教材时这一步同样适用。
                </p>
              </div>
              <Button size="sm" onClick={runAutoCollect} disabled={autoMatches.length === 0}>
                <Zap className="size-4" /> 一键归集
              </Button>
            </div>
            {autoMatches.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-primary/15 pt-3">
                {autoMatches.slice(0, 3).map((q) => (
                  <p key={q.id} className="truncate text-xs text-muted-foreground">
                    · {q.stem}
                  </p>
                ))}
                {autoMatches.length > 3 && (
                  <p className="text-xs text-muted-foreground/70">
                    等共 {autoMatches.length} 道…
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator className="my-5" />

          {/* 手动批量选题 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">手动批量选题</h3>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索题干…"
                className="h-8 w-44"
              />
            </div>
            <div className="space-y-1.5">
              {manualList.map((q) => {
                const checked = selected.has(q.id)
                return (
                  <label
                    key={q.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(q.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm leading-snug text-foreground/90">{q.stem}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="font-normal">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                        {q.knowledgePointIds.map((id) => {
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
                  没有可挂入的题目。
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            已勾选 <span className="font-semibold text-foreground">{selected.size}</span> 道
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button onClick={mountSelected} disabled={selected.size === 0}>
              批量挂入选中题目
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
