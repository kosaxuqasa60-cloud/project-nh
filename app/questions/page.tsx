"use client"

import { useState } from "react"
import { Link2, Plus } from "lucide-react"
import { MountDialog } from "@/components/admin/mount-dialog"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/types"
import { cn } from "@/lib/utils"

const ALL = "all"

const DIFF_LABELS = ["", "极易", "容易", "中等", "较难", "困难"]

export default function QuestionsPage() {
  const { questions, textbooks, chapters } = useStore()
  const [type, setType] = useState(ALL)
  const [tbFilter, setTbFilter] = useState(ALL)

  const filtered = questions.filter(
    (q) =>
      (type === ALL || q.type === type) &&
      (tbFilter === ALL || q.mounts.some((m) => m.textbookId === tbFilter)),
  )

  const typeItems = { all: "全部", ...QUESTION_TYPE_LABELS }
  const tbFilterItems = {
    all: "全部",
    ...Object.fromEntries(
      textbooks.map((t) => [t.id, `${t.version} · ${t.subject} ${t.grade}`]),
    ),
  }

  return (
    <div>
      <PageHeader
        title="题库管理"
        description="题目独立于教材存在，通过「挂载」与教材章节建立多对多关系。一道题可被多个版本教材复用。"
        actions={
          <Button>
            <Plus className="size-4" /> 新建题目
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">题型</span>
          <Select value={type} onValueChange={setType} items={typeItems}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">挂载教材</span>
          <Select value={tbFilter} onValueChange={setTbFilter} items={tbFilterItems}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {textbooks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.version} · {t.subject} {t.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          共 {filtered.length} 道题
        </span>
      </Card>

      <div className="space-y-3">
        {filtered.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {QUESTION_TYPE_LABELS[q.type]}
                  </Badge>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {q.subject}
                  </Badge>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      q.difficulty <= 2
                        ? "bg-chart-3/15 text-chart-3"
                        : q.difficulty === 3
                          ? "bg-chart-4/15 text-chart-4"
                          : "bg-chart-5/15 text-chart-5",
                    )}
                  >
                    {DIFF_LABELS[q.difficulty]}
                  </span>
                  <span className="text-xs text-muted-foreground">更新于 {q.updatedAt}</span>
                </div>
                <p className="text-sm text-foreground/90">{q.stem}</p>

                {/* 挂载关系 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {q.mounts.length === 0 ? (
                    <span className="text-xs text-muted-foreground">未挂载到任何教材</span>
                  ) : (
                    q.mounts.map((m) => {
                      const tb = textbooks.find((t) => t.id === m.textbookId)
                      const ch = chapters.find((c) => c.id === m.chapterId)
                      return (
                        <Badge
                          key={`${m.textbookId}-${m.chapterId}`}
                          variant="outline"
                          className="gap-1 border-primary/20 bg-primary/5 font-normal text-primary"
                        >
                          <Link2 className="size-3" />
                          {tb?.version} {ch?.title}
                        </Badge>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <MountDialog
                  question={q}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Link2 className="size-4" /> 管理挂载（{q.mounts.length}）
                    </Button>
                  }
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
