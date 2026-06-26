"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { OrgScopePicker } from "@/components/admin/org-scope-picker"
import { MathText } from "@/components/admin/math-text"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  QUESTION_TYPE_LABELS,
  type Difficulty,
  type QuestionType,
  type ResourceLevel,
} from "@/lib/types"

type Stage = "upload" | "parsing" | "review"

// 解析出的草稿题目（可逐题编辑）
interface DraftQuestion {
  id: string
  stem: string
  type: QuestionType
  difficulty: Difficulty
  answer: string
  analysis: string
  options?: { key: string; content: string }[]
}

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]

// 模拟读取 Excel 模板「题目数据」工作表解析出的题目（演示用）
function mockParse(subject: string): DraftQuestion[] {
  const rows: DraftQuestion[] = [
    {
      id: "d1",
      stem: "计算：$(-7) + (+3) - (-5) = $ ______",
      type: "fill",
      difficulty: 2,
      answer: "$1$",
      analysis: "原式 $= -7 + 3 + 5 = 1$。",
    },
    {
      id: "d2",
      stem: "下列各数中，绝对值最大的是（　　）",
      type: "single",
      difficulty: 2,
      answer: "D",
      analysis: "绝对值即到原点的距离，$|-4.5| = 4.5$ 最大。",
      options: [
        { key: "A", content: "$-1$" },
        { key: "B", content: "$2$" },
        { key: "C", content: "$-3$" },
        { key: "D", content: "$-4.5$" },
      ],
    },
    {
      id: "d3",
      stem: "判断：若 $a > 0$，则 $-a < 0$。（　　）",
      type: "judge",
      difficulty: 1,
      answer: "正确",
      analysis: "正数的相反数为负数。",
    },
    {
      id: "d4",
      stem: "已知 $|x| = 5$，求 $x$ 的值，并在数轴上表示。",
      type: "subjective",
      difficulty: 3,
      answer: "$x = 5$ 或 $x = -5$",
      analysis: "绝对值为 5 的数有两个，关于原点对称。",
    },
  ]
  return rows
}

