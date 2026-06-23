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
  QUESTION_TYPE_LABELS,
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  SCOPE_OPTIONS,
  type AirClass,
  type Assignment,
  type Difficulty,
  type Microlesson,
  type Question,
  type QuestionType,
  type ResourceLevel,
  type SyncResourceType,
} from "@/lib/types"

type AnyResource = Question | Assignment | Microlesson | AirClass

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
  kind: SyncResourceType
  open: boolean
  onOpenChange: (v: boolean) => void
  editing?: AnyResource | null
}) {
  const {
    addQuestion,
    addAssignment,
    addMicrolesson,
    addAirClass,
    updateResource,
    knowledgePoints,
    questions,
  } = useStore()
  const isEdit = Boolean(editing)
  const e = editing as Partial<Question & Assignment & Microlesson & AirClass> | undefined

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

  const kindLabel = { question: "题目", assignment: "作业", microlesson: "微课", airclass: "空中课堂" }[kind]

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
    if (level !== "premium" && !ownerScope) return toast.error("请选择归属（市/区/校）")

    const base = {
      subject,
      level,
      ownerScope: level === "premium" ? undefined : ownerScope,
      knowledgePointIds: kpIds,
    }

    if (isEdit && editing) {
      const patch: Record<string, unknown> = { ...base }
      if (kind === "question")
        Object.assign(patch, { stem: stem.trim(), type: qType, difficulty, answer, analysis })
      else if (kind === "assignment") Object.assign(patch, { title: title.trim(), questionIds })
      else if (kind === "microlesson")
        Object.assign(patch, { title: title.trim(), duration, videoUrl })
      else Object.assign(patch, { title: title.trim(), teacher, scheduledAt, liveUrl })
      updateResource(kind, editing.id, patch)
      toast.success(`${kindLabel}已更新`)
    } else {
      if (kind === "question")
        addQuestion({ ...base, stem: stem.trim(), type: qType, difficulty, answer, analysis })
      else if (kind === "assignment")
        addAssignment({ ...base, title: title.trim(), questionIds })
      else if (kind === "microlesson")
        addMicrolesson({ ...base, title: title.trim(), duration: duration || "00:00", videoUrl })
      else addAirClass({ ...base, title: title.trim(), teacher, scheduledAt, liveUrl })
      toast.success(`已创建${kindLabel}`, { description: "资源已入库，可在教材章节中挂载使用" })
    }
    onOpenChange(false)
  }

  return (
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
                  placeholder="可选：解题思路与步骤"
                  className="min-h-16"
                />
              </Field>
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
              <Field label="主讲教师" required>
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

          {level === "premium" ? (
            <p className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-foreground/80">
              精品资源为平台官方出品，全员可见，仅平台管理员可创建。
            </p>
          ) : (
            <Field label="归属" required>
              <Select value={ownerScope} onValueChange={setOwnerScope}>
                <SelectTrigger><SelectValue placeholder={`选择${RESOURCE_LEVEL_LABELS[level]}归属`} /></SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS[level as Exclude<ResourceLevel, "premium">].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

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

          {/* 作业：从题库选题组卷 */}
          {kind === "assignment" && (
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

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "保存修改" : `创建${kindLabel}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
