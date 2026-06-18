"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowRight, Sparkles, Wand2 } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { ChapterMappingPair, ChapterNode, Textbook } from "@/lib/types"

const NONE = "__none__"

export default function MigratePage() {
  const { textbooks, chapters, questions, migrateByMapping } = useStore()

  const mathTextbooks = textbooks.filter((t) => t.subject === "数学")
  const [fromId, setFromId] = useState<string>(mathTextbooks[0]?.id ?? "")
  const [toId, setToId] = useState<string>(mathTextbooks[1]?.id ?? "")
  const [pairs, setPairs] = useState<Record<string, string>>({})

  const tbLabel = (t?: Textbook) =>
    t ? `${t.version} · ${t.subject}${t.grade}（${t.year}）` : ""

  // 可挂题的叶子章节（声明了知识点的节点）
  const leafChapters = (tbId: string) =>
    chapters.filter((c) => c.textbookId === tbId && c.knowledgePointIds.length > 0)

  const fromChapters = useMemo(() => leafChapters(fromId), [fromId, chapters])
  const toChapters = useMemo(() => leafChapters(toId), [toId, chapters])

  // 自动推荐：按共享知识点数量匹配
  function recommend(): Record<string, string> {
    const next: Record<string, string> = {}
    fromChapters.forEach((fc) => {
      let best: { id: string; score: number } | null = null
      toChapters.forEach((tc) => {
        const shared = tc.knowledgePointIds.filter((id) =>
          fc.knowledgePointIds.includes(id),
        ).length
        if (shared > 0 && (!best || shared > best.score)) {
          best = { id: tc.id, score: shared }
        }
      })
      if (best) next[fc.id] = best.id
    })
    return next
  }

  // 切换教材时自动给出推荐
  useEffect(() => {
    if (fromId && toId && fromId !== toId) {
      setPairs(recommend())
    } else {
      setPairs({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId, toId])

  const confidenceOf = (fc: ChapterNode, toChapterId?: string) => {
    if (!toChapterId) return 0
    const tc = toChapters.find((c) => c.id === toChapterId)
    if (!tc) return 0
    const shared = tc.knowledgePointIds.filter((id) =>
      fc.knowledgePointIds.includes(id),
    ).length
    const denom = Math.max(fc.knowledgePointIds.length, 1)
    return Math.round((shared / denom) * 100)
  }

  const qCountOf = (chapterId: string) =>
    questions.filter((q) =>
      q.chapterMounts.some((m) => m.textbookId === fromId && m.chapterId === chapterId),
    ).length

  const mappedPairs = Object.values(pairs).filter(Boolean).length
  const migratableQuestions = fromChapters
    .filter((fc) => pairs[fc.id])
    .reduce((sum, fc) => sum + qCountOf(fc.id), 0)

  const toItems = {
    [NONE]: "暂不对应",
    ...Object.fromEntries(toChapters.map((c) => [c.id, c.title])),
  }

  function applyMigration() {
    const list: ChapterMappingPair[] = fromChapters.map((fc) => ({
      fromChapterId: fc.id,
      toChapterId: pairs[fc.id] || null,
    }))
    const migrated = migrateByMapping(fromId, toId, list)
    if (migrated > 0) toast.success(`已按映射批量继承 ${migrated} 道题到新教材`)
    else toast.info("没有可继承的题目，请检查映射与原教材挂题情况")
  }

  return (
    <div>
      <PageHeader
        title="换教材 · 章节映射"
        description="换教材不搬题目，只做几十条「旧章节 → 新章节」的对应。系统按共享知识点自动推荐，确认后所有题目顺映射批量继承，无需逐题迁移。"
      />

      {/* 教材选择 */}
      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">原教材（迁出）</label>
            <Select value={fromId} onValueChange={setFromId} items={Object.fromEntries(mathTextbooks.map((t) => [t.id, tbLabel(t)]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {mathTextbooks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{tbLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-accent text-accent-foreground sm:mb-1">
            <ArrowRight className="size-4" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">新教材（迁入）</label>
            <Select value={toId} onValueChange={setToId} items={Object.fromEntries(mathTextbooks.map((t) => [t.id, tbLabel(t)]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {mathTextbooks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{tbLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => setPairs(recommend())} className="sm:mb-0.5">
            <Wand2 className="size-4" /> 重新自动推荐
          </Button>
        </CardContent>
      </Card>

      {fromId === toId ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          请选择两套不同的教材进行映射。
        </p>
      ) : (
        <>
          {/* 汇总条 */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <Sparkles className="size-5 text-primary" />
            <p className="text-sm">
              共 <b>{fromChapters.length}</b> 个待映射章节，已对应{" "}
              <b className="text-primary">{mappedPairs}</b> 个，将批量继承约{" "}
              <b className="text-primary tabular-nums">{migratableQuestions}</b> 道题。
            </p>
            <Button className="ml-auto" onClick={applyMigration} disabled={mappedPairs === 0}>
              应用映射并批量继承
            </Button>
          </div>

          {/* 映射表头 */}
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-3 text-xs font-medium text-muted-foreground">
            <span>原教材章节 · {tbLabel(textbooks.find((t) => t.id === fromId))}</span>
            <span />
            <span>新教材章节 · {tbLabel(textbooks.find((t) => t.id === toId))}</span>
            <span className="text-right">置信度</span>
          </div>

          {/* 映射行 */}
          <div className="space-y-2">
            {fromChapters.map((fc) => {
              const target = pairs[fc.id]
              const conf = confidenceOf(fc, target)
              const qc = qCountOf(fc.id)
              return (
                <Card key={fc.id} className={cn(!target && "border-dashed")}>
                  <CardContent className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fc.title}</p>
                      <p className="text-xs text-muted-foreground">{qc} 道题待继承</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <Select
                      value={target || NONE}
                      items={toItems}
                      onValueChange={(v) =>
                        setPairs((prev) => ({ ...prev, [fc.id]: v === NONE ? "" : v }))
                      }
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>暂不对应</SelectItem>
                        {toChapters.map((tc) => (
                          <SelectItem key={tc.id} value={tc.id}>{tc.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-right">
                      {target ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-normal tabular-nums",
                            conf >= 100
                              ? "border-chart-3/40 bg-chart-3/10 text-chart-3"
                              : "border-chart-4/40 bg-chart-4/10 text-chart-4",
                          )}
                        >
                          {conf}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
