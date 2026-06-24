"use client"

import { Eye, Layers, Pencil, PlayCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { LevelChip } from "@/components/admin/level-badge"
import {
  DIFFICULTY_LABEL,
  RESOURCE_LEVEL_LABELS,
  type AdminResourceRow,
} from "@/components/admin/resource-shared"
import { QUESTION_TYPE_LABELS } from "@/lib/types"

// 难度色：易=绿、中=黄、难=红
const DIFF_CLASS: Record<string, string> = {
  易: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  中: "border-chart-4/40 bg-chart-4/15 text-chart-4",
  难: "border-chart-5/30 bg-chart-5/10 text-chart-5",
}

export function ResourceCard({
  row,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  row: AdminResourceRow
  selected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const diff = row.difficulty ? DIFFICULTY_LABEL[row.difficulty] : undefined

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-4 transition-colors",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-1" />

        <div className="min-w-0 flex-1">
          {/* 头部：级别角标 + 类型/难度/视频 标记 */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <LevelChip level={row.level} />
            {row.kind === "question" && row.questionType && (
              <Badge variant="secondary" className="font-normal">
                {QUESTION_TYPE_LABELS[row.questionType]}
              </Badge>
            )}
            {diff && (
              <Badge variant="outline" className={cn("font-normal", DIFF_CLASS[diff])}>
                {diff}
              </Badge>
            )}
            {row.hasVideo && (
              <span className="inline-flex items-center gap-1 text-xs text-chart-3">
                <PlayCircle className="size-3.5" /> 视频讲解
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {RESOURCE_LEVEL_LABELS[row.level]}
              {row.ownerScope ? ` · ${row.ownerScope}` : ""}
            </span>
          </div>

          {/* 标题 / 题干 */}
          <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">{row.title}</p>

          {/* 元信息行（按类型差异化） */}
          {row.metaLine && (
            <p className="mt-1.5 text-xs text-muted-foreground">{row.metaLine}</p>
          )}

          {/* 知识点 / 标签 + 操作 */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {row.knowledgePointLabels.map((kp) => (
              <Badge
                key={kp}
                variant="outline"
                className="border-primary/20 bg-primary/5 font-normal text-primary"
              >
                #{kp}
              </Badge>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  row.mounts > 0 ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Layers className="size-3.5" />
                {row.mounts > 0 ? `已挂载 ${row.mounts} 处` : "未挂载"}
              </span>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={onEdit}>
                <Pencil className="size-3.5" /> 编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" /> 删除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 精简视图行
export function ResourceCompactRow({
  row,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  row: AdminResourceRow
  selected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0",
        selected && "bg-primary/5",
      )}
    >
      <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      <LevelChip level={row.level} />
      <p className="line-clamp-1 flex-1 text-sm text-foreground/90">{row.title}</p>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {row.mounts > 0 ? `挂载 ${row.mounts}` : "未挂载"}
      </span>
      <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
        <Pencil className="size-3.5" />
        <span className="sr-only">编辑</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">删除</span>
      </Button>
    </div>
  )
}
