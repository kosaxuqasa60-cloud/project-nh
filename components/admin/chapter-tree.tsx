"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  FileStack,
  FileText,
  GripVertical,
  Layers,
  Plus,
  Radio,
  Trash2,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BatchMountSheet } from "@/components/admin/batch-mount-sheet"
import { ChapterImportDialog } from "@/components/admin/chapter-import-dialog"
import { useStore } from "@/lib/store"
import { SYNC_RESOURCE_LABELS, type ChapterNode, type SyncResourceType } from "@/lib/types"

const RESOURCE_META: { kind: SyncResourceType; icon: typeof FileStack }[] = [
  { kind: "question", icon: FileStack },
  { kind: "assignment", icon: FileText },
  { kind: "microlesson", icon: Video },
  { kind: "airclass", icon: Radio },
]

export function ChapterTree({ textbookId }: { textbookId: string }) {
  const { chapters, addChapter, updateChapter, removeChapter, countResourcesByChapter } =
    useStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [mountChapterId, setMountChapterId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openMount(chapterId: string) {
    setMountChapterId(chapterId)
    setSheetOpen(true)
  }

  const tbChapters = chapters.filter((c) => c.textbookId === textbookId)
  const roots = tbChapters
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.order - b.order)

  const childrenOf = (id: string) =>
    tbChapters.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order)

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !(p[id] ?? true) }))

  function startEdit(node: ChapterNode) {
    setEditingId(node.id)
    setDraft(node.title)
  }
  function commitEdit() {
    if (editingId && draft.trim()) {
      updateChapter(editingId, { title: draft.trim() })
    }
    setEditingId(null)
  }

  function addRoot() {
    const order = roots.length + 1
    addChapter({ textbookId, parentId: null, title: `第${order}章 新章节`, order })
    toast.success("已新增一级章节")
  }
  function addChild(parentId: string) {
    const order = childrenOf(parentId).length + 1
    addChapter({ textbookId, parentId, title: `新小节 ${order}`, order })
    setExpanded((p) => ({ ...p, [parentId]: true }))
    toast.success("已新增子节点")
  }

  function renderNode(node: ChapterNode, depth: number) {
    const kids = childrenOf(node.id)
    const hasKids = kids.length > 0
    const isOpen = expanded[node.id] ?? true
    const counts = RESOURCE_META.map((r) => ({
      ...r,
      count: countResourcesByChapter(node.id, r.kind),
    }))
    const kpCount = node.knowledgePointIds.length

    return (
      <div key={node.id}>
        <div
          className="group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-muted/60"
          style={{ paddingLeft: depth * 20 + 4 }}
        >
          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
          <button
            onClick={() => hasKids && toggle(node.id)}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground",
              !hasKids && "invisible",
            )}
          >
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>

          {editingId === node.id ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => e.key === "Enter" && commitEdit()}
              className="h-7 max-w-sm"
            />
          ) : (
            <button
              onClick={() => startEdit(node)}
              className={cn(
                "truncate text-left text-sm",
                depth === 0 ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {node.title}
            </button>
          )}

          {kpCount > 0 && (
            <Badge
              variant="outline"
              className="ml-2 border-chart-2/30 bg-chart-2/10 px-1.5 py-0 text-[11px] font-normal text-chart-2"
            >
              {kpCount} 知识点
            </Badge>
          )}
          <div className="ml-1.5 flex items-center gap-1">
            {counts.map(({ kind, icon: Icon, count }) => (
              <span
                key={kind}
                title={`${SYNC_RESOURCE_LABELS[kind]} ${count}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  count > 0
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground/40",
                )}
              >
                <Icon className="size-3" />
                {count}
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary opacity-0 hover:text-primary group-hover:opacity-100"
              title="批量挂载资源"
              onClick={() => openMount(node.id)}
            >
              <Layers className="size-3.5" /> 批量挂载
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100"
              title="新增子节点"
              onClick={() => addChild(node.id)}
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive opacity-0 hover:text-destructive group-hover:opacity-100"
              title="删除"
              onClick={() => {
                removeChapter(node.id)
                toast.success("已删除节点及其子节点")
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {hasKids && isOpen && <div>{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          点击节点名称可重命名。悬停节点点「批量挂载」勾选挂入题目 / 作业 / 微课 / 空中课堂；查看与移出已挂载资源请到上方「已挂载资源」页。
        </p>
        <div className="flex items-center gap-2">
          <ChapterImportDialog textbookId={textbookId} />
          <Button variant="outline" size="sm" onClick={addRoot}>
            <Plus className="size-4" /> 新增章
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border p-2">
        {roots.length > 0 ? (
          roots.map((r) => renderNode(r, 0))
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            该教材还没有章节目录，点击「新增章」开始搭建。
          </div>
        )}
      </div>

      <BatchMountSheet
        textbookId={textbookId}
        chapterId={mountChapterId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
