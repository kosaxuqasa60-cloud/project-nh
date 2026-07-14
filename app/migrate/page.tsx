"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Link2,
  Plus,
  Undo2,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import {
  SYNC_RESOURCE_LABELS,
  SYNC_RESOURCE_TYPES,
  type ChapterNode,
  type ChapterSyncLink,
  type SyncResourceType,
  type Textbook,
} from "@/lib/types"

const NONE = "__none__"

export default function SyncMappingPage() {
  const { textbooks, chapters, syncLinks, addSyncLink, removeSyncLink } = useStore()

  // null = 主教材列表视图；否则为某主教材的详情视图（fromTextbookId）
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const tbLabel = (t?: Textbook) =>
    t ? `${t.version} · ${t.subject}${t.grade}（${t.year}）` : "—"
  const tbName = (id: string) => {
    const t = textbooks.find((x) => x.id === id)
    return t ? `${t.version} ${t.subject}${t.grade}（${t.year}）` : "—"
  }
  const tbItems = Object.fromEntries(textbooks.map((t) => [t.id, tbLabel(t)]))
  const chapterTitle = (id: string) => chapters.find((c) => c.id === id)?.title ?? "—"
  const chaptersOf = (tbId: string) => chapters.filter((c) => c.textbookId === tbId)

  // 按主教材（fromTextbookId）聚合：一个主教材 → 多套目标教材
  const sources = useMemo(() => {
    const map = new Map<string, ChapterSyncLink[]>()
    for (const l of syncLinks) {
      if (!map.has(l.fromTextbookId)) map.set(l.fromTextbookId, [])
      map.get(l.fromTextbookId)!.push(l)
    }
    return Array.from(map.entries()).map(([fromTextbookId, links]) => ({
      fromTextbookId,
      links,
      targetIds: Array.from(new Set(links.map((l) => l.toTextbookId))),
    }))
  }, [syncLinks])

  const activeSourceData = useMemo(() => {
    if (!activeSource) return null
    return (
      sources.find((s) => s.fromTextbookId === activeSource) ?? {
        fromTextbookId: activeSource,
        links: [],
        targetIds: [],
      }
    )
  }, [activeSource, sources])

  return (
    <div>
      {activeSource && activeSourceData ? (
        <SourceDetail
          fromTextbookId={activeSourceData.fromTextbookId}
          links={activeSourceData.links}
          tbName={tbName}
          chapterTitle={chapterTitle}
          onBack={() => setActiveSource(null)}
          onAdd={() => setDialogOpen(true)}
          onRemove={(id) => {
            removeSyncLink(id)
            toast.success("已撤回该条目录对应")
          }}
        />
      ) : (
        <SourceList
          sources={sources}
          textbooks={textbooks}
          tbName={tbName}
          onOpen={(id) => setActiveSource(id)}
          onNew={() => {
            setActiveSource(null)
            setDialogOpen(true)
          }}
        />
      )}

      <CreateLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        textbooks={textbooks}
        tbItems={tbItems}
        tbName={tbName}
        chaptersOf={chaptersOf}
        syncLinks={syncLinks}
        addSyncLink={addSyncLink}
        // 在主教材详情里新建时，锁定主教材
        lockSource={activeSource}
        onCreated={(from) => setActiveSource(from)}
      />
    </div>
  )
}

