"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, Link2, Plus, Trash2 } from "lucide-react"
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
  type SyncResourceType,
  type Textbook,
} from "@/lib/types"

const NONE = "__none__"

export default function SyncMappingPage() {
  const { textbooks, chapters, syncLinks, addSyncLink, updateSyncLinkTypes, removeSyncLink } =
    useStore()

  const [dialogOpen, setDialogOpen] = useState(false)

  // 新建同步关系的草稿
  const [dFromTb, setDFromTb] = useState<string>(textbooks[0]?.id ?? "")
  const [dToTb, setDToTb] = useState<string>(textbooks[1]?.id ?? "")
  const [dFromCh, setDFromCh] = useState<string>("")
  const [dToCh, setDToCh] = useState<string>("")
  const [dTypes, setDTypes] = useState<SyncResourceType[]>(["question"])

  const tbLabel = (t?: Textbook) =>
    t ? `${t.version} · ${t.subject}${t.grade}（${t.year}）` : "—"
  const tbShort = (id: string) => {
    const t = textbooks.find((x) => x.id === id)
    return t ? `${t.version} ${t.subject}` : "—"
  }
  const chapterTitle = (id: string) => chapters.find((c) => c.id === id)?.title ?? "—"

  const tbItems = Object.fromEntries(textbooks.map((t) => [t.id, tbLabel(t)]))
  const chaptersOf = (tbId: string) => chapters.filter((c) => c.textbookId === tbId)

  const dFromChapters = useMemo(() => chaptersOf(dFromTb), [dFromTb, chapters])
  const dToChapters = useMemo(() => chaptersOf(dToTb), [dToTb, chapters])

  const fromChItems = {
    [NONE]: "选择教材一目录",
    ...Object.fromEntries(dFromChapters.map((c) => [c.id, c.title])),
  }
  const toChItems = {
    [NONE]: "选择教材二目录",
    ...Object.fromEntries(dToChapters.map((c) => [c.id, c.title])),
  }

  function openDialog() {
    setDFromTb(textbooks[0]?.id ?? "")
    setDToTb(textbooks[1]?.id ?? "")
    setDFromCh("")
    setDToCh("")
    setDTypes(["question"])
    setDialogOpen(true)
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
      toast.error("这两个目录已建立同步关系")
      return
    }
    addSyncLink({
      fromTextbookId: dFromTb,
      fromChapterId: dFromCh,
      toTextbookId: dToTb,
      toChapterId: dToCh,
      syncTypes: dTypes,
    })
    toast.success("已建立同步关系")
    setDialogOpen(false)
  }

  function toggleLinkType(linkId: string, current: SyncResourceType[], t: SyncResourceType) {
    const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
    updateSyncLinkTypes(linkId, next)
  }

  return (
    <div>
      <PageHeader
        title="教材同步关系"
        description="把两套教材的目录手工建立对应，并为每条对应指定要同步的资源（题目 / 作业 / 微课 / 空中课堂）。"
        actions={
          <Button onClick={openDialog}>
            <Plus className="size-4" /> 新建同步关系
          </Button>
        }
      />

      {/* 已建立的同步关系列表 */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <Link2 className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">
          全部同步关系（<span className="tabular-nums">{syncLinks.length}</span>）
        </p>
      </div>

      {syncLinks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            还没有任何同步关系，点击右上角「新建同步关系」开始建立。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {syncLinks.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="min-w-0">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      {tbShort(link.fromTextbookId)}
                    </p>
                    <p
                      className="truncate text-sm font-medium"
                      title={chapterTitle(link.fromChapterId)}
                    >
                      {chapterTitle(link.fromChapterId)}
                    </p>
                  </div>
                  <ArrowLeftRight className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      {tbShort(link.toTextbookId)}
                    </p>
                    <p
                      className="truncate text-sm font-medium"
                      title={chapterTitle(link.toChapterId)}
                    >
                      {chapterTitle(link.toChapterId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 lg:border-l lg:pl-4">
                  {SYNC_RESOURCE_TYPES.map((t) => {
                    const active = link.syncTypes.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleLinkType(link.id, link.syncTypes, t)}
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
                    title="删除同步关系"
                    onClick={() => {
                      removeSyncLink(link.id)
                      toast.success("已删除同步关系")
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建同步关系弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新建同步关系</DialogTitle>
            <DialogDescription>
              选择两套教材各自的一个目录建立对应，并勾选要同步的资源。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* 教材选择 */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">教材一</label>
                <Select
                  value={dFromTb}
                  items={tbItems}
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
                        {tbLabel(t)}
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
                        {tbLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 目录对应 */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <Select value={dFromCh || NONE} onValueChange={setDFromCh} items={fromChItems}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>选择教材一目录</SelectItem>
                  {dFromChapters.map((c) => (
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
                  {dToChapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.parentId ? "　" : ""}
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 同步资源 */}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>建立同步</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
