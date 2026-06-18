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
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SYNC_RESOURCE_LABELS, SYNC_RESOURCE_TYPES, type SyncResourceType } from "@/lib/types"

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

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
  const { chapters, resourcesByKind, batchMountResources, unmountResource } = useStore()

  const chapter = chapters.find((c) => c.id === chapterId)
  const [kind, setKind] = useState<SyncResourceType>("question")
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const resources = useMemo(() => resourcesByKind(kind), [resourcesByKind, kind])

  // 已挂入本章节的资源
  const mountedList = useMemo(() => {
    if (!chapter) return []
    return resources.filter((r) =>
      r.chapterMounts.some((m) => m.textbookId === textbookId && m.chapterId === chapter.id),
    )
  }, [chapter, resources, textbookId])

  // 可挂入（尚未挂到本章节）的资源
  const availableList = useMemo(() => {
    if (!chapter) return []
    return resources.filter((r) => {
      const notMounted = !r.chapterMounts.some(
        (m) => m.textbookId === textbookId && m.chapterId === chapter.id,
      )
      const matchKw = !keyword || r.title.includes(keyword)
      return notMounted && matchKw
    })
  }, [chapter, resources, textbookId, keyword])

  if (!chapter) return null

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
    toast.success(`已挂入 ${selected.size} 个${SYNC_RESOURCE_LABELS[kind]}`)
    setSelected(new Set())
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base">批量挂载资源</SheetTitle>
          <SheetDescription>
            将选中的资源批量挂载到目录节点：
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* 已挂载到本节的资源 */}
          {mountedList.length > 0 && (
            <section className="mb-5 space-y-2">
              <h3 className="text-sm font-medium">
                本节已挂载的{SYNC_RESOURCE_LABELS[kind]}（{mountedList.length}）
              </h3>
              <div className="space-y-1.5">
                {mountedList.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground/90">{r.title}</p>
                      {r.subtitle && (
                        <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        unmountResource(kind, r.id, textbookId, chapter.id)
                        toast.success("已移出本节")
                      }}
                    >
                      移出
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 选择资源挂入本节 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">选择{SYNC_RESOURCE_LABELS[kind]}挂入本节</h3>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题…"
                className="h-8 w-44"
              />
            </div>
            <div className="space-y-1.5">
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
                <p className="py-8 text-center text-sm text-muted-foreground">
                  没有可挂入的{SYNC_RESOURCE_LABELS[kind]}。
                </p>
              )}
            </div>
          </section>
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
