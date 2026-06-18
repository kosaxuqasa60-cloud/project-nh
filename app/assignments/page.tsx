"use client"

import { BookOpen, FileText, Plus } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export default function AssignmentsPage() {
  const { assignments, textbooks } = useStore()

  return (
    <div>
      <PageHeader
        title="作业管理"
        description="作业由题目组合而成，并可同时关联多个教材。同一套作业能复用于不同版本教材。"
        actions={
          <Button>
            <Plus className="size-4" /> 新建作业
          </Button>
        }
      />

      <div className="space-y-3">
        {assignments.map((a) => (
          <Card key={a.id} className="p-4">
            <CardContent className="flex flex-col gap-3 p-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileText className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    <Badge
                      variant="outline"
                      className={
                        a.status === "published"
                          ? "border-transparent bg-chart-3/15 font-normal text-chart-3"
                          : "border-transparent bg-chart-4/15 font-normal text-chart-4"
                      }
                    >
                      {a.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{a.subject}</span>
                    <span>{a.questionIds.length} 道题</span>
                    <span>更新于 {a.updatedAt}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {a.textbookIds.map((id) => {
                      const tb = textbooks.find((t) => t.id === id)
                      return (
                        <Badge
                          key={id}
                          variant="outline"
                          className="gap-1 border-primary/20 bg-primary/5 font-normal text-primary"
                        >
                          <BookOpen className="size-3" />
                          {tb?.version} {tb?.subject}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm">编辑</Button>
                <Button variant="ghost" size="sm">预览</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
