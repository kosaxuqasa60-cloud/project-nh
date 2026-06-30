"use client"

import { useState } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { QUESTION_TYPE_LABELS, type TopicQuestionItem } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  FileText,
  Pencil,
  PlayCircle,
  Send,
  Smartphone,
} from "lucide-react"

const CLASSES = ["六(1)班", "六(2)班", "六(3)班", "七(1)班", "七(2)班"]

export function TopicTeacherPreview({ topicId }: { topicId: string }) {
  const { premiums } = useStore()
  const topic = premiums.find((p) => p.id === topicId)

  const [distOpen, setDistOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [due, setDue] = useState("")

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
  let qNo = 0

  function submitDistribute() {
    if (!picked.length) {
      toast.error("请至少选择一个班级")
      return
    }
    toast.success("专题已下发", {
      description: `已下发至 ${picked.join("、")}${due ? ` · 截止 ${due}` : ""}`,
    })
    setDistOpen(false)
    setPicked([])
    setDue("")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/resources/premium"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> 返回
          </Link>
          <span className="text-sm font-medium text-foreground">教师端预览</span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/resources/premium/topics/${topic.id}/mobile`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
            >
              <Smartphone className="size-4" /> 移动端预览
            </Link>
            <Link
              href={`/resources/premium/topics/${topic.id}`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
            >
              <Pencil className="size-4" /> 编辑
            </Link>
            <Button size="sm" className="gap-1.5" onClick={() => setDistOpen(true)}>
              <Send className="size-4" /> 下发
            </Button>
          </div>
        </div>
      </header>

      {/* 试卷正文 */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {topic.coverImage && (
            <img
              src={topic.coverImage || "/placeholder.svg"}
              alt={`${topic.title}封面`}
              className="mb-5 h-44 w-full rounded-xl object-cover"
            />
          )}
          <h1 className="text-balance text-2xl font-bold text-foreground">{topic.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{topic.subject}</span>
            <span>·</span>
            <span>{topic.ownerScope ?? "平台"}</span>
          </div>
          {topic.description && (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
          )}

          <div className="mt-6 space-y-8">
            {sections.map((sec) => (
              <section key={sec.id}>
                <h2 className="mb-3 border-l-4 border-brand pl-3 text-lg font-semibold text-foreground">
                  {sec.title}
                </h2>
                {sec.intro && (
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{sec.intro}</p>
                )}
                <div className="space-y-5">
                  {sec.items.map((it) => {
                    if (it.type === "text") {
                      return (
                        <div
                          key={it.id}
                          className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground"
                        >
                          {it.title && (
                            <div className="mb-1 flex items-center gap-1.5 font-medium">
                              <FileText className="size-4 text-brand" /> {it.title}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-pretty">{it.content}</p>
                        </div>
                      )
                    }
                    qNo += 1
                    return <TeacherQuestion key={it.id} item={it} no={qNo} />
                  })}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      {/* 下发对话框 */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>下发专题</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">选择班级</label>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map((c) => {
                  const on = picked.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setPicked((prev) =>
                          on ? prev.filter((x) => x !== c) : [...prev, c],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition",
                        on
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-border text-foreground hover:bg-muted",
                      )}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">截止时间（可选）</label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistOpen(false)}>
              取消
            </Button>
            <Button onClick={submitDistribute}>确认下发</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeacherQuestion({ item, no }: { item: TopicQuestionItem; no: number }) {
  const isChoice = item.qType === "single" || item.qType === "multiple"
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
          {item.label ? item.label : no}
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {QUESTION_TYPE_LABELS[item.qType]}
        </span>
        <p className="flex-1 text-pretty text-sm leading-relaxed text-foreground">{item.stem}</p>
      </div>

      {/* 选择题选项 */}
      {isChoice && item.options && item.options.length > 0 && (
        <ul className="mt-3 space-y-1.5 pl-1">
          {item.options.map((o, i) => (
            <li key={o.id} className="flex items-center gap-2 text-sm">
              {o.correct ? (
                <CheckCircle2 className="size-4 shrink-0 text-brand" />
              ) : (
                <CircleDot className="size-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={cn(o.correct ? "font-medium text-foreground" : "text-muted-foreground")}>
                {String.fromCharCode(65 + i)}. {o.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 答案 / 解析 */}
      <div className="mt-3 space-y-1.5 rounded-md bg-muted/40 p-3 text-sm">
        {item.answer && (
          <p className="text-foreground">
            <span className="font-medium text-brand">【答案】</span>
            {item.answer}
          </p>
        )}
        {item.analysis && (
          <p className="text-pretty leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">【解析】</span>
            {item.analysis}
          </p>
        )}
      </div>

      {/* 视频讲解 */}
      {item.video?.url && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <PlayCircle className="size-4 text-brand" />
          <span className="font-medium text-foreground">{item.video.title || "视频讲解"}</span>
          {item.video.duration && (
            <span className="text-xs text-muted-foreground">{item.video.duration}</span>
          )}
          {item.video.fileName && (
            <span className="ml-auto truncate text-xs text-muted-foreground">{item.video.fileName}</span>
          )}
        </div>
      )}
    </div>
  )
}
