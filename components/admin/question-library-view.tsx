"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog"
import { ResourceCompactRow } from "@/components/admin/resource-card"
import { QuestionCard } from "@/components/admin/rich-resource-card"
import { buildRow } from "@/components/admin/resource-shared"
import { BatchLevelDialog } from "@/components/admin/batch-level-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import {
  QUESTION_TYPE_LABELS,
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  type ChapterNode,
  type Question,
  type QuestionType,
  type ResourceLevel,
} from "@/lib/types"

const QUESTION_TYPES: QuestionType[] = ["single", "multiple", "fill", "judge", "subjective"]

const LEVEL_DOT: Record<ResourceLevel, string> = {
  city: "bg-chart-4",
  district: "bg-chart-2",
  school: "bg-chart-1",
}

// 特殊选中项
type ChapterSel = string | "all" | "unmounted"

export function QuestionLibraryView() {
  const {
    questions,
    chapters,
    textbooks,
    knowledgePoints,
    mountCountByResource,
    removeResource,
    batchRemoveResources,
  } = useStore()

  const kpLabel = useMemo(() => {
    const map = new Map(knowledgePoints.map((k) => [k.id, k.name]))
    return (id: string) => map.get(id) ?? id
  }, [knowledgePoints])

  // 默认选中第一本教材
  const [textbookId, setTextbookId] = useState(textbooks[0]?.id ?? "")
  const [chapterSel, setChapterSel] = useState<ChapterSel>("all")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [levelFilter, setLevelFilter] = useState<ResourceLevel | "all">("all")
  const [questionType, setQuestionType] = useState<QuestionType | "all">("all")
  const [keyword, setKeyword] = useState("")
  const [view, setView] = useState<"card" | "compact">("card")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [batchLevelOpen, setBatchLevelOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; mounts: number } | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  // 当前教材章节树
  const tbChapters = useMemo(
    () => chapters.filter((c) => c.textbookId === textbookId),
    [chapters, textbookId],
  )
  const roots = tbChapters.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order)
  const childrenOf = (id: string) =>
    tbChapters.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order)

  // 章节（含所有后代）的题目 id 集合：通过 chapterMounts 命中
  const descendantIds = useMemo(() => {
    const map = new Map<string, string[]>()
    const collect = (id: string): string[] => {
      const kids = tbChapters.filter((c) => c.parentId === id)
      const all = [id, ...kids.flatMap((k) => collect(k.id))]
      map.set(id, all)
      return all
    }
    roots.forEach((r) => collect(r.id))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tbChapters])

  function questionCountForChapter(chapterId: string) {
    const ids = new Set(descendantIds.get(chapterId) ?? [chapterId])
    return questions.filter((q) =>
      q.chapterMounts.some((m) => m.textbookId === textbookId && ids.has(m.chapterId)),
    ).length
  }

  const allTbMountedCount = questions.filter((q) =>
    q.chapterMounts.some((m) => m.textbookId === textbookId),
  ).length
  const unmountedCount = questions.filter((q) => q.chapterMounts.length === 0).length

  function inSelectedChapter(q: Question) {
    if (chapterSel === "all") return true
    if (chapterSel === "unmounted") return q.chapterMounts.length === 0
    const ids = new Set(descendantIds.get(chapterSel) ?? [chapterSel])
    return q.chapterMounts.some((m) => m.textbookId === textbookId && ids.has(m.chapterId))
  }

  const filteredRaw = useMemo(() => {
    return questions.filter((q) => {
      if (!inSelectedChapter(q)) return false
      if (levelFilter !== "all" && q.level !== levelFilter) return false
      if (questionType !== "all" && q.type !== questionType) return false
      if (keyword && !q.stem.includes(keyword)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, chapterSel, textbookId, levelFilter, questionType, keyword, descendantIds])

  const rows = useMemo(
    () => filteredRaw.map((q) => buildRow("question", q, kpLabel, mountCountByResource("question", q.id))),
    [filteredRaw, kpLabel, mountCountByResource],
  )

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someSelected = selected.size > 0

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    setSelected(() => (allSelected ? new Set() : new Set(rows.map((r) => r.id))))
  }
  function openEdit(id: string) {
    setEditing(questions.find((q) => q.id === id) ?? null)
    setFormOpen(true)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    removeResource("question", deleteTarget.id)
    toast.success("已删除题目", {
      description: deleteTarget.mounts > 0 ? `并解除了 ${deleteTarget.mounts} 处章节挂载` : undefined,
    })
    setDeleteTarget(null)
  }
  function confirmBatchDelete() {
    const ids = [...selected]
    batchRemoveResources("question", ids)
    toast.success(`已删除 ${ids.length} 道题目`)
    setSelected(new Set())
    setBatchDeleteOpen(false)
  }

  const currentChapterTitle =
    chapterSel === "all"
      ? "全部题目"
      : chapterSel === "unmounted"
        ? "未归入章节"
        : tbChapters.find((c) => c.id === chapterSel)?.title ?? ""

  function renderNode(node: ChapterNode, depth: number) {
    const kids = childrenOf(node.id)
    const hasKids = kids.length > 0
    const isOpen = expanded[node.id] ?? depth === 0
    const active = chapterSel === node.id
    const count = questionCountForChapter(node.id)
    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1 pr-2 text-sm transition-colors",
            active ? "bg-secondary font-medium text-foreground" : "hover:bg-muted",
          )}
          style={{ paddingLeft: depth * 14 + 2 }}
        >
          <button
            onClick={() => hasKids && setExpanded((p) => ({ ...p, [node.id]: !isOpen }))}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground",
              !hasKids && "invisible",
            )}
            aria-label={isOpen ? "收起" : "展开"}
          >
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          <button
            onClick={() => setChapterSel(node.id)}
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              depth === 0 ? "text-foreground" : "text-muted-foreground",
              active && "text-foreground",
            )}
          >
            {node.title}
          </button>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
        </div>
        {hasKids && isOpen && <div>{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="题库"
        description="按教材章节目录浏览与管理题目。选择左侧章节查看其下题目，平台管理者可手动新增题目并指定市/区/校授权范围。"
        actions={
          <Link href="/resources/questions/new" className={cn(buttonVariants(), "gap-1")}>
            <Plus className="size-4" /> 新建题目
          </Link>
        }
      />

      <div className="flex gap-5">
        {/* 左侧：教材选择 + 章节树 */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Select
            value={textbookId}
            onValueChange={(v) => { setTextbookId(v); setChapterSel("all") }}
            items={Object.fromEntries(textbooks.map((t) => [t.id, t.name]))}
          >
            <SelectTrigger className="mb-3">
              <SelectValue placeholder="选择教材" />
            </SelectTrigger>
            <SelectContent>
              {textbooks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border border-border bg-card p-2">
            <FacetRow
              label="全部题目"
              count={allTbMountedCount}
              active={chapterSel === "all"}
              onClick={() => setChapterSel("all")}
            />
            <FacetRow
              label="未归入章节"
              count={unmountedCount}
              active={chapterSel === "unmounted"}
              onClick={() => setChapterSel("unmounted")}
            />
            <div className="my-1.5 border-t border-border" />
            {roots.length > 0 ? (
              roots.map((r) => renderNode(r, 0))
            ) : (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                该教材暂无章节目录。
              </p>
            )}
          </div>

          {/* 级别二级筛选 */}
          <div className="mt-3 rounded-lg border border-border bg-card p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">授权范围 / 级别</p>
            <FacetRow label="全部级别" active={levelFilter === "all"} onClick={() => setLevelFilter("all")} />
            {RESOURCE_LEVELS.map((l) => (
              <FacetRow
                key={l}
                label={RESOURCE_LEVEL_LABELS[l]}
                active={levelFilter === l}
                onClick={() => setLevelFilter(l)}
                dotClass={LEVEL_DOT[l]}
              />
            ))}
          </div>
        </aside>

        {/* 右侧：题目列表 */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">{currentChapterTitle}</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索题干"
                className="h-9 w-56 pl-8"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">共 {rows.length} 道</span>
              <div className="flex rounded-md border border-border p-0.5">
                <button
                  onClick={() => setView("card")}
                  className={cn("rounded p-1.5", view === "card" ? "bg-secondary text-foreground" : "text-muted-foreground")}
                  aria-label="详情视图"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setView("compact")}
                  className={cn("rounded p-1.5", view === "compact" ? "bg-secondary text-foreground" : "text-muted-foreground")}
                  aria-label="精简视图"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 题型筛选 */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 p-2">
            <span className="px-1 text-xs text-muted-foreground">题型</span>
            <FilterChip label="全部" active={questionType === "all"} onClick={() => setQuestionType("all")} />
            {QUESTION_TYPES.map((t) => (
              <FilterChip
                key={t}
                label={QUESTION_TYPE_LABELS[t]}
                active={questionType === t}
                onClick={() => setQuestionType(t)}
              />
            ))}
          </div>

          {/* 批量操作 */}
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

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              该章节下暂无符合条件的题目。
            </div>
          ) : view === "card" ? (
            <div className="space-y-3">
              {filteredRaw.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i + 1}
                  selected={selected.has(q.id)}
                  onToggleSelect={() => toggleSelect(q.id)}
                  onEdit={() => openEdit(q.id)}
                />
              ))}
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
        <ResourceFormDialog kind="question" open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      )}

      <BatchLevelDialog
        kind="question"
        ids={[...selected]}
        open={batchLevelOpen}
        onOpenChange={setBatchLevelOpen}
        onDone={() => setSelected(new Set())}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除题目</DialogTitle>
            <DialogDescription>
              确认删除「{deleteTarget?.title}」？
              {deleteTarget && deleteTarget.mounts > 0
                ? ` 该题目当前挂载在 ${deleteTarget.mounts} 处章节，删除后会一并解除。`
                : " 此操作不可撤销。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量删除</DialogTitle>
            <DialogDescription>
              确认删除选中的 {selected.size} 道题目？其挂载关系会一并解除，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmBatchDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FacetRow({
  label,
  count,
  active,
  onClick,
  dotClass,
}: {
  label: string
  count?: number
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
      {dotClass ? <span className={cn("size-2 rounded-full", dotClass)} /> : null}
      <span className="flex-1 text-left">{label}</span>
      {count != null && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}
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
