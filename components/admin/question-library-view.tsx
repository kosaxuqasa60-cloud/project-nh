"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog"
import { ResourceCompactRow } from "@/components/admin/resource-card"
 import { QuestionCard } from "@/components/admin/rich-resource-card"
import { QuestionVersionSheet } from "@/components/admin/question-version-sheet"
import { AiImportDialog } from "@/components/admin/ai-import-dialog"
import { buildRow } from "@/components/admin/resource-shared"
import { BatchLevelDialog } from "@/components/admin/batch-level-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
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
  difficultyTier,
  QUESTION_TYPE_LABELS,
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  type ChapterNode,
  type Difficulty,
  type Question,
  type QuestionType,
  type ResourceLevel,
  type Textbook,
} from "@/lib/types"

const QUESTION_TYPES: QuestionType[] = ["single", "multiple", "fill", "judge", "subjective"]
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5]

const LEVEL_DOT: Record<ResourceLevel, string> = {
  city: "bg-chart-4",
  district: "bg-chart-2",
  school: "bg-chart-1",
}

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

  const [textbookId, setTextbookId] = useState(textbooks[0]?.id ?? "")
  const [chapterSel, setChapterSel] = useState<ChapterSel>("all")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [switchOpen, setSwitchOpen] = useState(false)

  const [levelFilter, setLevelFilter] = useState<ResourceLevel | "all">("all")
  const [questionType, setQuestionType] = useState<QuestionType | "all">("all")
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all")
  const [keyword, setKeyword] = useState("")
  const [moreOpen, setMoreOpen] = useState(false)
  const [view, setView] = useState<"card" | "compact">("card")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [historyQ, setHistoryQ] = useState<Question | null>(null)
  const [batchLevelOpen, setBatchLevelOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; mounts: number } | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const textbook = textbooks.find((t) => t.id === textbookId)

  const tbChapters = useMemo(
    () => chapters.filter((c) => c.textbookId === textbookId),
    [chapters, textbookId],
  )
  const roots = tbChapters.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order)
  const childrenOf = (id: string) =>
    tbChapters.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order)

  const leafChapters = useMemo(
    () =>
      tbChapters
        .filter((c) => !tbChapters.some((x) => x.parentId === c.id))
        .map((c) => ({ id: c.id, title: c.title })),
    [tbChapters],
  )

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
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false
      if (keyword && !q.stem.includes(keyword)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, chapterSel, textbookId, levelFilter, questionType, difficultyFilter, keyword, descendantIds])

  const rows = useMemo(
    () => filteredRaw.map((q) => buildRow("question", q, kpLabel, mountCountByResource("question", q.id))),
    [filteredRaw, kpLabel, mountCountByResource],
  )

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someSelected = selected.size > 0
  const activeFilterCount =
    (levelFilter !== "all" ? 1 : 0) +
    (questionType !== "all" ? 1 : 0) +
    (difficultyFilter !== "all" ? 1 : 0) +
    (keyword ? 1 : 0)

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
  function resetFilters() {
    setLevelFilter("all")
    setQuestionType("all")
    setDifficultyFilter("all")
    setKeyword("")
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
            "group flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm transition-colors",
            active ? "bg-brand-soft font-medium text-brand-soft-foreground" : "hover:bg-muted",
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
              active && "text-brand-soft-foreground",
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
    <div className="flex gap-5">
      {/* 左侧：教材封面切换卡 + 章节树 */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <button
          onClick={() => setSwitchOpen(true)}
          className="group mb-3 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition hover:border-brand/50 hover:shadow-sm"
        >
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={textbook?.cover || "/placeholder.svg"}
              alt={`${textbook?.name ?? "教材"} 封面`}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{textbook?.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {textbook?.version} · {textbook?.year}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-brand">
              切换教材
              <ChevronsUpDown className="size-3" />
            </span>
          </div>
        </button>

        <div className="rounded-xl border border-border bg-card p-2">
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
          <nav className="max-h-[calc(100vh-18rem)] overflow-y-auto">
            {roots.length > 0 ? (
              roots.map((r) => renderNode(r, 0))
            ) : (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                该教材暂无章节目录。
              </p>
            )}
          </nav>
        </div>
      </aside>

      {/* 右侧：筛选 + 题目列表 */}
      <div className="min-w-0 flex-1">
        {/* 标题行 + 主操作 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{currentChapterTitle}</h1>
            <p className="text-xs text-muted-foreground">共 {rows.length} 道题目</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setAiOpen(true)}>
              <Sparkles className="size-4" /> AI 导入
            </Button>
            <Link
              href={`/resources/questions/new?textbook=${textbookId}${chapterSel !== "all" && chapterSel !== "unmounted" ? `&chapter=${chapterSel}` : ""}`}
              className={cn(buttonVariants(), "gap-1")}
            >
              <Plus className="size-4" /> 新建题目
            </Link>
          </div>
        </div>

        {/* 筛选区：级别 + 题型 常驻，更多条件可展开 */}
        <div className="mb-4 rounded-xl border border-border bg-card p-3">
          <FilterLine label="授权范围 / 级别">
            <FilterChip label="全部" active={levelFilter === "all"} onClick={() => setLevelFilter("all")} />
            {RESOURCE_LEVELS.map((l) => (
              <FilterChip
                key={l}
                label={RESOURCE_LEVEL_LABELS[l]}
                active={levelFilter === l}
                onClick={() => setLevelFilter(l)}
                dotClass={LEVEL_DOT[l]}
              />
            ))}
          </FilterLine>

          <div className="mt-2.5 border-t border-border pt-2.5">
            <FilterLine label="题型">
              <FilterChip label="全部" active={questionType === "all"} onClick={() => setQuestionType("all")} />
              {QUESTION_TYPES.map((t) => (
                <FilterChip
                  key={t}
                  label={QUESTION_TYPE_LABELS[t]}
                  active={questionType === t}
                  onClick={() => setQuestionType(t)}
                />
              ))}
            </FilterLine>
          </div>

          {moreOpen && (
            <div className="mt-2.5 space-y-2.5 border-t border-border pt-2.5">
              <FilterLine label="难度">
                <FilterChip label="全部" active={difficultyFilter === "all"} onClick={() => setDifficultyFilter("all")} />
                {DIFFICULTIES.map((d) => (
                  <FilterChip
                    key={d}
                    label={`${d}星·${difficultyTier(d)}`}
                    active={difficultyFilter === d}
                    onClick={() => setDifficultyFilter(d)}
                  />
                ))}
              </FilterLine>
              <FilterLine label="关键词">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索题干内容"
                    className="h-8 w-64 pl-8"
                  />
                </div>
              </FilterLine>
            </div>
          )}

          {/* 工具行 */}
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <SlidersHorizontal className="size-3.5" />
              {moreOpen ? "收起筛选条件" : "更多筛选条件"}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" /> 清除筛选（{activeFilterCount}）
              </button>
            )}
            <div className="ml-auto flex rounded-md border border-border p-0.5">
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
                onHistory={() => setHistoryQ(q)}
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

      {/* 教材切换弹窗 */}
      <TextbookSwitchDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        textbooks={textbooks}
        currentId={textbookId}
        onSelect={(id) => {
          setTextbookId(id)
          setChapterSel("all")
          setExpanded({})
          setSwitchOpen(false)
        }}
      />

      {/* AI 导入 */}
      <AiImportDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        defaultSubject={textbook?.subject ?? "数学"}
        textbookId={textbookId}
        textbookName={textbook?.name}
        chapterOptions={leafChapters}
      />

      {formOpen && (
        <ResourceFormDialog kind="question" open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      )}

      <QuestionVersionSheet
        q={historyQ}
        open={Boolean(historyQ)}
        onOpenChange={(v) => !v && setHistoryQ(null)}
      />

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

function TextbookSwitchDialog({
  open,
  onOpenChange,
  textbooks,
  currentId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  textbooks: Textbook[]
  currentId: string
  onSelect: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>切换教材</DialogTitle>
          <DialogDescription>选择要浏览题库的教材版本。</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-2 overflow-y-auto">
          {textbooks.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-left transition",
                t.id === currentId
                  ? "border-brand bg-brand-soft"
                  : "border-border hover:border-brand/40 hover:bg-muted",
              )}
            >
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.cover || "/placeholder.svg"} alt="" className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.subject} · {t.version} · {t.grade}
                </p>
              </div>
              {t.id === currentId && (
                <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-brand-foreground">
                  当前
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FacetRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-brand-soft font-medium text-brand-soft-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      <span className="flex-1 text-left">{label}</span>
      {count != null && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}
    </button>
  )
}

function FilterLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 w-24 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string
  active: boolean
  onClick: () => void
  dotClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {dotClass ? <span className={cn("size-2 rounded-full", dotClass, active && "ring-1 ring-primary-foreground/50")} /> : null}
      {label}
    </button>
  )
}
