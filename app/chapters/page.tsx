"use client"

import Link from "next/link"
import { ChevronRight, ListTree } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { STAGE_LABELS, VOLUME_LABELS } from "@/lib/types"

export default function ChaptersPage() {
  const { textbooks, chapters } = useStore()

  return (
    <div>
      <PageHeader
        title="章节目录"
        description="选择一套教材进入目录编辑。题目与作业最终都挂载在这里的章节节点上。"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {textbooks.map((t) => {
          const count = chapters.filter((c) => c.textbookId === t.id).length
          return (
            <Link key={t.id} href={`/textbooks/${t.id}`}>
              <Card className="group h-full transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <ListTree className="size-5" />
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div>
                    <p className="line-clamp-2 text-balance font-medium leading-snug">
                      {t.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.version} · {STAGE_LABELS[t.stage]} {t.grade} · {VOLUME_LABELS[t.volume]} · {t.year}年
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
                    <span>{count} 个章节节点</span>
                    <span className="inline-flex items-center text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      编辑目录 <ChevronRight className="size-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
