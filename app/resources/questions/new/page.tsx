"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Check, Loader2, Plus, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { MathText } from "@/components/admin/math-text"
import { OrgScopePicker } from "@/components/admin/org-scope-picker"
import {
  difficultyTier,
  QUESTION_TYPE_LABELS,
  type Difficulty,
  type QuestionType,
  type ResourceLevel,
} from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]
const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5]
const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"]

export default function NewQuestionPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6 text-sm text-muted-foreground">加载中…</div>}>
      <NewQuestionInner />
    </Suspense>
  )
}

function NewQuestionInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { addQuestion, knowledgePoints, textbooks, chapters, resolveTags, tagDimensions } = useStore()

  // 教材已在外部确定：从 URL 读取，缺省回退首本
  const textbookId = params.get("textbook") || textbooks[0]?.id || ""
  const textbook = textbooks.find((t) => t.id === textbookId)
  const presetChapter = params.get("chapter") || ""

  // —— 题目内容 ——
  const [subject, setSubject] = useState(textbook?.subject ?? "数学")
  const [type, setType] = useState<QuestionType>("single")
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [stem, setStem] = useState("")
  const [options, setOptions] = useState<{ key: string; content: string }[]>([
    { key: "A", content: "" },
    { key: "B", content: "" },
    { key: "C", content: "" },
    { key: "D", content: "" },
  ])
  const [answer, setAnswer] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDuration, setVideoDuration] = useState("")

  // —— 标注体系 ——
  const [kpIds, setKpIds] = useState<string[]>([])
  // 各维度标注值（按维度 key 存所选标签名，含自定义维度）
  const [dimTags, setDimTags] = useState<Record<string, string[]>>({})
  const [teachTags, setTeachTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)

  // 设置某维度标注值；single 维度存为单元素数组
  function setDimValue(key: string, vals: string[]) {
    setDimTags((prev) => ({ ...prev, [key]: vals }))
  }
  function toggleDimValue(key: string, v: string) {
    setDimTags((prev) => {
      const cur = prev[key] ?? []
      return { ...prev, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }
    })
  }

  // —— 章节挂载（教材固定，仅选章节）——
  const [mountChapterIds, setMountChapterIds] = useState<string[]>(
    presetChapter ? [presetChapter] : [],
  )

  // —— 市/区/校级联授权 ——
  const [level, setLevel] = useState<ResourceLevel>("city")
  const [cityId, setCityId] = useState("")
  const [districtId, setDistrictId] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [ownerScope, setOwnerScope] = useState("")

  const isChoice = type === "single" || type === "multiple"
  const subjectKps = knowledgePoints.filter((k) => k.subject === subject)

  // 标注维度（除难度外）按 当前学科 + 归属区域(ownerScope) 动态解析其可选标签。
  // ownerScope 为空时回退平台基准；含管理端新增的自定义维度。
  const annotationDims = useMemo(
    () =>
      tagDimensions
        .filter((d) => d.key !== "difficulty")
        .map((d) => ({
          ...d,
          options: resolveTags(d.key, d.bySubject ? subject : "通用", ownerScope).map((t) => t.name),
        })),
    [tagDimensions, resolveTags, subject, ownerScope],
  )
  // 难度档位显示名（字典仅配置名称，档位仍为 1~5）
  const difficultyNameByTier = useMemo(() => {
    const m: Record<number, string> = {}
    resolveTags("difficulty", "通用", ownerScope).forEach((t) => {
      if (t.tier) m[t.tier] = t.name
    })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveTags, ownerScope])
  const difficultyLabel = (d: Difficulty) => difficultyNameByTier[d] ?? `${d} 星 · ${difficultyTier(d)}`

  // 当前教材的可挂载章节（含子章节，按层级缩进展示）
  const mountChapters = useMemo(
    () =>
      chapters
        .filter((c) => c.textbookId === textbookId)
        .sort((a, b) => a.order - b.order),
    [chapters, textbookId],
  )
  const depthOf = (id: string): number => {
    let d = 0
    let cur = chapters.find((c) => c.id === id)
    while (cur?.parentId) {
      d++
      cur = chapters.find((c) => c.id === cur!.parentId)
    }
    return d
  }

  function toggle<T>(arr: T[], v: T, set: (n: T[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }
  function updateOption(key: string, content: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, content } : o)))
  }
  function addOption() {
    const next = OPTION_KEYS[options.length]
    if (next) setOptions((prev) => [...prev, { key: next, content: "" }])
  }
  function removeOption(key: string) {
    setOptions((prev) => prev.filter((o) => o.key !== key))
  }

  // AI 生成标注（演示：依据题干模拟生成）
  function handleAiGenerate() {
    if (!stem.trim()) return toast.error("请先填写题干，AI 将据此生成标注")
    setAiGenerating(true)
    setTimeout(() => {
      // 为每个维度按其单/多选生成建议值
      const next: Record<string, string[]> = {}
      for (const d of annotationDims) {
        if (!d.options.length) continue
        next[d.key] = d.select === "single" ? d.options.slice(0, 1) : d.options.slice(0, 2)
      }
      setDimTags(next)
      setTeachTags((p) => Array.from(new Set([...p, "AI 推荐", "易错点"])))
      if (subjectKps.length) setKpIds((p) => (p.length ? p : [subjectKps[0].id]))
      setAiGenerating(false)
      toast.success("AI 已生成标注建议", { description: "可在此基础上手动调整" })
    }, 1100)
  }

  function handleSave() {
    if (!stem.trim()) return toast.error("请填写题干")
    if (!ownerScope) return toast.error("请完成市/区/校授权范围选择")

    const chapterMounts = mountChapterIds.map((chapterId) => ({ textbookId, chapterId }))

    addQuestion({
      subject,
      type,
      difficulty,
      stem: stem.trim(),
      options: isChoice ? options.filter((o) => o.content.trim()) : undefined,
      answer: answer.trim() || undefined,
      analysis: analysis.trim() || undefined,
      videoTitle: videoTitle.trim() || undefined,
      videoDuration: videoDuration.trim() || undefined,
      knowledgePointIds: kpIds,
      literacy,
      cognitive: cognitive || undefined,
      usage,
      scene: scene || undefined,
      teachTags,
      level,
      ownerScope,
      chapterMounts,
    })
    toast.success("题目已创建", {
      description: `${ownerScope} · ${chapterMounts.length} 个章节挂载`,
    })
    router.push("/resources/questions")
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      {/* 顶部 */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/resources/questions"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">新建题目</h1>
            <p className="text-sm text-muted-foreground">
              {textbook ? `当前教材：${textbook.name}` : "填写题目内容并完成标注、授权与章节挂载"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
        >
          <Check className="size-4" />
          保存题目
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* 左：题目内容 */}
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">题目内容</h2>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <Labeled label="学科">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </Labeled>
              <Labeled label="题型">
                <Select value={type} onValueChange={(v) => setType(v as QuestionType)} items={QUESTION_TYPE_LABELS}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Labeled>
              <Labeled label="难度">
                <Select
                  value={String(difficulty)}
                  onValueChange={(v) => setDifficulty(Number(v) as Difficulty)}
                  items={Object.fromEntries(DIFFICULTIES.map((d) => [String(d), difficultyLabel(d)]))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={String(d)}>{difficultyLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Labeled>
            </div>

            <Labeled label="题干（支持 $...$ 公式）">
              <Textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="如：计算 $(-7) + (+3) - (-5) = $ ______"
                className="min-h-24"
              />
            </Labeled>
            {stem.includes("$") && (
              <div className="mt-2 rounded-md border border-border bg-muted/30 p-2 text-sm">
                <span className="mr-2 text-xs text-muted-foreground">预览</span>
                <MathText>{stem}</MathText>
              </div>
            )}

            {isChoice && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-foreground">选项</p>
                {options.map((o) => (
                  <div key={o.key} className="flex items-center gap-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground">
                      {o.key}
                    </span>
                    <Input
                      value={o.content}
                      onChange={(e) => updateOption(o.key, e.target.value)}
                      placeholder={`选项 ${o.key}，支持 $...$`}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(o.key)}
                        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted"
                        aria-label="删除选项"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < OPTION_KEYS.length && (
                  <button
                    onClick={addOption}
                    className="inline-flex items-center gap-1 text-xs text-brand transition hover:underline"
                  >
                    <Plus className="size-3" /> 添加选项
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Labeled label="答案">
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="如 A 或 $1$" />
              </Labeled>
            </div>
            <div className="mt-3">
              <Labeled label="解析">
                <Textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  placeholder="解题思路与步骤，支持 $...$ 公式"
                  className="min-h-16"
                />
              </Labeled>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Labeled label="讲解视频标题">
                <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="可选" />
              </Labeled>
              <Labeled label="视频时长">
                <Input value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="如 06:12" />
              </Labeled>
            </div>
          </section>

          {/* 系统标注 */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">系统标注</h2>
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-soft-foreground transition hover:bg-brand-soft/70 disabled:opacity-60"
              >
                {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {aiGenerating ? "生成中…" : "AI 生成标注"}
              </button>
            </div>
            <div className="space-y-4">
              <Labeled label={`核心素养（已选 ${literacy.length}）`}>
                {literacyOpts.length ? (
                  <Chips options={literacyOpts} value={literacy} onToggle={(v) => toggle(literacy, v, setLiteracy)} />
                ) : (
                  <EmptyDict />
                )}
              </Labeled>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled label="学习水平">
                  <Select value={cognitive} onValueChange={setCognitive} items={Object.fromEntries(learningLevelOpts.map((o) => [o, o]))}>
                    <SelectTrigger><SelectValue placeholder="选择学习水平" /></SelectTrigger>
                    <SelectContent>
                      {learningLevelOpts.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>
                <Labeled label="情境属性">
                  <Select value={scene} onValueChange={setScene} items={Object.fromEntries(sceneOpts.map((o) => [o, o]))}>
                    <SelectTrigger><SelectValue placeholder="选择情境属性" /></SelectTrigger>
                    <SelectContent>
                      {sceneOpts.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>
              </div>
              <Labeled label={`教学用途（已选 ${usage.length}）`}>
                {usageOpts.length ? (
                  <Chips options={usageOpts} value={usage} onToggle={(v) => toggle(usage, v, setUsage)} />
                ) : (
                  <EmptyDict />
                )}
              </Labeled>
              <Labeled label={`知识点（已选 ${kpIds.length}）`}>
                {subjectKps.length ? (
                  <Chips
                    options={subjectKps.map((k) => k.name)}
                    value={subjectKps.filter((k) => kpIds.includes(k.id)).map((k) => k.name)}
                    onToggle={(name) => {
                      const kp = subjectKps.find((k) => k.name === name)
                      if (kp) toggle(kpIds, kp.id, setKpIds)
                    }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">该学科暂无知识点</p>
                )}
              </Labeled>
              <Labeled label="教学标签">
                <div className="flex flex-wrap gap-1.5">
                  {teachTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeachTags((p) => p.filter((x) => x !== t))}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs text-brand-soft-foreground"
                    >
                      {t}
                      <X className="size-3 text-brand-soft-foreground/60" />
                    </button>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault()
                        const v = tagInput.trim()
                        setTeachTags((p) => (p.includes(v) ? p : [...p, v]))
                        setTagInput("")
                      }
                    }}
                    placeholder="输入后回车添加"
                    className="min-w-32 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </Labeled>
            </div>
          </section>
        </div>

        {/* 右：授权 + 章节挂载 */}
        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">授权范围</h2>
            <p className="mb-4 text-xs text-muted-foreground">SaaS 平台资源必须归属到具体的市 / 区 / 校</p>
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
            {ownerScope && (
              <p className="mt-3 rounded-md bg-brand-soft px-3 py-2 text-xs text-brand-soft-foreground">
                归属：{ownerScope}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">章节挂载</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {textbook ? `挂入「${textbook.name}」章节目录（可多选）` : "选择章节目录（可多选）"}
            </p>
            {mountChapters.length ? (
              <div className="max-h-80 space-y-1 overflow-auto">
                {mountChapters.map((c) => {
                  const checked = mountChapterIds.includes(c.id)
                  const depth = depthOf(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(mountChapterIds, c.id, setMountChapterIds)}
                      style={{ paddingLeft: depth * 14 + 12 }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md border py-2 pr-3 text-left text-sm transition",
                        checked
                          ? "border-brand bg-brand-soft text-brand-soft-foreground"
                          : "border-border text-foreground hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border",
                          checked ? "border-brand bg-brand text-brand-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="truncate">{c.title}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">该教材暂无章节目录</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function EmptyDict() {
  return (
    <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
      该学科/区域下暂无可用标签，请前往「资源中心 › 标签字典」配置。
    </p>
  )
}

function Chips({
  options,
  value,
  onToggle,
}: {
  options: readonly string[]
  value: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const checked = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
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
