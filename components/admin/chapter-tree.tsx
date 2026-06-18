"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  FileStack,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import type { ChapterNode } from "@/lib/types"

export function ChapterTree({ textbookId }: { textbookId: string }) {
  const { chapters, addChapter, updateChapter, removeChapter, countQuestionsByChapter } =
    useStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

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
    const count = countQuestionsByChapter(node.id)

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

          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] tabular-nums text-accent-foreground">
            <FileStack className="size-3" />
            {count}
          </span>

          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="新增子节点"
              onClick={() => addChild(node.id)}
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
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
          点击节点名称可重命名，悬停显示新增 / 删除操作。徽标为该节点已挂载题目数。
        </p>
        <Button variant="outline" size="sm" onClick={addRoot}>
          <Plus className="size-4" /> 新增章
        </Button>
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
    </div>
  )
}
