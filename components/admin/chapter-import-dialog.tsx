"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Download, FileUp, Upload } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

// 模板内容：第一列层级（1 章 / 2 节 / 3 子目），第二列标题
const TEMPLATE_ROWS = [
  ["层级", "目录名称"],
  ["1", "第一章 有理数"],
  ["2", "1.1 正数和负数"],
  ["2", "1.2 有理数"],
  ["3", "1.2.1 有理数的概念"],
  ["1", "第二章 整式的加减"],
  ["2", "2.1 整式"],
]

interface ParsedRow {
  level: number
  title: string
  valid: boolean
}

function parseText(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // 支持逗号 / 制表符 / 中文逗号分隔
      const parts = line.split(/[,\t，]/).map((p) => p.trim())
      const level = Number(parts[0])
      const title = parts.slice(1).join(" ").trim()
      const valid = [1, 2, 3].includes(level) && title.length > 0
      return { level: valid ? level : 1, title, valid }
    })
    // 跳过表头行
    .filter((r) => !(r.title === "目录名称" || r.title === ""))
}

export function ChapterImportDialog({ textbookId }: { textbookId: string }) {
  const { importChapters } = useStore()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [replace, setReplace] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseText(text), [text])
  const validRows = parsed.filter((r) => r.valid)
  const invalidCount = parsed.length - validRows.length

  function downloadTemplate() {
    const csv = TEMPLATE_ROWS.map((r) => r.join(",")).join("\n")
    // 加 BOM 让 Excel 正确识别中文
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "章节目录导入模板.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("模板已下载")
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setText(reader.result as string)
    reader.readAsText(file, "utf-8")
  }

  function handleImport() {
    if (validRows.length === 0) {
      toast.error("没有可导入的有效目录，请检查格式")
      return
    }
    const n = importChapters(
      textbookId,
      validRows.map((r) => ({ level: r.level, title: r.title })),
      replace,
    )
    toast.success(`已导入 ${n} 个目录节点`, {
      description: replace ? "原目录已被替换" : "已追加到现有目录",
    })
    setOpen(false)
    setText("")
    setReplace(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Upload className="size-4" /> 导入目录
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入章节目录</DialogTitle>
          <DialogDescription>
            按模板格式填写：每行一个目录，第一列为层级（1 章 / 2 节 / 3 子目），第二列为目录名称。可粘贴文本或上传 CSV 文件。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="size-4" /> 下载导入模板
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFile}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" /> 上传 CSV 文件
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">
              目录内容（每行：层级,目录名称）
            </Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"1,第一章 有理数\n2,1.1 正数和负数\n2,1.2 有理数\n3,1.2.1 有理数的概念"}
              className="min-h-40 font-mono text-sm"
            />
          </div>

          {parsed.length > 0 && (
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">预览</span>
                <span className="text-muted-foreground">
                  有效 <span className="text-foreground tabular-nums">{validRows.length}</span> 条
                  {invalidCount > 0 && (
                    <span className="ml-2 text-destructive">忽略 {invalidCount} 条</span>
                  )}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto p-2">
                {parsed.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1 text-sm",
                      !r.valid && "opacity-50",
                    )}
                    style={{ paddingLeft: (r.level - 1) * 16 + 8 }}
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] tabular-nums",
                        r.level === 1
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.level}
                    </span>
                    <span className={cn(r.level === 1 && "font-medium")}>
                      {r.title || "（空标题，已忽略）"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="replace"
              checked={replace}
              onCheckedChange={(v) => setReplace(v === true)}
            />
            <Label htmlFor="replace" className="text-sm font-normal">
              替换现有目录（勾选后将清空本教材原有目录再导入）
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={validRows.length === 0}>
            导入 {validRows.length > 0 && `（${validRows.length}）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
