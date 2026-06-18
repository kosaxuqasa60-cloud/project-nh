"use client"

import { useMemo, useState } from "react"
import { FileStack, Tags, TriangleAlert } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/types"

const ALL = "all"

export default function QuestionsPage() {
  const { questions, textbooks, chapters, knowledgePoints } = useStore()
  const [keyword, setKeyword] = useState("")
  const [type, setType] = useState<string>(ALL)
  const [kpFilter, setKpFilter] = useState<string>(ALL)

  const kpName = (id: string) => knowledgePoints.find((k) => k.id === id)?.name ?? id

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (type === ALL || q.type === type) &&
          (kpFilter === ALL || q.knowledgePointIds.includes(kpFilter)) &&
          (!keyword || q.stem.includes(keyword)),
      ),
    [questions, type, kpFilter, keyword],
  )

  const untagged = questions.filter((q) => q.knowledgePointIds.length === 0).length

  const typeItems = { all: "全部题型", ...QUESTION_TYPE_LABELS }
  const kpItems = {
    all: "全部知识点",
    ...Object.fromEntries(knowledgePoints.map((k) => [k.id, k.name])),
  }

  return (
    <div>
      <PageHeader
        title="题库管理"
        description="题目以「知识点标签」为核心。打好标签后，题目即可被任意版本教材的章节自动归集，无需逐题挂载。章节挂载在「教材详情 → 批量挂题」中批量完成。"
      />

      {untagged > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-chart-4/30 bg-chart-4/10 px-4 py-2.5 text-sm text-chart-4">
          <TriangleAlert className="size-4 shrink-0" />
          有 {untagged} 道题尚未打知识点标签，将无法被自动归集，请尽快补充。
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索题干…"
          className="h-9 w-56"
        />
        <Select value={type} onValueChange={setType} items={typeItems}>
          <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部题型</SelectItem>
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
              <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kpFilter} onValueChange={setKpFilter} items={kpItems}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部知识点</SelectItem>
            {knowledgePoints.map((k) => (
              <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          共 {filtered.length} 道题
        </span>
      </div>

      <div className="space-y-2.5">
        {filtered.map((q) => {
          const mountTbs = Array.from(new Set(q.chapterMounts.map((m) => m.textbookId)))
          return (
            <Card key={q.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5 shrink-0 font-normal">
                    {QUESTION_TYPE_LABELS[q.type]}
                  </Badge>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                    {q.stem}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    难度 {q.difficulty}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pl-1">
                  <Tags className="size-3.5 text-chart-2" />
                  {q.knowledgePointIds.length > 0 ? (
                    q.knowledgePointIds.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="border-chart-2/30 bg-chart-2/10 font-normal text-chart-2"
                      >
                        {kpName(id)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-chart-4">未打标签</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2 pl-1">
                  <FileStack className="size-3.5 text-muted-foreground" />
                  {mountTbs.length > 0 ? (
                    mountTbs.map((tbId) => {
                      const tb = textbooks.find((t) => t.id === tbId)
                      const m = q.chapterMounts.find((x) => x.textbookId === tbId)
                      const ch = chapters.find((c) => c.id === m?.chapterId)
                      return (
                        <Badge key={tbId} variant="secondary" className="font-normal">
                          {tb?.version} · {ch?.title}
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      暂未挂入任何教材章节（可在章节批量挂题中归集）
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
