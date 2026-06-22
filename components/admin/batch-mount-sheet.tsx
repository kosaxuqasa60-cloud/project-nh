"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FileStack, FileText, Radio, Video } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SYNC_RESOURCE_LABELS, SYNC_RESOURCE_TYPES, type SyncResourceType } from "@/lib/types"

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

const ANY = "any"

export function BatchMountSheet({
  textbookId,
  chapterId,
  open,
  onOpenChange,
}: {
  textbookId: string
  chapterId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { textbooks, chapters, resourcesByKind, batchMountResources } = useStore()

  const chapter = chapters.find((c) => c.id === chapterId)
  const [kind, setKind] = useState<SyncResourceType>("question")
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // 来源筛选：从「哪本教材的哪个目录节点」里挑资源
  const [srcTextbook, setSrcTextbook] = useState(ANY)
  const [srcChapter, setSrcChapter] = useState(ANY)

  const resources = useMemo(() => resourcesByKind(kind), [resourcesByKind, kind])

  // 来源教材的章节列表（用于二级筛选）
  const srcChapters = useMemo(
    () =>
      srcTextbook === ANY
        ? []
        : chapters
            .filter((c) => c.textbookId === srcTextbook)
            .sort((a, b) => a.order - b.order),
    [chapters, srcTextbook],
  )

  // 可挂入（尚未挂到本章节）的资源，叠加来源筛选与关键词
  const availableList = useMemo(() => {
    if (!chapter) return []
    return resources.filter((r) => {
      const notMounted = !r.chapterMounts.some(
        (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
      )
      if (!notMounted) return false
      // 来源筛选：资源需挂在所选来源教材（及章节）下
      if (srcTextbook !== ANY) {
        const inSrc = r.chapterMounts.some(
          (m) =>
            m.textbookId === srcTextbook &&
            (srcChapter === ANY || m.chapterId === srcChapter),
        )
        if (!inSrc) return false
      }
      const matchKw = !keyword || r.title.includes(keyword)
      return matchKw
    })
  }, [chapter, resources, textbookId, keyword, srcTextbook, srcChapter])

  if (!chapter) return null

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allChecked = availableList.length > 0 && availableList.every((r) => selected.has(r.id))
  function toggleAll() {
    setSelected((prev) => {
      if (allChecked) return new Set()
      return new Set(availableList.map((r) => r.id))
    })
  }

  function switchKind(k: SyncResourceType) {
    setKind(k)
    setSelected(new Set())
    setKeyword("")
  }

  function mountSelected() {
    if (selected.size === 0) {
      toast.error("请先勾选资源")
      return
    }
    batchMountResources(kind, textbookId, chapter!.id, Array.from(selected))
    toast.success(`已挂入 ${selected.size} 个${SYNC_RESOURCE_LABELS[kind]}`, {
      description: "可在教材详情「已挂载资源」中查看或移出",
    })
    setSelected(new Set())
  }

  const tbName = (id: string) => {
    const t = textbooks.find((x) => x.id === id)
    return t ? `${t.version} ${t.subject}${t.grade}（${t.year}）` : "—"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base">批量挂载资源</SheetTitle>
          <SheetDescription>
            挂入目标：<span className="font-medium text-foreground">{tbName(textbookId)}</span>
            {" / "}
            <span className="font-medium text-foreground">{chapter.title}</span>
          </SheetDescription>
        </SheetHeader>

        {/* 资源类型切换 */}
        <div className="flex gap-1 border-b border-border px-6 py-2.5">
          {SYNC_RESOURCE_TYPES.map((k) => {
            const Icon = KIND_ICON[k]
            const active = kind === k
            return (
              <button
                key={k}
                onClick={() => switchKind(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                {SYNC_RESOURCE_LABELS[k]}
              </button>
            )
          })}
        </div>

        {/* 来源筛选 */}
        <div className="flex flex-wrap items-end gap-3 border-b border-border bg-muted/20 px-6 py-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">来源教材</Label>
            <Select
              value={srcTextbook}
              onValueChange={(v) => {
                setSrcTextbook(v)
                setSrcChapter(ANY)
              }}
              items={{
                [ANY]: "全部教材",
                ...Object.fromEntries(textbooks.map((t) => [t.id, tbName(t.id)])),
              }}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>全部教材</SelectItem>
                {textbooks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {tbName(t.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">来源目录节点</Label>
            <Select
              value={srcChapter}
              onValueChange={setSrcChapter}
              disabled={srcTextbook === ANY}
              items={{
                [ANY]: "全部目录",
                ...Object.fromEntries(srcChapters.map((c) => [c.id, c.title])),
              }}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="先选来源教材" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>全部目录</SelectItem>
                {srcChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 选择资源挂入 */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            全选当前 {availableList.length} 项
          </label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题…"
            className="h-8 w-44"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-6 py-4">
          {availableList.map((r) => {
            const checked = selected.has(r.id)
            return (
              <label
                key={r.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(r.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm leading-snug text-foreground/90">{r.title}</p>
                  {r.subtitle && (
                    <Badge variant="secondary" className="font-normal">
                      {r.subtitle}
                    </Badge>
                  )}
                </div>
              </label>
            )
          })}
          {availableList.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              没有可挂入的{SYNC_RESOURCE_LABELS[kind]}，试试调整来源筛选或关键词。
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            已勾选 <span className="font-semibold text-foreground">{selected.size}</span> 个
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button onClick={mountSelected} disabled={selected.size === 0}>
              挂入选中{SYNC_RESOURCE_LABELS[kind]}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
