"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  ChevronRight,
  Link2,
  Plus,
  Trash2,
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
  type ChapterSyncLink,
  type SyncResourceType,
  type Textbook,
} from "@/lib/types"

const NONE = "__none__"

// 教材对的归一化 key（无方向性）
function pairKey(a: string, b: string) {
  return [a, b].sort().join("__")
}

export default function SyncMappingPage() {
  const { textbooks, chapters, syncLinks, addSyncLink, updateSyncLinkTypes, removeSyncLink } =
    useStore()

  // null = 教材对列表视图；否则为某教材对的详情视图 [tbA, tbB]
  const [activePair, setActivePair] = useState<[string, string] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const tbLabel = (t?: Textbook) =>
    t ? `${t.version} · ${t.subject}${t.grade}（${t.year}）` : "—"
  const tbName = (id: string) => {
    const t = textbooks.find((x) => x.id === id)
    return t ? `${t.version} ${t.subject}${t.grade}` : "—"
  }
  const tbItems = Object.fromEntries(textbooks.map((t) => [t.id, tbLabel(t)]))
  const chapterTitle = (id: string) => chapters.find((c) => c.id === id)?.title ?? "—"
  const chaptersOf = (tbId: string) => chapters.filter((c) => c.textbookId === tbId)

  // 把同步关系按教材对聚合
  const pairs = useMemo(() => {
    const map = new Map<
      string,
      { tbA: string; tbB: string; links: ChapterSyncLink[] }
    >()
    for (const l of syncLinks) {
      const key = pairKey(l.fromTextbookId, l.toTextbookId)
      const [tbA, tbB] = [l.fromTextbookId, l.toTextbookId].sort()
      if (!map.has(key)) map.set(key, { tbA, tbB, links: [] })
      map.get(key)!.links.push(l)
    }
    return Array.from(map.values())
  }, [syncLinks])

  // 当前教材对详情数据
  const activePairData = useMemo(() => {
    if (!activePair) return null
    const key = pairKey(activePair[0], activePair[1])
    return pairs.find((p) => pairKey(p.tbA, p.tbB) === key) ?? {
      tbA: activePair[0],
      tbB: activePair[1],
      links: [],
    }
  }, [activePair, pairs])

  function toggleLinkType(linkId: string, current: SyncResourceType[], t: SyncResourceType) {
    const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
    updateSyncLinkTypes(linkId, next)
  }

  return (
    <div>
      {activePair && activePairData ? (
        <PairDetail
          tbA={activePairData.tbA}
          tbB={activePairData.tbB}
          links={activePairData.links}
          tbName={tbName}
          tbLabel={tbLabel}
          chapterTitle={chapterTitle}
          onBack={() => setActivePair(null)}
          onAdd={() => setDialogOpen(true)}
          onToggleType={toggleLinkType}
          onRemove={(id) => {
            removeSyncLink(id)
            toast.success("已删除目录对应")
          }}
        />
      ) : (
        <PairList
          pairs={pairs}
          textbooks={textbooks}
          tbName={tbName}
          onOpen={(a, b) => setActivePair([a, b])}
          onNew={() => {
            setActivePair(null)
            setDialogOpen(true)
          }}
        />
      )}

      <CreateLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        textbooks={textbooks}
        tbItems={tbItems}
        chaptersOf={chaptersOf}
        syncLinks={syncLinks}
        addSyncLink={addSyncLink}
        // 在某教材对详情里新建时，锁定这两套教材
        lockPair={activePair}
        onCreated={(a, b) => setActivePair([a, b])}
      />
    </div>
  )
}

