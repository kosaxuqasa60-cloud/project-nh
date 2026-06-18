"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, Link2, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  type SyncResourceType,
  type Textbook,
} from "@/lib/types"

const NONE = "__none__"

export default function SyncMappingPage() {
  const { textbooks, chapters, syncLinks, addSyncLink, updateSyncLinkTypes, removeSyncLink } =
    useStore()

  const [fromId, setFromId] = useState<string>(textbooks[0]?.id ?? "")
  const [toId, setToId] = useState<string>(textbooks[1]?.id ?? "")

  // 新增同步关系的草稿
  const [draftFrom, setDraftFrom] = useState<string>("")
  const [draftTo, setDraftTo] = useState<string>("")
  const [draftTypes, setDraftTypes] = useState<SyncResourceType[]>(["question"])

  const tbLabel = (t?: Textbook) =>
    t ? `${t.version} · ${t.subject}${t.grade}（${t.year}）` : ""

  const tbItems = Object.fromEntries(textbooks.map((t) => [t.id, tbLabel(t)]))

  // 某教材下的章节（含层级缩进显示）
  const chaptersOf = (tbId: string) => chapters.filter((c) => c.textbookId === tbId)
  const fromChapters = useMemo(() => chaptersOf(fromId), [fromId, chapters])
  const toChapters = useMemo(() => chaptersOf(toId), [toId, chapters])

  const chapterTitle = (id: string) => chapters.find((c) => c.id === id)?.title ?? "—"
  const indent = (c: ChapterNode) => (c.parentId ? "　" : "")

  const fromChapterItems = {
    [NONE]: "选择教材一目录",
    ...Object.fromEntries(fromChapters.map((c) => [c.id, c.title])),
  }
  const toChapterItems = {
    [NONE]: "选择教材二目录",
    ...Object.fromEntries(toChapters.map((c) => [c.id, c.title])),
  }

  // 当前两套教材之间已建立的同步关系
  const currentLinks = syncLinks.filter(
    (l) =>
      (l.fromTextbookId === fromId && l.toTextbookId === toId) ||
      (l.fromTextbookId === toId && l.toTextbookId === fromId),
  )

  function toggleDraftType(t: SyncResourceType) {
    setDraftTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  function handleAdd() {
    if (!draftFrom || draftFrom === NONE || !draftTo || draftTo === NONE) {
      toast.error("请先选择教材一与教材二的对应目录")
      return
    }
    if (draftTypes.length === 0) {
      toast.error("请至少选择一种要同步的资源")
      return
    }
    const dup = currentLinks.some(
      (l) =>
        (l.fromChapterId === draftFrom && l.toChapterId === draftTo) ||
        (l.fromChapterId === draftTo && l.toChapterId === draftFrom),
    )
    if (dup) {
      toast.error("这两个目录已建立同步关系")
      return
    }
    addSyncLink({
      fromTextbookId: fromId,
      fromChapterId: draftFrom,
      toTextbookId: toId,
      toChapterId: draftTo,
      syncTypes: draftTypes,
    })
    toast.success("已建立同步关系")
    setDraftFrom("")
    setDraftTo("")
    setDraftTypes(["question"])
  }

  function toggleLinkType(linkId: string, current: SyncResourceType[], t: SyncResourceType) {
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t]
    updateSyncLinkTypes(linkId, next)
  }

  const sameTb = fromId === toId

  return (
    <div>
      <PageHeader
        title="教材同步关系"
        description="把教材一的目录与教材二的目录建立对应，并指定每条对应要同步的资源（题目 / 作业 / 微课 / 空中课堂）。完全手工设定，按需勾选。"
      />

      {/* 教材选择 */}
      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">教材一</label>
            <Select value={fromId} onValueChange={setFromId} items={tbItems}>
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
          <div className="flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-accent text-accent-foreground sm:mb-1">
            <ArrowLeftRight className="size-4" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">教材二</label>
            <Select value={toId} onValueChange={setToId} items={tbItems}>
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
        </CardContent>
      </Card>

      {sameTb ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          请选择两套不同的教材以建立同步关系。
        </p>
      ) : (
        <>
          {/* 新增同步关系 */}
          <Card className="mb-5 border-primary/20">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <p className="text-sm font-medium">新增同步关系</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <Select value={draftFrom || NONE} onValueChange={setDraftFrom} items={fromChapterItems}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>选择教材一目录</SelectItem>
                    {fromChapters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {indent(c)}
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowLeftRight className="size-4" />
                </div>
                <Select value={draftTo || NONE} onValueChange={setDraftTo} items={toChapterItems}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>选择教材二目录</SelectItem>
                    {toChapters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {indent(c)}
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">同步资源：</span>
                {SYNC_RESOURCE_TYPES.map((t) => {
                  const active = draftTypes.includes(t)
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
                <Button className="ml-auto" size="sm" onClick={handleAdd}>
                  <Plus className="size-4" /> 建立同步
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 已建立的同步关系 */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <Link2 className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              已建立的同步关系（<span className="tabular-nums">{currentLinks.length}</span>）
            </p>
          </div>

          {currentLinks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                这两套教材之间还没有同步关系，使用上方表单建立。
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {currentLinks.map((link) => {
                // 统一以「教材一在左」展示
                const leftIsFrom = link.fromTextbookId === fromId
                const leftChapter = leftIsFrom ? link.fromChapterId : link.toChapterId
                const rightChapter = leftIsFrom ? link.toChapterId : link.fromChapterId
                return (
                  <Card key={link.id}>
                    <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                      <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <p className="truncate text-sm font-medium" title={chapterTitle(leftChapter)}>
                          {chapterTitle(leftChapter)}
                        </p>
                        <ArrowLeftRight className="size-4 shrink-0 text-primary" />
                        <p className="truncate text-sm font-medium" title={chapterTitle(rightChapter)}>
                          {chapterTitle(rightChapter)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 lg:border-l lg:pl-4">
                        {SYNC_RESOURCE_TYPES.map((t) => {
                          const active = link.syncTypes.includes(t)
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleLinkType(link.id, link.syncTypes, t)}
                              title={active ? `点击取消同步「${SYNC_RESOURCE_LABELS[t]}」` : `点击同步「${SYNC_RESOURCE_LABELS[t]}」`}
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
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
