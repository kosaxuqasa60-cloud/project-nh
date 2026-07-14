"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Crown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react"
import { FileImportDialog, type FileImportResult } from "@/components/admin/file-import-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  premiumQuestionCount,
  premiumVideoCount,
  RESOURCE_LEVEL_LABELS,
  VOLUME_LABELS,
  type ChapterNode,
  type Premium,
  type PremiumQuestion,
  type Textbook,
  type Volume,
} from "@/lib/types"

const GRADE_GROUPS: { stage: string; grades: string[] }[] = [
  { stage: "小学", grades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"] },
  { stage: "初中", grades: ["七年级", "八年级", "九年级"] },
  { stage: "高中", grades: ["高一", "高二", "高三"] },
]
const VOLUMES: Volume[] = ["upper", "lower", "full"]

const LEVEL_BADGE: Record<string, string> = {
  city: "bg-brand-soft text-brand-soft-foreground",
  district: "bg-accent text-accent-foreground",
  school: "bg-muted text-muted-foreground",
}

type ChapterSel = string | "all" | "unmounted"

export function PremiumTopicsView() {
  const { premiums, textbooks, chapters, createPremium, removeResource } = useStore()

  const [textbookId, setTextbookId] = useState(textbooks[0]?.id ?? "")
  const [chapterSel, setChapterSel] = useState<ChapterSel>("all")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [switchOpen, setSwitchOpen] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

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

  function countForChapter(chapterId: string) {
    const ids = new Set(descendantIds.get(chapterId) ?? [chapterId])
    return premiums.filter((p) =>
      p.chapterMounts.some((m) => m.textbookId === textbookId && ids.has(m.chapterId)),
    ).length
  }

  const allTbCount = premiums.filter((p) =>
    p.chapterMounts.some((m) => m.textbookId === textbookId),
  ).length
  const unmountedCount = premiums.filter((p) => p.chapterMounts.length === 0).length

  function inSelectedChapter(p: Premium) {
    if (chapterSel === "all") return true
    if (chapterSel === "unmounted") return p.chapterMounts.length === 0
    const ids = new Set(descendantIds.get(chapterSel) ?? [chapterSel])
    return p.chapterMounts.some((m) => m.textbookId === textbookId && ids.has(m.chapterId))
  }

  const list = useMemo(() => {
    return premiums.filter((p) => {
      if (!inSelectedChapter(p)) return false
      if (keyword && !p.title.includes(keyword) && !(p.subject ?? "").includes(keyword)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premiums, chapterSel, textbookId, keyword, descendantIds])

  const currentChapterTitle =
    chapterSel === "all"
      ? "全部精品资源"
      : chapterSel === "unmounted"
        ? "未归入章节"
        : tbChapters.find((c) => c.id === chapterSel)?.title ?? ""

  function handleImport(result: FileImportResult) {
    const items: PremiumQuestion[] = result.questions.map((q, i) => ({
      id: `pmq-${Date.now()}-${i}`,
      qType: q.type,
      label: String(i + 1),
      stem: q.stem,
      options: q.options?.map((o, oi) => ({
        id: `pmo-${Date.now()}-${i}-${oi}`,
        text: o.content,
        correct: false,
      })),
      answer: q.answer || undefined,
      analysis: q.analysis || undefined,
    }))
    const mountedChapter =
      chapterSel !== "all" && chapterSel !== "unmounted" ? chapterSel : undefined
    createPremium({
      title: `导入题目包 · ${new Date().toLocaleDateString("zh-CN")}`,
      subject: textbook?.subject ?? "数学",
      items,
      knowledgePointIds: [],
      chapterMounts: mountedChapter ? [{ textbookId, chapterId: mountedChapter }] : [],
      level: result.level,
      ownerScope: result.ownerScope,
    })
    toast.success(`已导入并新建题目包（${items.length} 道题）`, {
      description: mountedChapter ? "已挂载到当前章节" : undefined,
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    removeResource("premium", deleteTarget.id)
    toast.success("已删除精品资源")
    setDeleteTarget(null)
  }

  function renderNode(node: ChapterNode, depth: number) {
    const kids = childrenOf(node.id)
    const hasKids = kids.length > 0
    const isOpen = expanded[node.id] ?? depth === 0
    const active = chapterSel === node.id
    const count = countForChapter(node.id)
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
            label="全部精品资源"
            count={allTbCount}
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

      {/* 右侧：标题 + 工具 + 列表 */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <Crown className="size-5 text-brand" />
          <p className="text-sm text-muted-foreground">
            精品资源即由各类题目组成的试卷 / 题目包，每道题可挂配套讲解视频。
          </p>
        </div>

        {/* 标题行 + 主操作 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{currentChapterTitle}</h1>
            <p className="text-xs text-muted-foreground">共 {list.length} 份精品资源</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题、学科"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="size-4" /> 导入
            </Button>
            <Link
              href={`/resources/premium/topics/new?textbook=${textbookId}${chapterSel !== "all" && chapterSel !== "unmounted" ? `&chapter=${chapterSel}` : ""}`}
              className={cn(buttonVariants(), "gap-1")}
            >
              <Plus className="size-4" /> 新建
            </Link>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            该章节下暂无精品资源，点击「导入」或「新建」开始创建。
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {list.map((p, i) => (
              <PremiumRow
                key={p.id}
                data={p}
                first={i === 0}
                onDelete={() => setDeleteTarget({ id: p.id, title: p.title })}
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

      {/* 文件导入（复用题库导入弹窗，导入结果新建题目包） */}
      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultSubject={textbook?.subject ?? "数学"}
        textbookId={textbookId}
        textbookName={textbook?.name}
        chapterOptions={leafChapters}
        onImport={handleImport}
        title="导入精品题目包"
        description="上传固定 Excel 模板，逐题确认后作为一份新的精品题目包导入。"
        importLabel="导入为题目包"
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除精品资源</DialogTitle>
            <DialogDescription>
              确认删除「{deleteTarget?.title}」？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PremiumRow({
  data,
  first,
  onDelete,
}: {
  data: Premium
  first: boolean
  onDelete: () => void
}) {
  const qCount = premiumQuestionCount(data)
  const vCount = premiumVideoCount(data)
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40",
        !first && "border-t border-border",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-soft-foreground">
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground" title={data.title}>
            {data.title}
          </p>
          <span
            className={cn(
              "hidden shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium sm:inline-block",
              LEVEL_BADGE[data.level],
            )}
          >
            {RESOURCE_LEVEL_LABELS[data.level]}
            {data.ownerScope ? ` · ${data.ownerScope}` : ""}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" /> {qCount} 题
          </span>
          <span className="inline-flex items-center gap-1">
            <Video className="size-3.5" /> {vCount} 视频
          </span>
          <span>{data.subject}</span>
          <span className="hidden sm:inline">更新于 {data.updatedAt}</span>
          <span className="hidden sm:inline">已用 {data.usedCount ?? 0}</span>
        </p>
      </div>
      <Link
        href={`/resources/premium/topics/${data.id}`}
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "shrink-0 gap-1")}
      >
        <Pencil className="size-3.5" /> 编辑
      </Link>
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="删除"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
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
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
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
  const current = textbooks.find((t) => t.id === currentId)
  const [grade, setGrade] = useState<string>(current?.grade ?? "")
  const [vol, setVol] = useState<Volume | "all">("all")

  useEffect(() => {
    if (open) setGrade(current?.grade ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = textbooks.filter(
    (t) => (!grade || t.grade === grade) && (vol === "all" || t.volume === vol),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>切换教材</DialogTitle>
          <DialogDescription>先选择年级与学期，再选择对应的教材版本。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {GRADE_GROUPS.map((g) => (
            <div key={g.stage} className="flex items-start gap-3">
              <span className="mt-1.5 w-10 shrink-0 text-xs font-medium text-muted-foreground">
                {g.stage}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {g.grades.map((gr) => (
                  <FilterChip
                    key={gr}
                    label={gr}
                    active={grade === gr}
                    onClick={() => setGrade((p) => (p === gr ? "" : gr))}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 border-t border-border pt-2.5">
            <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground">学期</span>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="全部" active={vol === "all"} onClick={() => setVol("all")} />
              {VOLUMES.map((v) => (
                <FilterChip
                  key={v}
                  label={VOLUME_LABELS[v]}
                  active={vol === v}
                  onClick={() => setVol(v)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-1 grid max-h-[44vh] gap-2 overflow-y-auto border-t border-border pt-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {grade ? `「${grade}${vol === "all" ? "" : VOLUME_LABELS[vol]}」暂无教材` : "请先选择年级"}
            </p>
          ) : (
            filtered.map((t) => (
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
                    {t.volume ? VOLUME_LABELS[t.volume] : ""}
                  </p>
                </div>
                {t.id === currentId && (
                  <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-brand-foreground">
                    当前
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
