"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  GripVertical,
  ImageIcon,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SUBJECTS } from "@/lib/mock-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrgScopePicker } from "@/components/admin/org-scope-picker"
import { FileImportDialog, type FileImportResult } from "@/components/admin/file-import-dialog"
import {
  ORG_TREE,
  QUESTION_TYPE_LABELS,
  premiumQuestionCount,
  premiumVideoCount,
  type PremiumOption,
  type PremiumQuestion,
  type PremiumVideo,
  type QuestionType,
  type ResourceLevel,
} from "@/lib/types"

let _uid = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${_uid++}`

// 题型是否为选择题（用选项编辑器）
const isChoice = (t: QuestionType) => t === "single" || t === "multiple"

// 由归属名称反查级联 id（编辑已有资源时回填 OrgScopePicker）
function findScopeIds(level: ResourceLevel, ownerScope?: string) {
  let cityId = ""
  let districtId = ""
  let schoolId = ""
  if (!ownerScope) return { cityId, districtId, schoolId }
  for (const c of ORG_TREE) {
    if (c.name === ownerScope) return { cityId: c.id, districtId: "", schoolId: "" }
    for (const d of c.districts) {
      if (d.name === ownerScope) return { cityId: c.id, districtId: d.id, schoolId: "" }
      for (const s of d.schools) {
        if (s.name === ownerScope) return { cityId: c.id, districtId: d.id, schoolId: s.id }
      }
    }
  }
  return { cityId, districtId, schoolId }
}

export function TopicEditor({ id }: { id: string }) {
  const router = useRouter()
  const { premiums, textbooks, chapters, createPremium, updatePremium } = useStore()
  const isNew = id === "new"
  const existing = isNew ? undefined : premiums.find((p) => p.id === id)

  // —— 元信息 ——
  const [title, setTitle] = useState(existing?.title ?? "")
  const [subject, setSubject] = useState(existing?.subject ?? "数学")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [level, setLevel] = useState<ResourceLevel>(existing?.level ?? "city")
  const initIds = findScopeIds(existing?.level ?? "city", existing?.ownerScope)
  const [cityId, setCityId] = useState(initIds.cityId)
  const [districtId, setDistrictId] = useState(initIds.districtId)
  const [schoolId, setSchoolId] = useState(initIds.schoolId)
  const [ownerScope, setOwnerScope] = useState(existing?.ownerScope ?? "")
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "")

  // —— 教材章节挂载（可选，单个）——
  const initMount = existing?.chapterMounts?.[0]
  const [mountTextbookId, setMountTextbookId] = useState(initMount?.textbookId ?? "")
  const [mountChapterId, setMountChapterId] = useState(initMount?.chapterId ?? "")

  // —— 题目列表（扁平）——
  const [items, setItems] = useState<PremiumQuestion[]>(existing?.items ?? [])
  const [importOpen, setImportOpen] = useState(false)

  const mountLeafChapters = useMemo(
    () =>
      chapters
        .filter(
          (c) => c.textbookId === mountTextbookId && !chapters.some((x) => x.parentId === c.id),
        )
        .map((c) => ({ id: c.id, title: c.title })),
    [chapters, mountTextbookId],
  )

  if (!isNew && !existing) {
    return (
      <div className="space-y-4">
        <Link href="/resources/premium" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
          <ArrowLeft className="size-4" /> 返回精品资源
        </Link>
        <p className="text-sm text-muted-foreground">未找到该精品资源，可能已被删除。</p>
      </div>
    )
  }

  // —— 题目操作 ——
  const addQuestion = () =>
    setItems((prev) => [
      ...prev,
      {
        id: uid("q"),
        qType: "single",
        label: String(prev.length + 1),
        stem: "",
        options: [
          { id: uid("o"), text: "", correct: true },
          { id: uid("o"), text: "", correct: false },
        ],
      },
    ])
  const patchQuestion = (qid: string, patch: Partial<PremiumQuestion>) =>
    setItems((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)))
  const removeQuestion = (qid: string) => setItems((prev) => prev.filter((q) => q.id !== qid))
  const moveQuestion = (qid: string, dir: "up" | "down") =>
    setItems((prev) => {
      const i = prev.findIndex((q) => q.id === qid)
      const j = dir === "up" ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  function handleImport(result: FileImportResult) {
    const imported: PremiumQuestion[] = result.questions.map((q, i) => ({
      id: uid("q"),
      qType: q.type,
      label: String(items.length + i + 1),
      stem: q.stem,
      options: q.options?.map((o) => ({ id: uid("o"), text: o.content, correct: false })),
      answer: q.answer || undefined,
      analysis: q.analysis || undefined,
    }))
    setItems((prev) => [...prev, ...imported])
    toast.success(`已导入 ${imported.length} 道题目`)
  }

  function save() {
    if (!title.trim()) {
      toast.error("请填写标题")
      return
    }
    if (level !== "city" && !ownerScope) {
      toast.error("请选择完整的授权归属")
      return
    }
    const chapterMounts =
      mountTextbookId && mountChapterId
        ? [{ textbookId: mountTextbookId, chapterId: mountChapterId }]
        : []
    const payload = {
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      level,
      ownerScope: ownerScope || undefined,
      items,
      knowledgePointIds: existing?.knowledgePointIds ?? [],
      chapterMounts,
      coverImage: coverImage || undefined,
    }
    if (isNew) {
      const newId = createPremium(payload)
      toast.success("精品资源已创建")
      router.replace(`/resources/premium/topics/${newId}`)
    } else {
      updatePremium(id, payload)
      toast.success("精品资源已保存")
    }
  }

  const qCount = premiumQuestionCount({ items })
  const vCount = premiumVideoCount({ items })

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <Link
          href="/resources/premium"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="size-4" /> 返回
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {isNew ? "新建精品资源" : title || "编辑精品资源"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {qCount} 题 · {vCount} 视频
          </p>
        </div>
        <Button onClick={save} className="gap-1.5">
          保存
        </Button>
      </div>

      {/* 元信息 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">基本信息</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="标题">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：有理数单元精品卷" />
          </Field>
          <Field label="学科">
            <Select value={subject} onValueChange={(v) => setSubject(v ?? "数学")} items={Object.fromEntries(SUBJECTS.map((s) => [s, s]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="简介">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话描述这份精品资源的内容"
            rows={2}
          />
        </Field>
        <Field label="授权范围">
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
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="挂载教材（可选）">
            <Select
              value={mountTextbookId || "none"}
              onValueChange={(v) => {
                setMountTextbookId(v === "none" ? "" : (v ?? ""))
                setMountChapterId("")
              }}
              items={{ none: "不挂载", ...Object.fromEntries(textbooks.map((t) => [t.id, t.name])) }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不挂载</SelectItem>
                {textbooks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="挂载章节">
            <Select
              value={mountChapterId || "none"}
              onValueChange={(v) => setMountChapterId(v === "none" ? "" : (v ?? ""))}
              items={{ none: "不挂载", ...Object.fromEntries(mountLeafChapters.map((c) => [c.id, c.title])) }}
              disabled={!mountTextbookId}
            >
              <SelectTrigger><SelectValue placeholder={mountTextbookId ? "选择章节" : "请先选教材"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不挂载</SelectItem>
                {mountLeafChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="封面图">
          <CoverUploader value={coverImage} onChange={setCoverImage} />
        </Field>
      </section>

      {/* 题目列表 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand" />
          <h2 className="text-sm font-semibold text-foreground">题目（{items.length}）</h2>
          <Button variant="outline" size="sm" className="ml-auto gap-1" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="size-3.5" /> 文件导入
          </Button>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            暂无题目，点击下方「添加题目」或「文件导入」批量导入。
          </p>
        )}

        <div className="space-y-3">
          {items.map((q, i) => (
            <QuestionRow
              key={q.id}
              q={q}
              index={i}
              total={items.length}
              onPatch={(patch) => patchQuestion(q.id, patch)}
              onRemove={() => removeQuestion(q.id)}
              onMove={(dir) => moveQuestion(q.id, dir)}
            />
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition hover:border-brand/50 hover:text-brand"
        >
          <Plus className="size-4" /> 添加题目
        </button>
      </section>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultSubject={subject}
        onImport={handleImport}
        title="导入题目到该资源"
        description="上传固定 Excel 模板，逐题确认后追加到当前精品资源的题目列表。"
        importLabel="追加导入"
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

// 封面图模拟上传：选图后用本地 object URL 预览
function CoverUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            onChange(URL.createObjectURL(f))
            toast.success("封面已上传", { description: f.name })
          }
        }}
      />
      {value ? (
        <div className="relative size-16 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value || "/placeholder.svg"} alt="封面" className="size-full object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-background/90 text-muted-foreground hover:text-destructive"
            aria-label="移除封面"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid size-16 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
          <ImageIcon className="size-5" />
        </div>
      )}
      <button
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
      >
        <Upload className="size-3.5" /> {value ? "更换封面" : "上传封面"}
      </button>
    </div>
  )
}

function QuestionRow({
  q,
  index,
  total,
  onPatch,
  onRemove,
  onMove,
}: {
  q: PremiumQuestion
  index: number
  total: number
  onPatch: (patch: Partial<PremiumQuestion>) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <GripVertical className="size-3.5 text-muted-foreground" />
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-soft-foreground">
          第 {index + 1} 题
        </span>
        <Input
          value={q.label ?? ""}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="编号 如 1 / 例1"
          className="h-7 w-24 text-xs"
        />
        <Select
          value={q.qType}
          onValueChange={(v) => onPatch({ qType: (v ?? "single") as QuestionType })}
          items={QUESTION_TYPE_LABELS}
        >
          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
              <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="上移" disabled={index === 0} onClick={() => onMove("up")}>
            <ChevronUp className="size-4" />
          </IconBtn>
          <IconBtn label="下移" disabled={index === total - 1} onClick={() => onMove("down")}>
            <ChevronDown className="size-4" />
          </IconBtn>
          <IconBtn label="删除" danger onClick={onRemove}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      <div className="space-y-2">
        <LabeledMini label="题干">
          <Textarea
            value={q.stem}
            onChange={(e) => onPatch({ stem: e.target.value })}
            placeholder="输入题干"
            rows={2}
          />
        </LabeledMini>

        {/* 按题型动态：选择题→选项编辑器；判断题→对/错；填空/解答→文本答案 */}
        {isChoice(q.qType) ? (
          <OptionsEditor
            qType={q.qType}
            options={q.options ?? []}
            onChange={(options) => onPatch({ options })}
          />
        ) : q.qType === "judge" ? (
          <LabeledMini label="正确答案">
            <div className="flex gap-2">
              {["对", "错"].map((v) => (
                <button
                  key={v}
                  onClick={() => onPatch({ answer: v })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm transition",
                    q.answer === v
                      ? "border-brand bg-brand-soft text-brand-soft-foreground"
                      : "border-border text-foreground hover:bg-muted",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </LabeledMini>
        ) : (
          <LabeledMini label="参考答案">
            <Input
              value={q.answer ?? ""}
              onChange={(e) => onPatch({ answer: e.target.value })}
              placeholder={q.qType === "fill" ? "填空答案" : "解答要点"}
              className="h-8 text-sm"
            />
          </LabeledMini>
        )}

        <LabeledMini label="解析（可选）">
          <Textarea
            value={q.analysis ?? ""}
            onChange={(e) => onPatch({ analysis: e.target.value })}
            placeholder="解题过程"
            rows={2}
          />
        </LabeledMini>

        {/* 视频讲解：模拟上传 */}
        <div className="rounded-md border border-dashed border-border p-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Video className="size-3.5 text-brand" /> 视频讲解
          </div>
          <div className="grid gap-2 sm:grid-cols-[120px_90px]">
            <Input
              value={q.video?.title ?? ""}
              onChange={(e) => onPatch({ video: { ...q.video, title: e.target.value } })}
              placeholder="标题 如 视频1"
              className="h-8 text-sm"
            />
            <Input
              value={q.video?.duration ?? ""}
              onChange={(e) => onPatch({ video: { ...q.video, duration: e.target.value } })}
              placeholder="时长"
              className="h-8 text-sm"
            />
          </div>
          <div className="mt-2">
            <VideoUploader video={q.video} onChange={(video) => onPatch({ video })} />
          </div>
        </div>
      </div>
    </div>
  )
}

// 选项编辑器：单选用单个正确项，多选可多个正确项
function OptionsEditor({
  qType,
  options,
  onChange,
}: {
  qType: QuestionType
  options: PremiumOption[]
  onChange: (opts: PremiumOption[]) => void
}) {
  const setCorrect = (oid: string) => {
    if (qType === "single") {
      onChange(options.map((o) => ({ ...o, correct: o.id === oid })))
    } else {
      onChange(options.map((o) => (o.id === oid ? { ...o, correct: !o.correct } : o)))
    }
  }
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-muted-foreground">
        选项（点击左侧标记正确答案{qType === "multiple" ? "，可多选" : ""}）
      </span>
      {options.map((o, i) => (
        <div key={o.id} className="flex items-center gap-2">
          <button
            onClick={() => setCorrect(o.id)}
            aria-label="标记正确"
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md border text-xs font-medium transition",
              o.correct
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {o.correct ? <Check className="size-4" /> : String.fromCharCode(65 + i)}
          </button>
          <Input
            value={o.text}
            onChange={(e) => onChange(options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)))}
            placeholder={`选项 ${String.fromCharCode(65 + i)}`}
            className="h-8 text-sm"
          />
          <IconBtn
            label="删除选项"
            danger
            disabled={options.length <= 2}
            onClick={() => onChange(options.filter((x) => x.id !== o.id))}
          >
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      ))}
      <button
        onClick={() => onChange([...options, { id: uid("o"), text: "", correct: false }])}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand transition hover:bg-brand-soft"
      >
        <Plus className="size-3.5" /> 添加选项
      </button>
    </div>
  )
}

// 视频模拟上传：选文件后用本地 object URL，记录文件名
function VideoUploader({
  video,
  onChange,
}: {
  video?: PremiumVideo
  onChange: (v: PremiumVideo) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const hasFile = !!video?.url
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            onChange({ ...video, url: URL.createObjectURL(f), fileName: f.name })
            toast.success("视频已上传", { description: f.name })
          }
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
      >
        <Upload className="size-3.5 text-brand" /> {hasFile ? "更换视频" : "上传视频"}
      </button>
      {hasFile && (
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <Video className="size-3.5 shrink-0 text-brand" />
          <span className="truncate">{video?.fileName ?? video?.url}</span>
          <button
            onClick={() => onChange({ ...video, url: undefined, fileName: undefined })}
            aria-label="移除视频"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </span>
      )}
    </div>
  )
}

function LabeledMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition disabled:opacity-30",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
