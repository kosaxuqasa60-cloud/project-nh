"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SUBJECTS } from "@/lib/mock-data"
import { useStore } from "@/lib/store"
import {
  COGNITIVE_OPTIONS,
  LITERACY_OPTIONS,
  PREMIUM_CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
  RESOURCE_KIND_LABELS,
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  SCENE_OPTIONS,
  SCOPE_OPTIONS,
  USAGE_OPTIONS,
  type AirClass,
  type Assignment,
  type Difficulty,
  type Microlesson,
  type Premium,
  type PremiumCategory,
  type Question,
  type QuestionType,
  type ResourceKind,
  type ResourceLevel,
} from "@/lib/types"

type AnyResource = Question | Assignment | Microlesson | AirClass | Premium

const DIFFICULTY_ITEMS: Record<string, string> = {
  "1": "①  入门",
  "2": "②  基础",
  "3": "③  中等",
  "4": "④  较难",
  "5": "⑤  难",
}

export function ResourceFormDialog({
  kind,
  open,
  onOpenChange,
  editing,
}: {
  kind: ResourceKind
  open: boolean
  onOpenChange: (v: boolean) => void
  editing?: AnyResource | null
}) {
  const {
    addQuestion,
    addAssignment,
    addMicrolesson,
    addAirClass,
    addPremium,
    updateResource,
    saveQuestionAsNewVersion,
    knowledgePoints,
    questions,
  } = useStore()
  const isEdit = Boolean(editing)
  const e = editing as
    | (Partial<Question> & Partial<Assignment> & Partial<Microlesson> & Partial<AirClass> & Partial<Premium>)
    | undefined

  // 共享字段
  const [subject, setSubject] = useState(e?.subject ?? "数学")
  const [level, setLevel] = useState<ResourceLevel>(e?.level ?? "school")
  const [ownerScope, setOwnerScope] = useState<string>(e?.ownerScope ?? "")
  const [kpIds, setKpIds] = useState<string[]>(e?.knowledgePointIds ?? [])

  // 题目字段
  const [stem, setStem] = useState(e?.stem ?? "")
  const [qType, setQType] = useState<QuestionType>(e?.type ?? "single")
  const [difficulty, setDifficulty] = useState<Difficulty>(e?.difficulty ?? 2)
  const [answer, setAnswer] = useState(e?.answer ?? "")
  const [analysis, setAnalysis] = useState(e?.analysis ?? "")
  // 题目标注体系（对齐教师端）
  const [literacy, setLiteracy] = useState<string[]>(e?.literacy ?? [])
  const [cognitive, setCognitive] = useState<string>(e?.cognitive ?? "")
  const [usage, setUsage] = useState<string[]>(e?.usage ?? [])
  const [scene, setScene] = useState<string>(e?.scene ?? "")
  const [teachTags, setTeachTags] = useState<string[]>(e?.teachTags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [videoTitle, setVideoTitle] = useState(e?.videoTitle ?? "")
  const [videoDuration, setVideoDuration] = useState(e?.videoDuration ?? "")

  // 作业 / 微课 / 空中课堂 通用标题
  const [title, setTitle] = useState(e?.title ?? "")
  // 作业
  const [questionIds, setQuestionIds] = useState<string[]>(e?.questionIds ?? [])
  // 微课
  const [duration, setDuration] = useState(e?.duration ?? "")
  const [videoUrl, setVideoUrl] = useState(e?.videoUrl ?? "")
  // 空中课堂
  const [teacher, setTeacher] = useState(e?.teacher ?? "")
  const [scheduledAt, setScheduledAt] = useState(e?.scheduledAt ?? "")
  const [liveUrl, setLiveUrl] = useState(e?.liveUrl ?? "")
  // 精品资源
  const [category, setCategory] = useState<PremiumCategory>(e?.category ?? "paper")
  const [description, setDescription] = useState(e?.description ?? "")

  // 题目版本：另存为新版本的确认弹窗 + 修订说明
  const [versionPromptOpen, setVersionPromptOpen] = useState(false)
  const [changeNote, setChangeNote] = useState("")

  const kindLabel = RESOURCE_KIND_LABELS[kind]

  // 编辑题目时，该题是否已有学生作答数据（有则内容改动需另存为新版本）
  const editingQuestion = isEdit && kind === "question" ? (editing as Question) : null
  const hasStudentData = (editingQuestion?.studentCount ?? 0) > 0
  // 内容字段（题干/题型/选项/答案/解析）是否相对当前版本发生变化（难度算元数据，不计入）
  const contentChanged =
    !!editingQuestion &&
    (stem.trim() !== (editingQuestion.stem ?? "") ||
      qType !== editingQuestion.type ||
      (answer ?? "") !== (editingQuestion.answer ?? "") ||
      (analysis ?? "") !== (editingQuestion.analysis ?? ""))

  // 知识点随学科联动
  const subjectKps = useMemo(
    () => knowledgePoints.filter((k) => k.subject === subject),
    [knowledgePoints, subject],
  )
  // 作业可选题目：同学科题库
  const subjectQuestions = useMemo(
    () => questions.filter((q) => q.subject === subject),
    [questions, subject],
  )

  const toggleKp = (id: string) =>
    setKpIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const toggleQ = (id: string) =>
    setQuestionIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  function handleSubmit() {
    // 校验
    if (kind === "question" && !stem.trim()) return toast.error("请填写题干")
    if (kind !== "question" && !title.trim()) return toast.error(`请填写${kindLabel}标题`)
    if (kind === "airclass" && !teacher.trim()) return toast.error("请填写主讲教师")
    if (!ownerScope) return toast.error("请选择归属（市/区/校）")

    const base = {
      subject,
      level,
      ownerScope,
      knowledgePointIds: kpIds,
    }

    const questionExtra = {
      literacy,
      cognitive: cognitive || undefined,
      usage,
      scene: scene || undefined,
      teachTags,
      videoTitle: videoTitle || undefined,
      videoDuration: videoDuration || undefined,
    }

    if (isEdit && editing) {
      // 题目：有学生作答数据 + 改了内容字段 → 弹窗引导另存为新版本（保护历史统计）
      if (kind === "question" && hasStudentData && contentChanged) {
        // 先把族级元数据（难度/标注/授权/知识点）就地保存，内容改动交给新版本流程
        updateResource("question", editing.id, {
          ...base,
          difficulty,
          ...questionExtra,
        })
        setVersionPromptOpen(true)
        return
      }
      const patch: Record<string, unknown> = { ...base }
      if (kind === "question")
        Object.assign(patch, {
          stem: stem.trim(),
          type: qType,
          difficulty,
          answer,
          analysis,
          ...questionExtra,
        })
      else if (kind === "assignment") Object.assign(patch, { title: title.trim(), questionIds })
      else if (kind === "microlesson")
        Object.assign(patch, { title: title.trim(), duration, videoUrl })
      else if (kind === "premium")
        Object.assign(patch, { title: title.trim(), category, description, questionIds })
      else Object.assign(patch, { title: title.trim(), teacher, scheduledAt, liveUrl })
      updateResource(kind, editing.id, patch)
      toast.success(`${kindLabel}已更新`)
    } else {
      if (kind === "question")
        addQuestion({
          ...base,
          stem: stem.trim(),
          type: qType,
          difficulty,
          answer,
          analysis,
          ...questionExtra,
        })
      else if (kind === "assignment")
        addAssignment({ ...base, title: title.trim(), questionIds })
      else if (kind === "microlesson")
        addMicrolesson({ ...base, title: title.trim(), grade: "七年级", duration: duration || "00:00", videoUrl })
      else if (kind === "premium")
        addPremium({ ...base, title: title.trim(), category, description, questionIds })
      else addAirClass({ ...base, title: title.trim(), teacher, scheduledAt, liveUrl })
      toast.success(`已创建${kindLabel}`, { description: "资源已入库，可在教材章节中挂载使用" })
    }
    onOpenChange(false)
  }

  // 确认另存为新版本：旧版本归档保留统计，新版本成为当前生效版本
  function handleConfirmNewVersion() {
    if (!editingQuestion) return
    saveQuestionAsNewVersion(
      editingQuestion.id,
      {
        stem: stem.trim(),
        type: qType,
        options: editingQuestion.options,
        answer,
        analysis,
      },
      changeNote.trim(),
    )
    const nextV = editingQuestion.version + 1
    toast.success(`已保存为新版本 v${nextV}`, {
      description: "原版本已归档并保留历史统计，引用旧版本的作业/试卷不受影响",
    })
    setVersionPromptOpen(false)
    onOpenChange(false)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {isEdit ? "编辑" : "新建"}
            {kindLabel}
          </DialogTitle>
          <DialogDescription>
            录入{kindLabel}内容并设置学科、知识点与级别归属。资源创建后进入资源库，再在教材章节中挂载。
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* 内容区：按类型差异化 */}
          {kind === "question" ? (
            <div className="space-y-4">
              <Field label="题干" required>
                <Textarea
                  value={stem}
                  onChange={(ev) => setStem(ev.target.value)}
                  placeholder="输入题干，如：下列各数中，是负数的是（　）。"
                  className="min-h-24"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="题型">
                  <Select value={qType} onValueChange={(v) => setQType(v as QuestionType)} items={QUESTION_TYPE_LABELS}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                        <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="难度">
                  <Select value={String(difficulty)} onValueChange={(v) => setDifficulty(Number(v) as Difficulty)} items={DIFFICULTY_ITEMS}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIFFICULTY_ITEMS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="答案">
                <Input value={answer} onChange={(ev) => setAnswer(ev.target.value)} placeholder="如：A 或 x = 12" />
              </Field>
              <Field label="解析">
                <Textarea
                  value={analysis}
                  onChange={(ev) => setAnalysis(ev.target.value)}
                  placeholder="可选：解题思路与步骤。支持 $...$ 公式"
                  className="min-h-16"
                />
              </Field>

              {/* 讲解视频 */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="讲解视频标题">
                  <Input
                    value={videoTitle}
                    onChange={(ev) => setVideoTitle(ev.target.value)}
                    placeholder="可选，如：认识负数与相反数"
                  />
                </Field>
                <Field label="视频时长">
                  <Input
                    value={videoDuration}
                    onChange={(ev) => setVideoDuration(ev.target.value)}
                    placeholder="如 06:12"
                  />
                </Field>
              </div>

              {/* 系统标注体系 */}
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-foreground">系统标注</p>
                <Field label={`核心素养（已选 ${literacy.length}）`}>
                  <TagPicker options={LITERACY_OPTIONS} value={literacy} onChange={setLiteracy} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="认知层级">
                    <Select
                      value={cognitive}
                      onValueChange={setCognitive}
                      items={Object.fromEntries(COGNITIVE_OPTIONS.map((o) => [o, o]))}
                    >
                      <SelectTrigger><SelectValue placeholder="选择认知层级" /></SelectTrigger>
                      <SelectContent>
                        {COGNITIVE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="情景属性">
                    <Select
                      value={scene}
                      onValueChange={setScene}
                      items={Object.fromEntries(SCENE_OPTIONS.map((o) => [o, o]))}
                    >
                      <SelectTrigger><SelectValue placeholder="选择情景属性" /></SelectTrigger>
                      <SelectContent>
                        {SCENE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={`教学用途（已选 ${usage.length}）`}>
                  <TagPicker options={USAGE_OPTIONS} value={usage} onChange={setUsage} />
                </Field>
                <Field label="教学标签">
                  <div className="flex flex-wrap gap-1.5">
                    {teachTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTeachTags((p) => p.filter((x) => x !== t))}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs text-brand-soft-foreground"
                      >
                        {t}
                        <span className="text-brand-soft-foreground/60">×</span>
                      </button>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(ev) => setTagInput(ev.target.value)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" && tagInput.trim()) {
                          ev.preventDefault()
                          const v = tagInput.trim()
                          setTeachTags((p) => (p.includes(v) ? p : [...p, v]))
                          setTagInput("")
                        }
                      }}
                      placeholder="输入后回车添加"
                      className="min-w-32 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </Field>
              </div>
            </div>
          ) : (
            <Field label={`${kindLabel}标题`} required>
              <Input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder={`输入${kindLabel}标题`} />
            </Field>
          )}

          {kind === "microlesson" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="时长">
                <Input value={duration} onChange={(ev) => setDuration(ev.target.value)} placeholder="如 08:30" />
              </Field>
              <Field label="视频地址">
                <Input value={videoUrl} onChange={(ev) => setVideoUrl(ev.target.value)} placeholder="https://" />
              </Field>
            </div>
          )}

          {kind === "airclass" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="主���教师" required>
                <Input value={teacher} onChange={(ev) => setTeacher(ev.target.value)} placeholder="如 王明老师" />
              </Field>
              <Field label="直播时间">
                <Input value={scheduledAt} onChange={(ev) => setScheduledAt(ev.target.value)} placeholder="如 2026-06-25 19:00" />
              </Field>
              <Field label="直播链接">
                <Input value={liveUrl} onChange={(ev) => setLiveUrl(ev.target.value)} placeholder="https://" />
              </Field>
            </div>
          )}

          {kind === "premium" && (
            <>
              <Field label="精品分类">
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as PremiumCategory)}
                  items={PREMIUM_CATEGORY_LABELS}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PREMIUM_CATEGORY_LABELS) as PremiumCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{PREMIUM_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="简介">
                <Textarea
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  placeholder="可选：精品资源简介与适用说明"
                  className="min-h-16"
                />
              </Field>
            </>
          )}

          {/* 学科 + 级别 + 归属 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="学科">
              <Select
                value={subject}
                onValueChange={(v) => {
                  setSubject(v)
                  setKpIds([])
                  setQuestionIds([])
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="级别">
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v as ResourceLevel)
                  setOwnerScope("")
                }}
                items={RESOURCE_LEVEL_LABELS}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{RESOURCE_LEVEL_LABELS[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="归属" required>
            <Select value={ownerScope} onValueChange={setOwnerScope}>
              <SelectTrigger><SelectValue placeholder={`选择${RESOURCE_LEVEL_LABELS[level]}归属`} /></SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS[level].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* 知识点（随学科联动） */}
          <Field label={`知识点（已选 ${kpIds.length}）`}>
            {subjectKps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subjectKps.map((k) => {
                  const checked = kpIds.includes(k.id)
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKp(k.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {k.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">该学科暂无知识点。</p>
            )}
          </Field>

          {/* 作业 / 精品：从题库选题组卷 */}
          {(kind === "assignment" || kind === "premium") && (
            <Field label={`组卷选题（已选 ${questionIds.length} 道，来自${subject}题库）`}>
              <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
                {subjectQuestions.map((q) => {
                  const checked = questionIds.includes(q.id)
                  return (
                    <label
                      key={q.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm transition-colors",
                        checked ? "bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleQ(q.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1 leading-snug text-foreground/90">{q.stem}</span>
                      <Badge variant="secondary" className="shrink-0 font-normal">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </Badge>
                    </label>
                  )
                })}
                {subjectQuestions.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {subject}题库暂无题目，请先到「题目」中创建。
                  </p>
                )}
              </div>
            </Field>
          )}
        </div>

        {editingQuestion && hasStudentData && contentChanged && (
          <div className="mx-6 mb-1 rounded-md border border-medium/30 bg-medium/10 px-3 py-2 text-xs text-foreground/80">
            该题已有 {editingQuestion.studentCount} 名学生作答记录，修改题目内容将引导你
            <span className="font-medium text-foreground">另存为新版本</span>
            （原版本归档保留统计，难度/标注等可直接改）。
          </div>
        )}
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {!isEdit
              ? `创建${kindLabel}`
              : editingQuestion && hasStudentData && contentChanged
                ? "另存为新版本…"
                : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 另存为新版本：填写修订说明 */}
    <Dialog open={versionPromptOpen} onOpenChange={setVersionPromptOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>另存为新版本</DialogTitle>
          <DialogDescription>
            {editingQuestion
              ? `当前为 v${editingQuestion.version}，将创建 v${editingQuestion.version + 1}。原版本归档并保留其作答统计，引用旧版本的作业/试卷不受影响。`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label>修订说明</Label>
          <Textarea
            value={changeNote}
            onChange={(ev) => setChangeNote(ev.target.value)}
            placeholder="简述这次改了什么，如：优化题干表述、修正答案"
            className="min-h-20"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setVersionPromptOpen(false)}>
            取消
          </Button>
          <Button onClick={handleConfirmNewVersion}>确认另存为新版本</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

function TagPicker({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const checked = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              checked
                ? "border-brand bg-brand-soft text-brand-soft-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
