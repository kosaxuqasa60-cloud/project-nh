"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BookOpen, FileStack, ListTree } from "lucide-react"
import { ChapterTree } from "@/components/admin/chapter-tree"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { STAGE_LABELS, VOLUME_LABELS } from "@/lib/types"

export default function TextbookDetailPage() {
  const params = useParams<{ id: string }>()
  const { textbooks, chapters, questions, countQuestionsByTextbook } = useStore()
  const tb = textbooks.find((t) => t.id === params.id)

  if (!tb) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        未找到该教材。
        <div className="mt-4">
          <Button variant="outline" render={<Link href="/textbooks" />}>
            返回教材列表
          </Button>
        </div>
      </div>
    )
  }

  const chapterCount = chapters.filter((c) => c.textbookId === tb.id).length
  const mountedQuestions = questions.filter((q) =>
    q.mounts.some((m) => m.textbookId === tb.id),
  )

  const meta = [
    ["学科", tb.subject],
    ["学段", STAGE_LABELS[tb.stage]],
    ["年级", tb.grade],
    ["册次", VOLUME_LABELS[tb.volume]],
    ["版本", tb.version],
    ["年份", `${tb.year} 年`],
  ] as const

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/textbooks" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-4" /> 教材管理
        </Link>
        <span>/</span>
        <span className="text-foreground">教材详情</span>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BookOpen className="size-7" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-balance text-xl font-semibold">{tb.name}</h1>
                <StatusBadge status={tb.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {meta.map(([k, v]) => (
                  <span key={k}>
                    <span className="text-muted-foreground/70">{k}：</span>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <Stat icon={<ListTree className="size-4" />} value={chapterCount} label="章节节点" />
            <Stat
              icon={<FileStack className="size-4" />}
              value={countQuestionsByTextbook(tb.id)}
              label="挂载题目"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chapters">
        <TabsList>
          <TabsTrigger value="chapters">章节目录</TabsTrigger>
          <TabsTrigger value="questions">已挂载题目</TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">章节目录编辑</CardTitle>
            </CardHeader>
            <CardContent>
              <ChapterTree textbookId={tb.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                挂载在本教材的题目（{mountedQuestions.length}）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mountedQuestions.map((q) => {
                const chapterId = q.mounts.find((m) => m.textbookId === tb.id)?.chapterId
                const chapter = chapters.find((c) => c.id === chapterId)
                const otherCount = q.mounts.filter((m) => m.textbookId !== tb.id).length
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3"
                  >
                    <Badge variant="secondary" className="mt-0.5 shrink-0 font-normal">
                      {chapter?.title ?? "未归类"}
                    </Badge>
                    <p className="flex-1 text-sm text-foreground/90">{q.stem}</p>
                    {otherCount > 0 && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-chart-2/30 bg-chart-2/10 text-chart-2"
                      >
                        另挂 {otherCount} 个教材
                      </Badge>
                    )}
                  </div>
                )
              })}
              {mountedQuestions.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  暂无挂载题目，可在题库管理中将题目挂载到本教材章节。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="min-w-16">
      <div className="flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
    </div>
  )
}
