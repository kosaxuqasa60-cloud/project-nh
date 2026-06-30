"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { type TopicQuestionItem, type TopicSection } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Lock,
  PlayCircle,
  X,
} from "lucide-react"

export function TopicMobilePreview({ topicId }: { topicId: string }) {
  const { premiums } = useStore()
  const topic = premiums.find((p) => p.id === topicId)

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

  const sections = topic.sections ?? []

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
            {/* 屏幕内容 */}
            <div className="h-[720px] overflow-y-auto bg-muted/20">
              <PhoneScreen topic={topic} sections={sections} />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            学生在手机端的实际作答效果
          </p>
        </div>
      </main>
    </div>
  )
}

function PhoneScreen({
  topic,
  sections,
}: {
  topic: { title: string; subject: string; coverImage?: string; lockVideoUntilAnswered?: boolean }
  sections: TopicSection[]
}) {
  const lock = !!topic.lockVideoUntilAnswered
  let qNo = 0

  return (
    <div>
      {/* 头图 */}
      {topic.coverImage ? (
        <img
          src={topic.coverImage || "/placeholder.svg"}
          alt={`${topic.title}封面`}
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 items-center bg-brand px-4">
          <h1 className="text-lg font-bold text-brand-foreground">{topic.title}</h1>
        </div>
      )}

      <div className="space-y-4 p-4">
        {topic.coverImage && (
          <h1 className="text-lg font-bold text-foreground">{topic.title}</h1>
        )}

        {sections.map((sec) => (
          <div key={sec.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-brand" />
              <h2 className="text-sm font-semibold text-foreground">{sec.title}</h2>
            </div>
            {sec.items.map((it) => {
              if (it.type === "text") {
                return (
                  <div
                    key={it.id}
                    className="rounded-xl bg-card p-3 text-[13px] leading-relaxed text-muted-foreground shadow-sm"
                  >
                    {it.title && (
                      <div className="mb-1 font-medium text-foreground">{it.title}</div>
                    )}
                    <p className="whitespace-pre-wrap">{it.content}</p>
                  </div>
                )
              }
              qNo += 1
              return <MobileQuestion key={it.id} item={it} no={qNo} lock={lock} />
            })}
          </div>
        ))}

        <div className="py-4 text-center text-xs text-muted-foreground">— 已到底部 —</div>
      </div>
    </div>
  )
}

function MobileQuestion({
  item,
  no,
  lock,
}: {
  item: TopicQuestionItem
  no: number
  lock: boolean
}) {
  const isSingle = item.qType === "single"
  const isMultiple = item.qType === "multiple"
  const isChoice = isSingle || isMultiple
  const isJudge = item.qType === "judge"

  const [picked, setPicked] = useState<string[]>([])
  const [textAns, setTextAns] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // 选择题正确选项 id 集合
  const correctIds = useMemo(
    () => (item.options ?? []).filter((o) => o.correct).map((o) => o.id),
    [item.options],
  )

  const canSubmit = isChoice ? picked.length > 0 : textAns.trim().length > 0
  // 选择题可自动判分；其余题型提交即视为已作答
  const isCorrect =
    isChoice && submitted
      ? picked.length === correctIds.length && picked.every((id) => correctIds.includes(id))
      : null

  // 视频是否解锁
  const videoUnlocked = !lock || submitted

  function toggle(id: string) {
    if (submitted) return
    if (isSingle) {
      setPicked([id])
    } else {
      setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }
  }

  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-medium text-brand-foreground">
          {no}
        </span>
        <p className="flex-1 text-[13px] leading-relaxed text-foreground">{item.stem}</p>
      </div>

      {/* 选择题 */}
      {isChoice && item.options && (
        <ul className="mt-3 space-y-2">
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
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                    showCorrect && "border-brand bg-brand-soft text-brand",
                    showWrong && "border-destructive bg-destructive/10 text-destructive",
                    !submitted && on && "border-brand bg-brand-soft text-brand",
                    !submitted && !on && "border-border text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                      (on || showCorrect) ? "border-current" : "border-muted-foreground/40",
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
        <div className="mt-3 flex gap-2">
          {["对", "错"].map((v) => {
            const on = picked.includes(v)
            return (
              <button
                key={v}
                type="button"
                disabled={submitted}
                onClick={() => !submitted && setPicked([v])}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-[13px] transition",
                  on ? "border-brand bg-brand-soft text-brand" : "border-border text-foreground",
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
          rows={item.qType === "subjective" ? 3 : 1}
          placeholder="在此作答…"
          className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand disabled:opacity-70"
        />
      )}

      {/* 提交 / 结果 */}
      {!submitted ? (
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            if (item.qType === "judge" || item.qType === "fill" || item.qType === "subjective") {
              if (isJudge && picked.length === 0) return
            }
            setSubmitted(true)
          }}
          className={cn(
            "mt-3 w-full rounded-lg py-2 text-[13px] font-medium transition",
            canSubmit
              ? "bg-brand text-brand-foreground"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          提交答案
        </button>
      ) : (
        <div className="mt-3 space-y-2">
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

      {/* 视频讲解（受解锁控制） */}
      {item.video?.url && (
        <div className="mt-2">
          {videoUnlocked ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-brand/40 bg-brand-soft px-3 py-2 text-[13px] text-brand"
            >
              <PlayCircle className="size-4" />
              <span className="font-medium">{item.video.title || "视频讲解"}</span>
              {item.video.duration && (
                <span className="ml-auto text-xs opacity-80">{item.video.duration}</span>
              )}
            </button>
          ) : (
            <div className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground">
              <Lock className="size-4" />
              <span>作答后解锁视频讲解</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