/* ---------------- 主教材列表视图 ---------------- */
function SourceList({
  sources,
  textbooks,
  tbName,
  onOpen,
  onNew,
}: {
  sources: { fromTextbookId: string; links: ChapterSyncLink[]; targetIds: string[] }[]
  textbooks: Textbook[]
  tbName: (id: string) => string
  onOpen: (id: string) => void
  onNew: () => void
}) {
  return (
    <>
      <PageHeader
        title="教材同步关系"
        description="以主教材为维度管理一对多同步：一套主教材可以把它的目录资源同步到多套目标教材，点击卡片查看与维护。"
        actions={
          <Button onClick={onNew} disabled={textbooks.length < 2}>
            <Plus className="size-4" /> 新建同步关系
          </Button>
        }
      />

      <div className="mb-3 flex items-center gap-2 px-1">
        <Link2 className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">
          作为主教材的同步（<span className="tabular-nums">{sources.length}</span>）
        </p>
      </div>

      {sources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            还没有任何教材同步关系，点击右上角「新建同步关系」开始建立。
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {sources.map((s, i) => (
            <button
              key={s.fromTextbookId}
              onClick={() => onOpen(s.fromTextbookId)}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                i > 0 && "border-t border-border",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={tbName(s.fromTextbookId)}>
                  {tbName(s.fromTextbookId)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowRight className="size-3.5" />
                  同步到 {s.targetIds.length} 套目标教材 · 共 {s.links.length} 条目录对应
                </p>
              </div>
              <Badge variant="secondary" className="hidden shrink-0 font-normal tabular-nums sm:inline-flex">
                {s.links.length} 条对应
              </Badge>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------------- 主教材详情视图（按目标教材分组） ---------------- */
function SourceDetail({
  fromTextbookId,
  links,
  tbName,
  chapterTitle,
  onBack,
  onAdd,
  onRemove,
}: {
  fromTextbookId: string
  links: ChapterSyncLink[]
  tbName: (id: string) => string
  chapterTitle: (id: string) => string
  onBack: () => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  // 按目标教材分组
  const groups = useMemo(() => {
    const map = new Map<string, ChapterSyncLink[]>()
    for (const l of links) {
      if (!map.has(l.toTextbookId)) map.set(l.toTextbookId, [])
      map.get(l.toTextbookId)!.push(l)
    }
    return Array.from(map.entries())
  }, [links])

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 返回主教材列表
      </button>

      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{tbName(fromTextbookId)}</p>
            <p className="text-xs text-muted-foreground">
              主教材 · 同步到 {groups.length} 套目标教材
            </p>
          </div>
        </div>
        <Button onClick={onAdd}>
          <Plus className="size-4" /> 新建目录对应
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            该主教材还没有同步到任何目标教材，点击「新建目录对应」开始建立。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([toTextbookId, groupLinks]) => (
            <div key={toTextbookId}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <ArrowRight className="size-4 text-primary" />
                <p className="text-sm font-medium">{tbName(toTextbookId)}</p>
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {groupLinks.length} 条
                </Badge>
              </div>
              <div className="space-y-2">
                {groupLinks.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                      <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <p
                          className="truncate text-sm font-medium"
                          title={chapterTitle(link.fromChapterId)}
                        >
                          {chapterTitle(link.fromChapterId)}
                        </p>
                        <ArrowRight className="size-4 shrink-0 text-primary" />
                        <p
                          className="truncate text-sm text-muted-foreground"
                          title={chapterTitle(link.toChapterId)}
                        >
                          {chapterTitle(link.toChapterId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 lg:border-l lg:pl-4">
                        {SYNC_RESOURCE_TYPES.filter((t) => link.syncTypes.includes(t)).map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="border-primary/30 bg-primary/10 font-normal text-primary"
                          >
                            {SYNC_RESOURCE_LABELS[t]}
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                          title="撤回整条目录对应"
                          onClick={() => onRemove(link.id)}
                        >
                          <Undo2 className="size-3.5" /> 撤回
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------------- 新建对应弹窗 ---------------- */
function CreateLinkDialog({
  open,
  onOpenChange,
  textbooks,
  tbItems,
  tbName,
  chaptersOf,
  syncLinks,
  addSyncLink,
  lockSource,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  textbooks: Textbook[]
  tbItems: Record<string, string>
  tbName: (id: string) => string
  chaptersOf: (tbId: string) => ChapterNode[]
  syncLinks: ChapterSyncLink[]
  addSyncLink: (link: Omit<ChapterSyncLink, "id">) => void
  lockSource: string | null
  onCreated: (from: string) => void
}) {
  const [dFromTb, setDFromTb] = useState<string>("")
  const [dToTb, setDToTb] = useState<string>("")
  const [dFromCh, setDFromCh] = useState<string>("")
  const [dToCh, setDToCh] = useState<string>("")
  const [dTypes, setDTypes] = useState<SyncResourceType[]>(["question"])

  // 打开时初始化（在主教材详情里打开则锁定主教材）
  useMemo(() => {
    if (open) {
      const from = lockSource ?? textbooks[0]?.id ?? ""
      const to = textbooks.find((t) => t.id !== from)?.id ?? ""
      setDFromTb(from)
      setDToTb(to)
      setDFromCh("")
      setDToCh("")
      setDTypes(["question"])
    }
  }, [open])

  const dFromChapters = chaptersOf(dFromTb)
  const dToChapters = chaptersOf(dToTb)

  function toggleDraftType(t: SyncResourceType) {
    setDTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function handleCreate() {
    if (dFromTb === dToTb) {
      toast.error("主教材与目标教材不能相同")
      return
    }
    if (!dFromCh || dFromCh === NONE || !dToCh || dToCh === NONE) {
      toast.error("请选择主教材与目标教材要对应的目录")
      return
    }
    if (dTypes.length === 0) {
      toast.error("请至少选择一种要同步的资源")
      return
    }
    const dup = syncLinks.some(
      (l) =>
        l.fromTextbookId === dFromTb &&
        l.fromChapterId === dFromCh &&
        l.toTextbookId === dToTb &&
        l.toChapterId === dToCh,
    )
    if (dup) {
      toast.error("这条目录对应已存在")
      return
    }
    addSyncLink({
      fromTextbookId: dFromTb,
      fromChapterId: dFromCh,
      toTextbookId: dToTb,
      toChapterId: dToCh,
      syncTypes: dTypes,
    })
    toast.success("已建立目录对应")
    onOpenChange(false)
    onCreated(dFromTb)
  }

  const lockSourceTb = lockSource !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新建同步关系</DialogTitle>
          <DialogDescription>
            选择主教材的一个目录，对应到目标教材的一个目录，并勾选要同步的资源。同一主教材可同步到多套目标教材。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">主教材</label>
              <Select
                value={dFromTb}
                items={tbItems}
                disabled={lockSourceTb}
                onValueChange={(v) => {
                  setDFromTb(v)
                  setDFromCh("")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textbooks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {tbItems[t.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex h-9 items-center justify-center text-muted-foreground">
              <ArrowRight className="size-4" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">目标教材</label>
              <Select
                value={dToTb}
                items={tbItems}
                onValueChange={(v) => {
                  setDToTb(v)
                  setDToCh("")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textbooks
                    .filter((t) => t.id !== dFromTb)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {tbItems[t.id]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Select value={dFromCh || NONE} onValueChange={setDFromCh}>
              <SelectTrigger>
                <SelectValue placeholder="选择主教材目录" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>选择主教材目录</SelectItem>
                {dFromChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? "　" : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRight className="size-4 shrink-0 text-primary" />
            <Select value={dToCh || NONE} onValueChange={setDToCh}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标教材目录" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>选择目标教材目录</SelectItem>
                {dToChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? "　" : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              要同步的资源（可多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {SYNC_RESOURCE_TYPES.map((t) => {
                const active = dTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleDraftType(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {SYNC_RESOURCE_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreate}>建立对应</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
