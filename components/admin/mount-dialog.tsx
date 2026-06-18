"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Link2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { STAGE_LABELS, type Question } from "@/lib/types"

export function MountDialog({
  question,
  trigger,
}: {
  question: Question
  trigger: React.ReactNode
}) {
  const { textbooks, chapters, setQuestionMounts } = useStore()
  const [open, setOpen] = useState(false)
  const [mounts, setMounts] = useState(question.mounts)
  const [pendingTb, setPendingTb] = useState("")
  const [pendingChapter, setPendingChapter] = useState("")

  const tbChapters = chapters.filter((c) => c.textbookId === pendingTb)
  const tbItems = Object.fromEntries(
    textbooks.map((t) => [t.id, `${t.version} · ${t.subject} ${t.grade}（${t.year}）`]),
  )
  const chapterItems = Object.fromEntries(tbChapters.map((c) => [c.id, c.title]))

  function addMount() {
    if (!pendingTb || !pendingChapter) {
      toast.error("请选择教材和章节")
      return
    }
    if (mounts.some((m) => m.textbookId === pendingTb && m.chapterId === pendingChapter)) {
      toast.error("该章节已挂载")
      return
    }
    setMounts((prev) => [...prev, { textbookId: pendingTb, chapterId: pendingChapter }])
    setPendingChapter("")
  }

  function removeMount(idx: number) {
    setMounts((prev) => prev.filter((_, i) => i !== idx))
  }

  function save() {
    setQuestionMounts(question.id, mounts)
    toast.success(`已保存，本题挂载在 ${mounts.length} 个章节`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>挂载题目到教材章节</DialogTitle>
          <DialogDescription>
            一道题可同时挂载到多个教材的章节下。换教材时无需迁移，按需增减挂载即可。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/50 p-3 text-sm text-foreground/90">
          {question.stem}
        </div>

        {/* 已挂载列表 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            当前挂载（{mounts.length}）
          </p>
          {mounts.length === 0 && (
            <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              尚未挂载到任何教材
            </p>
          )}
          {mounts.map((m, idx) => {
            const tb = textbooks.find((t) => t.id === m.textbookId)
            const ch = chapters.find((c) => c.id === m.chapterId)
            return (
              <div
                key={`${m.textbookId}-${m.chapterId}`}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5"
              >
                <Link2 className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {tb?.version} · {tb?.subject}（{tb && STAGE_LABELS[tb.stage]} {tb?.grade}）
                    <span className="ml-1 text-xs text-muted-foreground">{tb?.year}年</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{ch?.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => removeMount(idx)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* 新增挂载 */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
          <div className="min-w-[180px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">选择教材</label>
            <Select
              value={pendingTb}
              items={tbItems}
              onValueChange={(v) => {
                setPendingTb(v)
                setPendingChapter("")
              }}
            >
              <SelectTrigger><SelectValue placeholder="教材" /></SelectTrigger>
              <SelectContent>
                {textbooks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.version} · {t.subject} {t.grade}（{t.year}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">选择章节</label>
            <Select value={pendingChapter} onValueChange={setPendingChapter} items={chapterItems} disabled={!pendingTb}>
              <SelectTrigger><SelectValue placeholder="章节" /></SelectTrigger>
              <SelectContent>
                {tbChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? "　" : ""}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={addMount}>
            <Plus className="size-4" /> 添加挂载
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={save}>保存挂载</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