/* ---------------- 教材对列表视图 ---------------- */
function PairList({
  pairs,
  textbooks,
  tbName,
  onOpen,
  onNew,
}: {
  pairs: { tbA: string; tbB: string; links: ChapterSyncLink[] }[]
  textbooks: Textbook[]
  tbName: (id: string) => string
  onOpen: (a: string, b: string) => void
  onNew: () => void
}) {
  return (
    <>
      <PageHeader
        title="教材同步关系"
        description="以教材对为维度管理同步：先选两套教材，再维护它们之间的目录对应与要同步的资源。"
        actions={
          <Button onClick={onNew} disabled={textbooks.length < 2}>
            <Plus className="size-4" /> 新建同步关系
          </Button>
        }
      />

      <div className="mb-3 flex items-center gap-2 px-1">
        <Link2 className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">
          已建立同步的教材对（<span className="tabular-nums">{pairs.length}</span>）
        </p>
      </div>

      {pairs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            还没有任何教材同步关系，点击右上角「新建同步关系」开始建立。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pairs.map((p) => {
            // 统计这对教材里各类资源被同步的条数
            const typeCount: Record<SyncResourceType, number> = {
              question: 0,
              assignment: 0,
              microlesson: 0,
              airclass: 0,
            }
            p.links.forEach((l) =>
              l.syncTypes.forEach((t) => (typeCount[t] += 1)),
            )
            return (
              <button
                key={pairKeyOf(p.tbA, p.tbB)}
                onClick={() => onOpen(p.tbA, p.tbB)}
                className="group text-left"
              >
                <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30">
                  <CardContent className="py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <BookOpen className="size-4 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium" title={tbName(p.tbA)}>
                          {tbName(p.tbA)}
                        </span>
                      </div>
                      <ArrowLeftRight className="size-4 shrink-0 text-primary" />
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                        <span className="truncate text-sm font-medium" title={tbName(p.tbB)}>
                          {tbName(p.tbB)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal tabular-nums">
                          {p.links.length} 条目录对应
                        </Badge>
                        {SYNC_RESOURCE_TYPES.filter((t) => typeCount[t] > 0).map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="border-primary/30 bg-primary/10 font-normal text-primary"
                          >
                            {SYNC_RESOURCE_LABELS[t]} {typeCount[t]}
                          </Badge>
                        ))}
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ---------------- 教材对详情视图 ---------------- */
function PairDetail({
  tbA,
  tbB,
  links,
  tbName,
  tbLabel,
  chapterTitle,
  onBack,
  onAdd,
  onToggleType,
  onRemove,
}: {
  tbA: string
  tbB: string
  links: ChapterSyncLink[]
  tbName: (id: string) => string
  tbLabel: (t: Textbook | undefined) => string
  chapterTitle: (id: string) => string
  onBack: () => void
  onAdd: () => void
  onToggleType: (id: string, current: SyncResourceType[], t: SyncResourceType) => void
  onRemove: (id: string) => void
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 返回教材对列表
      </button>

      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="size-4 text-primary" />
            {tbName(tbA)}
          </div>
          <ArrowLeftRight className="size-4 text-primary" />
          <div className="flex items-center gap-2 text-sm font-medium">
            {tbName(tbB)}
          </div>
        </div>
        <Button onClick={onAdd}>
          <Plus className="size-4" /> 新建目录对应
        </Button>
      </div>

      <div className="mb-3 flex items-center gap-2 px-1">
        <Link2 className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">
          目录对应（<span className="tabular-nums">{links.length}</span>）
        </p>
      </div>

      {links.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            这两套教材之间还没有目录对应，点击「新建目录对应」开始建立。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            // 统一以 tbA 在左、tbB 在右展示
            const leftChId =
              link.fromTextbookId === tbA ? link.fromChapterId : link.toChapterId
            const rightChId =
              link.fromTextbookId === tbA ? link.toChapterId : link.fromChapterId
            return (
              <Card key={link.id}>
                <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                  <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <p
                      className="truncate text-sm font-medium"
                      title={chapterTitle(leftChId)}
                    >
                      {chapterTitle(leftChId)}
                    </p>
                    <ArrowLeftRight className="size-4 shrink-0 text-primary" />
                    <p
                      className="truncate text-sm font-medium"
                      title={chapterTitle(rightChId)}
                    >
                      {chapterTitle(rightChId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 lg:border-l lg:pl-4">
                    {SYNC_RESOURCE_TYPES.map((t) => {
                      const active = link.syncTypes.includes(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => onToggleType(link.id, link.syncTypes, t)}
                          title={
                            active
                              ? `点击取消同步「${SYNC_RESOURCE_LABELS[t]}」`
                              : `点击同步「${SYNC_RESOURCE_LABELS[t]}」`
                          }
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "cursor-pointer font-normal transition-colors",
                              active
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-dashed text-muted-foreground/60 hover:bg-accent",
                            )}
                          >
                            {SYNC_RESOURCE_LABELS[t]}
                          </Badge>
                        </button>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="删除目录对应"
                      onClick={() => onRemove(link.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
  chaptersOf,
  syncLinks,
  addSyncLink,
  lockPair,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  textbooks: Textbook[]
  tbItems: Record<string, string>
  chaptersOf: (tbId: string) => ReturnType<typeof Array.prototype.filter>
  syncLinks: ChapterSyncLink[]
  addSyncLink: (link: Omit<ChapterSyncLink, "id">) => void
  lockPair: [string, string] | null
  onCreated: (a: string, b: string) => void
}) {
  const [dFromTb, setDFromTb] = useState<string>("")
  const [dToTb, setDToTb] = useState<string>("")
  const [dFromCh, setDFromCh] = useState<string>("")
  const [dToCh, setDToCh] = useState<string>("")
  const [dTypes, setDTypes] = useState<SyncResourceType[]>(["question"])

  // 打开时初始化（在教材对详情里打开则锁定该对教材）
  useMemo(() => {
    if (open) {
      const a = lockPair?.[0] ?? textbooks[0]?.id ?? ""
      const b = lockPair?.[1] ?? textbooks[1]?.id ?? ""
      setDFromTb(a)
      setDToTb(b)
      setDFromCh("")
      setDToCh("")
      setDTypes(["question"])
    }
  }, [open])

  const dFromChapters = chaptersOf(dFromTb)
  const dToChapters = chaptersOf(dToTb)
  const fromChItems = {
    [NONE]: "选择教材一目录",
    ...Object.fromEntries(dFromChapters.map((c: any) => [c.id, c.title])),
  }
  const toChItems = {
    [NONE]: "选择教材二目录",
    ...Object.fromEntries(dToChapters.map((c: any) => [c.id, c.title])),
  }

  function toggleDraftType(t: SyncResourceType) {
    setDTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function handleCreate() {
    if (dFromTb === dToTb) {
      toast.error("请选择两套不同的教材")
      return
    }
    if (!dFromCh || dFromCh === NONE || !dToCh || dToCh === NONE) {
      toast.error("请选择两套教材要对应的目录")
      return
    }
    if (dTypes.length === 0) {
      toast.error("请至少选择一种要同步的资源")
      return
    }
    const dup = syncLinks.some(
      (l) =>
        (l.fromChapterId === dFromCh && l.toChapterId === dToCh) ||
        (l.fromChapterId === dToCh && l.toChapterId === dFromCh),
    )
    if (dup) {
      toast.error("这两个目录已建立对应")
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
    onCreated(dFromTb, dToTb)
  }

  const lockTextbooks = lockPair !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lockTextbooks ? "新建目录对应" : "新建同步关系"}</DialogTitle>
          <DialogDescription>
            {lockTextbooks
              ? "为当前教材对新增一条目录对应，并勾选要同步的资源。"
              : "选择两套教材各自的一个目录建立对应，并勾选要同步的资源。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">教材一</label>
              <Select
                value={dFromTb}
                items={tbItems}
                disabled={lockTextbooks}
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
              <ArrowLeftRight className="size-4" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">教材二</label>
              <Select
                value={dToTb}
                items={tbItems}
                disabled={lockTextbooks}
                onValueChange={(v) => {
                  setDToTb(v)
                  setDToCh("")
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
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Select value={dFromCh || NONE} onValueChange={setDFromCh} items={fromChItems}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>选择教材一目录</SelectItem>
                {dFromChapters.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? "　" : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowLeftRight className="size-4 shrink-0 text-primary" />
            <Select value={dToCh || NONE} onValueChange={setDToCh} items={toChItems}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>选择教材二目录</SelectItem>
                {dToChapters.map((c: any) => (
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

function pairKeyOf(a: string, b: string) {
  return [a, b].sort().join("__")
}
