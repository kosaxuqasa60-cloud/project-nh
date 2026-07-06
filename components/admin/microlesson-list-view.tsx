"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Clapperboard, Eye, FileText, Pencil, Plus, Search, Trash2, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MICROLESSON_CATEGORY_LABELS,
  MICROLESSON_STATUS_LABELS,
  RESOURCE_LEVEL_LABELS,
  type Microlesson,
} from "@/lib/types"
import { GRADES, SUBJECTS } from "@/lib/mock-data"

const LEVEL_BADGE: Record<string, string> = {
  city: "bg-brand-soft text-brand-soft-foreground",
  district: "bg-accent text-accent-foreground",
  school: "bg-muted text-muted-foreground",
}

const ALL = "__all__"

export function MicrolessonListView() {
  const { microlessons, chapters, removeResource, mountCountByResource } = useStore()
  const [q, setQ] = useState("")
  const [subject, setSubject] = useState<string>(ALL)
  const [grade, setGrade] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)
  const [deleteTarget, setDeleteTarget] = useState<Microlesson | null>(null)

  const list = useMemo(() => {
    return microlessons.filter((m) => {
      if (subject !== ALL && m.subject !== subject) return false
      if (grade !== ALL && m.grade !== grade) return false
      if (status !== ALL && (m.status ?? "published") !== status) return false
      if (q && !m.title.includes(q) && !(m.creatorName ?? "").includes(q)) return false
      return true
    })
  }, [microlessons, subject, grade, status, q])

  const chapterTitle = (textbookId: string, chapterId: string) =>
    chapters.find((c) => c.id === chapterId)?.title ?? "未知章节"

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Clapperboard className="size-5 text-brand" /> 微课
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            微课以列表形式管理，每节微课对应年级与教材章节，支持视频链接、封面、附件与创作者信息。
          </p>
        </div>
        <Link href="/resources/microlessons/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" /> 新建微课
        </Link>
      </div>

      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题或创作者"
            className="w-56 pl-8"
          />
        </div>
        <FilterSelect value={subject} onChange={setSubject} placeholder="全部学科" options={SUBJECTS} />
        <FilterSelect value={grade} onChange={setGrade} placeholder="全部年级" options={GRADES} />
        <FilterSelect
          value={status}
          onChange={setStatus}
          placeholder="全部状态"
          options={Object.entries(MICROLESSON_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
        />
        <span className="text-sm text-muted-foreground">共 {list.length} 节</span>
      </div>

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* 表头 */}
        <div className="hidden items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground md:flex">
          <span className="w-[40%]">微课</span>
          <span className="w-[12%]">年级 / 学科</span>
          <span className="w-[14%]">创作者</span>
          <span className="w-[10%]">时长</span>
          <span className="w-[10%]">状态</span>
          <span className="w-[14%] text-right">操作</span>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Clapperboard className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">暂无微课，点击右上角「新建微课」开始创建</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((m) => {
              const mounts = mountCountByResource("microlesson", m.id)
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 px-4 py-3 transition hover:bg-muted/30 md:flex-row md:items-center md:gap-4"
                >
                  {/* 微课主体：封面 + 标题信息 */}
                  <div className="flex min-w-0 items-center gap-3 md:w-[40%]">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {m.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.coverImage || "/placeholder.svg"} alt={m.title} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Clapperboard className="size-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{m.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-medium",
                            LEVEL_BADGE[m.level] ?? LEVEL_BADGE.school,
                          )}
                        >
                          {RESOURCE_LEVEL_LABELS[m.level]} · {m.ownerScope ?? "平台"}
                        </span>
                        {m.category && <span>{MICROLESSON_CATEGORY_LABELS[m.category]}</span>}
                        {mounts > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <FileText className="size-3" /> {chapterTitle("", m.chapterMounts[0]?.chapterId)}
                            {mounts > 1 && ` 等${mounts}处`}
                          </span>
                        )}
                        {m.attachments && m.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <Paperclip className="size-3" /> {m.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 年级 / 学科 */}
                  <div className="text-sm text-muted-foreground md:w-[12%]">
                    <span className="text-foreground">{m.grade}</span> · {m.subject}
                  </div>

                  {/* 创作者 */}
                  <div className="min-w-0 text-sm md:w-[14%]">
                    <p className="truncate text-foreground">{m.creatorName ?? "—"}</p>
                    {m.creatorOrg && <p className="truncate text-xs text-muted-foreground">{m.creatorOrg}</p>}
                  </div>

                  {/* 时长 + 观看 */}
                  <div className="text-sm text-muted-foreground md:w-[10%]">
                    <p className="text-foreground">{m.duration}</p>
                    {typeof m.viewCount === "number" && (
                      <p className="inline-flex items-center gap-0.5 text-xs">
                        <Eye className="size-3" /> {m.viewCount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* 状态 */}
                  <div className="md:w-[10%]">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        (m.status ?? "published") === "published"
                          ? "bg-brand-soft text-brand-soft-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {MICROLESSON_STATUS_LABELS[m.status ?? "published"]}
                    </span>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center justify-end gap-1.5 md:w-[14%]">
                    <Link
                      href={`/resources/microlessons/${m.id}`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
                    >
                      <Pencil className="size-3.5" /> 编辑
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="删除微课"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 删除确认 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除微课</DialogTitle>
            <DialogDescription>
              确定删除「{deleteTarget?.title}」吗？删除后将一并解除其所有章节挂载，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  removeResource("microlesson", deleteTarget.id)
                  toast.success("微课已删除", { description: deleteTarget.title })
                  setDeleteTarget(null)
                }
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: (string | { value: string; label: string })[]
}) {
  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? ALL)}
      items={{ [ALL]: placeholder, ...Object.fromEntries(norm.map((o) => [o.value, o.label])) }}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {norm.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
