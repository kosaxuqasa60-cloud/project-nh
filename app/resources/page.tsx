"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  FileStack,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Radio,
  Search,
  Video,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog"
import { ResourceCompactRow } from "@/components/admin/resource-card"
import { QuestionCard, MediaCard } from "@/components/admin/rich-resource-card"
import { buildRow, type AdminResourceRow } from "@/components/admin/resource-shared"
import { BatchLevelDialog } from "@/components/admin/batch-level-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import {
  QUESTION_TYPE_LABELS,
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  SYNC_RESOURCE_LABELS,
  SYNC_RESOURCE_TYPES,
  type AirClass,
  type Assignment,
  type Microlesson,
  type Question,
  type QuestionType,
  type ResourceLevel,
  type SyncResourceType,
} from "@/lib/types"

type AnyResource = Question | Assignment | Microlesson | AirClass

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

// 题型筛选项（仅题目 tab 显示）
const QUESTION_TYPES: QuestionType[] = ["single", "multiple", "fill", "judge", "subjective"]

export default function ResourceCenterPage() {
  const {
    questions,
    assignments,
    microlessons,
    airClasses,
    knowledgePoints,
    resourcesByKind,
    mountCountByResource,
    removeResource,
    batchRemoveResources,
  } = useStore()

  const kpLabel = useMemo(() => {
    const map = new Map(knowledgePoints.map((k) => [k.id, k.name]))
    return (id: string) => map.get(id) ?? id
  }, [knowledgePoints])

  const [kind, setKind] = useState<SyncResourceType>("question")
  const [levelFilter, setLevelFilter] = useState<ResourceLevel | "all">("all")
  const [questionType, setQuestionType] = useState<QuestionType | "all">("all")
  const [mountStatus, setMountStatus] = useState<"all" | "mounted" | "unmounted">("all")
  const [keyword, setKeyword] = useState("")
  const [view, setView] = useState<"card" | "compact">("card")
  const [moreOpen, setMoreOpen] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AnyResource | null>(null)
  const [batchLevelOpen, setBatchLevelOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; mounts: number } | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const rawList: AnyResource[] = useMemo(() => {
    if (kind === "question") return questions
    if (kind === "assignment") return assignments
    if (kind === "microlesson") return microlessons
    return airClasses
  }, [kind, questions, assignments, microlessons, airClasses])

  const countByKind = useMemo(() => {
    const m = {} as Record<SyncResourceType, number>
    for (const k of SYNC_RESOURCE_TYPES) m[k] = resourcesByKind(k).length
    return m
  }, [resourcesByKind])

  // 各级别数量（左侧授权范围分面）
  const countByLevel = useMemo(() => {
    const m: Record<string, number> = { all: 0 }
    for (const l of RESOURCE_LEVELS) m[l] = 0
    for (const r of resourcesByKind(kind)) {
      m.all += 1
      m[r.level] += 1
    }
    return m
  }, [resourcesByKind, kind])

  const rows: AdminResourceRow[] = useMemo(() => {
    return rawList
      .filter((r) => {
        if (levelFilter !== "all" && r.level !== levelFilter) return false
        if (kind === "question" && questionType !== "all" && (r as Question).type !== questionType)
          return false
        const mounts = r.chapterMounts.length
        if (mountStatus === "mounted" && mounts === 0) return false
        if (mountStatus === "unmounted" && mounts > 0) return false
        const title = kind === "question" ? (r as Question).stem : (r as { title: string }).title
        if (keyword && !title.includes(keyword)) return false
        return true
      })
      .map((r) => buildRow(kind, r, kpLabel, mountCountByResource(kind, r.id)))
  }, [rawList, kind, levelFilter, questionType, mountStatus, keyword, kpLabel, mountCountByResource])

  // 与 rows 同口径的原始对象列表，供富卡片读取完整字段
  const filteredRaw: AnyResource[] = useMemo(() => {
    return rawList.filter((r) => {
      if (levelFilter !== "all" && r.level !== levelFilter) return false
      if (kind === "question" && questionType !== "all" && (r as Question).type !== questionType)
        return false
      const mounts = r.chapterMounts.length
      if (mountStatus === "mounted" && mounts === 0) return false
      if (mountStatus === "unmounted" && mounts > 0) return false
      const title = kind === "question" ? (r as Question).stem : (r as { title: string }).title
      if (keyword && !title.includes(keyword)) return false
      return true
    })
  }, [rawList, kind, levelFilter, questionType, mountStatus, keyword])

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someSelected = selected.size > 0

  function switchKind(k: SyncResourceType) {
    setKind(k)
    setLevelFilter("all")
    setQuestionType("all")
    setMountStatus("all")
    setKeyword("")
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    setSelected((prev) =>
      allSelected ? new Set() : new Set(rows.map((r) => r.id)),
    )
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(id: string) {
    setEditing(rawList.find((r) => r.id === id) ?? null)
    setFormOpen(true)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    removeResource(kind, deleteTarget.id)
    toast.success(`已删除${SYNC_RESOURCE_LABELS[kind]}`, {
      description: deleteTarget.mounts > 0 ? `并解除了 ${deleteTarget.mounts} 处章节挂载` : undefined,
    })
    setDeleteTarget(null)
  }
  function confirmBatchDelete() {
    const ids = [...selected]
    batchRemoveResources(kind, ids)
    toast.success(`已删除 ${ids.length} 个${SYNC_RESOURCE_LABELS[kind]}`)
    setSelected(new Set())
    setBatchDeleteOpen(false)
  }

  const hasFilter =
    levelFilter !== "all" || questionType !== "all" || mountStatus !== "all" || keyword !== ""

  const selectedRows = rows.filter((r) => selected.has(r.id))

  return (
    <div>
      <PageHeader
        title="资源中心"
        description="统一创建与管理题目、作业、微课、空中课堂。在教师端资源库基础上，叠加级别（授权范围）、类型细分与批量管理能力。"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> 新建{SYNC_RESOURCE_LABELS[kind]}
          </Button>
        }
      />

      {/* 类型 tab */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {SYNC_RESOURCE_TYPES.map((k) => {
          const Icon = KIND_ICON[k]
          const active = kind === k
          return (
            <button
              key={k}
              onClick={() => switchKind(k)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {SYNC_RESOURCE_LABELS[k]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {countByKind[k]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-5">
        {/* 左侧：授权范围（级别）分面导航 */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="rounded-lg border border-border bg-card p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">授权范围 / 级别</p>
            <FacetItem
              label="全部级别"
              count={countByLevel.all}
              active={levelFilter === "all"}
              onClick={() => setLevelFilter("all")}
            />
            {RESOURCE_LEVELS.map((l) => (
              <FacetItem
                key={l}
                label={RESOURCE_LEVEL_LABELS[l]}
                count={countByLevel[l]}
                active={levelFilter === l}
                onClick={() => setLevelFilter(l)}
                dotClass={LEVEL_DOT[l]}
              />
            ))}
          </div>
          <p className="mt-3 px-2 text-xs leading-relaxed text-muted-foreground">
            市级资源在所属市内全部学校可见，区级在区内可见，校级仅本校，精品资源全员可见。
          </p>
        </aside>

        {/* 右侧：筛选 + 列表 */}
        <div className="min-w-0 flex-1">
          {/* 筛选条 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={kind === "question" ? "搜索题干 / 知识点" : "搜索标题"}
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button
              variant={mountStatus === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setMountStatus("all")}
            >
              全部
            </Button>
            <Button
              variant={mountStatus === "mounted" ? "secondary" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setMountStatus("mounted")}
            >
              已挂载
            </Button>
            <Button
              variant={mountStatus === "unmounted" ? "secondary" : "ghost"}
              size="sm"
              className="h-9"
              onClick={() => setMountStatus("unmounted")}
            >
              未挂载
            </Button>
            {kind === "question" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => setMoreOpen((v) => !v)}
              >
                更多筛选
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">共 {rows.length} 条</span>
              <div className="flex rounded-md border border-border p-0.5">
                <button
                  onClick={() => setView("card")}
                  className={cn(
                    "rounded p-1.5",
                    view === "card" ? "bg-secondary text-foreground" : "text-muted-foreground",
                  )}
                  aria-label="详情视图"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setView("compact")}
                  className={cn(
                    "rounded p-1.5",
                    view === "compact" ? "bg-secondary text-foreground" : "text-muted-foreground",
                  )}
                  aria-label="精简视图"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 题型二级筛选（仅题目，展开） */}
          {kind === "question" && moreOpen && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 p-2">
              <span className="px-1 text-xs text-muted-foreground">题型</span>
              <FilterChip
                label="全部"
                active={questionType === "all"}
                onClick={() => setQuestionType("all")}
              />
              {QUESTION_TYPES.map((t) => (
                <FilterChip
                  key={t}
                  label={QUESTION_TYPE_LABELS[t]}
                  active={questionType === t}
                  onClick={() => setQuestionType(t)}
                />
              ))}
            </div>
          )}

          {/* 批量操作工具条 / 全选 */}
          <div className="mb-3 flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
            <span className="text-sm text-muted-foreground">
              {someSelected ? `已选 ${selected.size} 项` : "全选"}
            </span>
            {someSelected && (
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setBatchLevelOpen(true)}>
                  批量改级别
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setBatchDeleteOpen(true)}
                >
                  批量删除
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  <X className="size-4" /> 清除
                </Button>
              </div>
            )}
          </div>

          {/* 列表 */}
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              {hasFilter
                ? "没有符合筛选条件的资源。"
                : `还没有${SYNC_RESOURCE_LABELS[kind]}，点右上角「新建」开始创建。`}
            </div>
          ) : view === "card" ? (
            <div className="space-y-3">
              {filteredRaw.map((r, i) =>
                kind === "question" ? (
                  <QuestionCard
                    key={r.id}
                    q={r as Question}
                    index={i + 1}
                    selected={selected.has(r.id)}
                    onToggleSelect={() => toggleSelect(r.id)}
                    onEdit={() => openEdit(r.id)}
                  />
                ) : (
                  <MediaCard
                    key={r.id}
                    kind={kind as "assignment" | "microlesson" | "airclass"}
                    data={r as Assignment | Microlesson | AirClass}
                    index={i + 1}
                    selected={selected.has(r.id)}
                    onToggleSelect={() => toggleSelect(r.id)}
                    onEdit={() => openEdit(r.id)}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {rows.map((r) => (
                <ResourceCompactRow
                  key={r.id}
                  row={r}
                  selected={selected.has(r.id)}
                  onToggleSelect={() => toggleSelect(r.id)}
                  onEdit={() => openEdit(r.id)}
                  onDelete={() => setDeleteTarget({ id: r.id, title: r.title, mounts: r.mounts })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <ResourceFormDialog kind={kind} open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      )}

      <BatchLevelDialog
        kind={kind}
        ids={[...selected]}
        open={batchLevelOpen}
        onOpenChange={setBatchLevelOpen}
        onDone={() => setSelected(new Set())}
      />

      {/* 单个删除确认 */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除{SYNC_RESOURCE_LABELS[kind]}</DialogTitle>
            <DialogDescription>
              确认删除「{deleteTarget?.title}」？
              {deleteTarget && deleteTarget.mounts > 0
                ? ` 该资源当前挂载在 ${deleteTarget.mounts} 处章节，删除后会一并解除。`
                : " 此操作不可撤销。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认 */}
      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量删除</DialogTitle>
            <DialogDescription>
              确认删除选中的 {selected.size} 个{SYNC_RESOURCE_LABELS[kind]}？其挂载关系会一并解除，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmBatchDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const LEVEL_DOT: Record<ResourceLevel, string> = {
  city: "bg-chart-4",
  district: "bg-chart-2",
  school: "bg-chart-1",
  premium: "bg-chart-3",
}

function FacetItem({
  label,
  count,
  active,
  onClick,
  dotClass,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  dotClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {dotClass ? (
        <span className={cn("size-2 rounded-full", dotClass)} />
      ) : (
        <span className="size-2" />
      )}
      <span className="flex-1 text-left">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  )
}