export function FileImportDialog({
  open,
  onOpenChange,
  defaultSubject = "数学",
  textbookId,
  textbookName,
  chapterOptions = [],
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultSubject?: string
  textbookId?: string
  textbookName?: string
  chapterOptions?: { id: string; title: string }[]
}) {
  const { addQuestion } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>("upload")
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState(0)
  const [drafts, setDrafts] = useState<DraftQuestion[]>([])

  // 批量授权 + 章节挂载
  const [level, setLevel] = useState<ResourceLevel>("city")
  const [cityId, setCityId] = useState("")
  const [districtId, setDistrictId] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [ownerScope, setOwnerScope] = useState("")
  const [mountChapterId, setMountChapterId] = useState<string>("")

  function reset() {
    setStage("upload")
    setFileName("")
    setProgress(0)
    setDrafts([])
    setOwnerScope("")
    setCityId("")
    setDistrictId("")
    setSchoolId("")
    setMountChapterId("")
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setStage("parsing")
    setProgress(0)
    // 模拟解析进度
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setDrafts(mockParse(defaultSubject))
          setStage("review")
          return 100
        }
        return Math.min(100, p + 12 + Math.random() * 10)
      })
    }, 180)
  }

  function updateDraft(id: string, patch: Partial<DraftQuestion>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }
  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  function handleImport() {
    if (!ownerScope) return toast.error("请先完成市/区/校授权范围选择")
    if (drafts.length === 0) return toast.error("没有可导入的题目")

    const chapterMounts =
      textbookId && mountChapterId ? [{ textbookId, chapterId: mountChapterId }] : []

    drafts.forEach((d) => {
      addQuestion({
        subject: defaultSubject,
        type: d.type,
        difficulty: d.difficulty,
        stem: d.stem.trim(),
        options: d.type === "single" || d.type === "multiple" ? d.options : undefined,
        answer: d.answer.trim() || undefined,
        analysis: d.analysis.trim() || undefined,
        knowledgePointIds: [],
        level,
        ownerScope,
        chapterMounts,
      })
    })
    toast.success(`已导入 ${drafts.length} 道题目`, {
      description: `${ownerScope}${chapterMounts.length ? " · 已挂载章节" : ""}`,
    })
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-brand" />
            文件导入题目
          </DialogTitle>
          <DialogDescription>
            按固定 Excel 模板填写后上传，系统读取「题目数据」工作表，逐题确认后批量入库。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-5">
          {/* 步骤指示 */}
          <Stepper stage={stage} />

          {stage === "upload" && (
            <div className="mt-5 space-y-4">
              {/* 下载固定模板 */}
              <div className="flex items-center gap-3 rounded-lg border border-brand/30 bg-brand-soft/40 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">第一步：下载导入模板</p>
                  <p className="text-xs text-muted-foreground">
                    模板含「导入说明」与「题目数据」两个工作表，按列填写题目即可。
                  </p>
                </div>
                <a
                  href="/templates/question-import-template.xlsx"
                  download="题目导入模板.xlsx"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1")}
                >
                  <Download className="size-4" /> 下载模板
                </a>
              </div>

              {/* 上传已填写的模板 */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 py-12 transition hover:border-brand/50 hover:bg-brand-soft/30"
              >
                <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                  <UploadCloud className="size-6" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  第二步：上传已填写的模板，或拖拽到此处
                </span>
                <span className="text-xs text-muted-foreground">
                  仅支持 .xlsx / .xls，单文件不超过 10MB
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </button>
            </div>
          )}

          {stage === "parsing" && (
            <div className="mt-5 flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-8 animate-spin text-brand" />
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="size-4 text-muted-foreground" />
                正在读取「{fileName}」
              </div>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                正在读取「题目数据」工作表，校验题型、答案与难度…
              </span>
            </div>
          )}

          {stage === "review" && (
            <div className="mt-5 space-y-5">
              <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-sm text-brand-soft-foreground">
                <Check className="size-4" />
                已从「{fileName}」解析出 {drafts.length} 道题目，请逐题确认后导入。
              </div>

              {/* 批量授权 + 章节 */}
              <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">授权范围（应用到全部）</p>
                  <OrgScopePicker
                    level={level}
                    onLevelChange={setLevel}
                    cityId={cityId}
                    districtId={districtId}
                    schoolId={schoolId}
                    onChange={(n) => {
                      setCityId(n.cityId)
                      setDistrictId(n.districtId)
                      setSchoolId(n.schoolId)
                      setOwnerScope(n.ownerScope)
                    }}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">
                    章节挂载{textbookName ? `（${textbookName}）` : ""}
                  </p>
                  {textbookId && chapterOptions.length > 0 ? (
                    <div className="max-h-40 space-y-1 overflow-auto rounded-md border border-border bg-card p-1">
                      {chapterOptions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setMountChapterId((p) => (p === c.id ? "" : c.id))
                          }
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                            mountChapterId === c.id
                              ? "bg-brand-soft text-brand-soft-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "size-3.5 shrink-0 rounded-full border",
                              mountChapterId === c.id
                                ? "border-brand bg-brand"
                                : "border-muted-foreground/40",
                            )}
                          />
                          <span className="truncate">{c.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">无可用章节，可稍后在题库中挂载。</p>
                  )}
                </div>
              </div>

              {/* 逐题编辑 */}
              <div className="space-y-3">
                {drafts.map((d, i) => (
                  <DraftCard
                    key={d.id}
                    index={i + 1}
                    draft={d}
                    onChange={(patch) => updateDraft(d.id, patch)}
                    onRemove={() => removeDraft(d.id)}
                  />
                ))}
                {drafts.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    已移除全部题目。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <span className="text-xs text-muted-foreground">
            {stage === "review" ? `共 ${drafts.length} 道待导入` : "演示环境：上传后使用模板示例数据"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              取消
            </Button>
            {stage === "review" && (
              <Button onClick={handleImport} disabled={drafts.length === 0}>
                <Check className="size-4" /> 确认导入 {drafts.length} 道
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stepper({ stage }: { stage: Stage }) {
  const steps = [
    { key: "upload", label: "下载/上传模板" },
    { key: "parsing", label: "读取表格" },
    { key: "review", label: "确认入库" },
  ]
  const order = { upload: 0, parsing: 1, review: 2 }[stage]
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = i === order
        const done = i < order
        return (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full text-xs font-semibold transition",
                done
                  ? "bg-brand text-brand-foreground"
                  : active
                    ? "bg-brand-soft text-brand-soft-foreground ring-2 ring-brand/40"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                active || done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-border" />}
          </div>
        )
      })}
    </div>
  )
}

function DraftCard({
  index,
  draft,
  onChange,
  onRemove,
}: {
  index: number
  draft: DraftQuestion
  onChange: (patch: Partial<DraftQuestion>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const isChoice = draft.type === "single" || draft.type === "multiple"
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1 text-sm font-semibold text-muted-foreground">{index}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {QUESTION_TYPE_LABELS[draft.type]}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              难度 {draft.difficulty}
            </span>
          </div>
          <div className="text-sm text-foreground">
            <MathText>{draft.stem}</MathText>
          </div>
          {isChoice && draft.options && (
            <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
              {draft.options.map((o) => (
                <div key={o.key} className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold">{o.key}.</span>
                  <MathText>{o.content}</MathText>
                </div>
              ))}
            </div>
          )}
          {!open && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              答案：<MathText>{draft.answer}</MathText>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
          >
            {open ? "收起" : "编辑"}
          </button>
          <button
            onClick={onRemove}
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="移除"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2.5 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.type}
              onChange={(e) => onChange({ type: e.target.value as QuestionType })}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={String(draft.difficulty)}
              onChange={(e) => onChange({ difficulty: Number(e.target.value) as Difficulty })}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  难度 {d}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            value={draft.stem}
            onChange={(e) => onChange({ stem: e.target.value })}
            className="min-h-16 text-sm"
            placeholder="题干"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={draft.answer}
              onChange={(e) => onChange({ answer: e.target.value })}
              placeholder="答案"
            />
          </div>
          <Textarea
            value={draft.analysis}
            onChange={(e) => onChange({ analysis: e.target.value })}
            className="min-h-12 text-sm"
            placeholder="解析"
          />
        </div>
      )}
    </div>
  )
}
