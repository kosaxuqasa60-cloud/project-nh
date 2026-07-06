"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { type TopicItem, type TopicQuestionItem, QUESTION_TYPE_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Lock, PlayCircle, RotateCcw, X } from "lucide-react"

// 把所有板块的条目摊平成有序步骤，文本块与题目都作为独立一步逐屏呈现
interface Step {
  sectionTitle: string
  item: TopicItem
  qNo?: number // 题目序号（仅题目）
}

export function TopicMobilePreview({ topicId }: { topicId: string }) {
  const { premiums } = useStore()
  const topic = premiums.find((p) => p.id === topicId)

  const steps = useMemo<Step[]>(() => {
    if (!topic?.sections) return []
    const out: Step[] = []
    let qNo = 0
    for (const sec of topic.sections) {
      for (const item of sec.items) {
        if (item.type === "question") {
          qNo += 1
          out.push({ sectionTitle: sec.title, item, qNo })
        } else {
          out.push({ sectionTitle: sec.title, item })
        }
      }
    }
    return out
  }, [topic])

  const [stepIdx, setStepIdx] = useState(0)

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">未找到该专题。</p>
        <Link href="/resources/premium" className="text-sm text-brand underline">
          返回精品资源
        </Link>
      </div>
    )
  }

  const total = steps.length
  const current = steps[stepIdx]
  const isLast = stepIdx === total - 1

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href={`/resources/premium/topics/${topic.id}/preview`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> 返回教师端
          </Link>
          <span className="text-sm font-medium text-foreground">移动端预览（学生作答）</span>
        </div>
      </header>

      {/* 手机框 */}
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[390px]">
          <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-background shadow-2xl">
            {/* 刘海 */}
            <div className="relative flex h-7 items-center justify-center bg-foreground/90">
              <div className="h-1.5 w-16 rounded-full bg-background/30" />
            </div>

            {/* 屏幕 */}
            <div className="flex h-[720px] flex-col bg-muted/20">
              {/* 顶部标题 + 进度 */}
              <div className="shrink-0 bg-brand px-4 pb-3 pt-3 text-brand-foreground">
                <h1 className="truncate text-sm font-bold">{topic.title}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-foreground/25">
                    <div
                      className="h-full rounded-full bg-brand-foreground transition-all"
                      style={{ width: `${total ? ((stepIdx + 1) / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums opacity-90">
                    {stepIdx + 1}/{total}
                  </span>
                </div>
              </div>

              {/* 步骤内容（每屏一条） */}
              <div className="flex-1 overflow-y-auto p-4">
                {current ? (
                  <StepView key={current.item.id} step={current} />
                ) : (
                  <p className="mt-10 text-center text-sm text-muted-foreground">该专题暂无内容</p>
                )}
              </div>

              {/* 底部导航 */}
              <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card px-4 py-3">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  className="rounded-lg border border-border px-3 py-2 text-[13px] text-foreground transition disabled:opacity-40"
                >
                  上一步
                </button>
                {!isLast ? (
                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(total - 1, i + 1))}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand py-2 text-[13px] font-medium text-brand-foreground"
                  >
                    下一题 <ChevronRight className="size-4" />
                  </button>
                ) : (
                  <div className="flex-1 rounded-lg bg-brand-soft py-2 text-center text-[13px] font-medium text-brand">
                    已完成全部内容
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            学生在手机端逐题作答的实际效果，作答后解锁讲解视频
          </p>
        </div>
      </main>
    </div>
  )
}

function StepView({ step }: { step: Step }) {
  if (step.item.type === "text") {
    return (
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-2 inline-flex items-center rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
          {step.sectionTitle}
        </div>
        {step.item.title && <div className="mb-1 text-sm font-semibold text-foreground">{step.item.title}</div>}
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{step.item.content}</p>
      </div>
    )
  }
  return <MobileQuestion item={step.item} no={step.qNo!} sectionTitle={step.sectionTitle} />
}

function MobileQuestion({
  item,
  no,
  sectionTitle,
}: {
  item: TopicQuestionItem
  no: number
  sectionTitle: string
}) {
  const isSingle = item.qType === "single"
  const isMultiple = item.qType === "multiple"
  const isChoice = isSingle || isMultiple
  const isJudge = item.qType === "judge"

  const [picked, setPicked] = useState<string[]>([])
  const [textAns, setTextAns] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const correctIds = useMemo(
    () => (item.options ?? []).filter((o) => o.correct).map((o) => o.id),
    [item.options],
  )

  const canSubmit = isChoice || isJudge ? picked.length > 0 : textAns.trim().length > 0
  const isCorrect =
    isChoice && submitted
      ? picked.length === correctIds.length && picked.every((id) => correctIds.includes(id))
      : null

  // 视频固定为“作答后解锁”
  const videoUnlocked = submitted

  function toggle(id: string) {
    if (submitted) return
    if (isSingle) setPicked([id])
    else setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function reset() {
    setPicked([])
    setTextAns("")
    setSubmitted(false)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
            {sectionTitle}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {QUESTION_TYPE_LABELS[item.qType]}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-medium text-brand-foreground">
            {no}
          </span>
          <p className="flex-1 text-[14px] leading-relaxed text-foreground">{item.stem}</p>
        </div>

        {/* 选择题 */}
        {isChoice && item.options && (
          <ul className="mt-4 space-y-2">
            {item.options.map((o, i) => {
              const on = picked.includes(o.id)
              const showCorrect = submitted && o.correct
              const showWrong = submitted && on && !o.correct
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    disabled={submitted}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] transition",
                      showCorrect && "border-brand bg-brand-soft text-brand",
                      showWrong && "border-destructive bg-destructive/10 text-destructive",
                      !submitted && on && "border-brand bg-brand-soft text-brand",
                      !submitted && !on && "border-border text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                        on || showCorrect ? "border-current" : "border-muted-foreground/40",
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{o.text}</span>
                    {showCorrect && <Check className="size-4" />}
                    {showWrong && <X className="size-4" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* 判断题 */}
        {isJudge && (
          <div className="mt-4 flex gap-2">
            {["对", "错"].map((v) => {
              const on = picked.includes(v)
              const showCorrect = submitted && item.answer === v
              const showWrong = submitted && on && item.answer !== v
              return (
                <button
                  key={v}
                  type="button"
                  disabled={submitted}
                  onClick={() => !submitted && setPicked([v])}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2.5 text-[13px] transition",
                    showCorrect && "border-brand bg-brand-soft text-brand",
                    showWrong && "border-destructive bg-destructive/10 text-destructive",
                    !submitted && on && "border-brand bg-brand-soft text-brand",
                    !submitted && !on && "border-border text-foreground",
                  )}
                >
                  {v}
                </button>
              )
            })}
          </div>
        )}

        {/* 填空 / 解答 */}
        {(item.qType === "fill" || item.qType === "subjective") && (
          <textarea
            value={textAns}
            onChange={(e) => setTextAns(e.target.value)}
            disabled={submitted}
            rows={item.qType === "subjective" ? 4 : 2}
            placeholder="在此作答…"
            className="mt-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand disabled:opacity-70"
          />
        )}

        {/* 提交 / 重做 */}
        {!submitted ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setSubmitted(true)}
            className={cn(
              "mt-4 w-full rounded-lg py-2.5 text-[13px] font-medium transition",
              canSubmit ? "bg-brand text-brand-foreground" : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            提交答案
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex items-center gap-1 text-[12px] text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> 重做本题
          </button>
        )}
      </div>

      {/* 作答结果 */}
      {submitted && (
        <div className="space-y-2 rounded-xl bg-card p-4 shadow-sm">
          {isCorrect !== null && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium",
                isCorrect ? "bg-brand-soft text-brand" : "bg-destructive/10 text-destructive",
              )}
            >
              {isCorrect ? <CheckCircle2 className="size-4" /> : <X className="size-4" />}
              {isCorrect ? "回答正确" : "回答错误"}
            </div>
          )}
          {item.answer && (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-foreground">
              <span className="font-medium text-brand">参考答案：</span>
              {item.answer}
            </p>
          )}
          {item.analysis && (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">解析：</span>
              {item.analysis}
            </p>
          )}
        </div>
      )}

      {/* 视频讲解（作答后解锁） */}
      {item.video?.url && (
        <div className="rounded-xl bg-card p-3 shadow-sm">
          {videoUnlocked ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-brand/40 bg-brand-soft px-3 py-2.5 text-[13px] text-brand"
            >
              <PlayCircle className="size-4" />
              <span className="font-medium">{item.video.title || "视频讲解"}</span>
              {item.video.duration && <span className="ml-auto text-xs opacity-80">{item.video.duration}</span>}
            </button>
          ) : (
            <div className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground">
              <Lock className="size-4" />
              <span>提交答案后解锁视频讲解</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
