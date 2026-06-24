"use client"

import { useState } from "react"
import {
  ChevronDown,
  Pencil,
  Plus,
  PlayCircle,
  Users,
  Layers,
  Eye,
  Crown,
  Clapperboard,
  ClipboardList,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { LevelChip } from "@/components/admin/level-badge"
import { MathText } from "@/components/admin/math-text"
import { useStore } from "@/lib/store"
import {
  difficultyTier,
  PREMIUM_CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
  type Assignment,
  type AirClass,
  type Microlesson,
  type Premium,
  type Question,
} from "@/lib/types"

const TIER_CLASS: Record<string, string> = {
  易: "bg-easy/15 text-easy",
  中: "bg-medium/15 text-medium",
  难: "bg-hard/15 text-hard",
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  )
}

function SelectBox({
  selected,
  onToggle,
}: {
  selected?: boolean
  onToggle?: () => void
}) {
  if (!onToggle) return null
  return (
    <Checkbox
      checked={selected}
      onCheckedChange={onToggle}
      className="mt-0.5"
      aria-label="选择资源"
    />
  )
}

/* ----------------------------- 题目卡 ----------------------------- */

export function QuestionCard({
  q,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onMount,
  onHistory,
}: {
  q: Question
  index: number
  selected?: boolean
  onToggleSelect?: () => void
  onEdit?: () => void
  onMount?: () => void
  onHistory?: () => void
}) {
  const { knowledgePoints } = useStore()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"basic" | "anno">("basic")
  const tier = difficultyTier(q.difficulty)
  const kpName = (id: string) => knowledgePoints.find((k) => k.id === id)?.name ?? id

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition",
        selected ? "border-brand ring-1 ring-brand/30" : "border-border hover:border-brand/40",
      )}
    >
      <div className="flex gap-3 p-4">
        <SelectBox selected={selected} onToggle={onToggleSelect} />
        <span className="mt-0.5 text-sm font-semibold text-muted-foreground">{index}</span>
        <div className="min-w-0 flex-1">
          {/* 角标行 */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Pill className="bg-muted text-muted-foreground">{QUESTION_TYPE_LABELS[q.type]}</Pill>
            <LevelChip level={q.level} />
            <Pill className={TIER_CLASS[tier]}>{tier}</Pill>
            <button
              type="button"
              onClick={onHistory}
              disabled={!onHistory}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                "bg-brand-soft text-brand-soft-foreground",
                onHistory && "transition hover:opacity-80",
              )}
              title={`当前 v${q.version}，共 ${q.versions.length} 个版本`}
            >
              <GitBranch className="size-3" />v{q.version}
              {q.versions.length > 1 && <span className="opacity-70">/{q.versions.length}</span>}
            </button>
            {q.videoTitle && (
              <Pill className="bg-brand-soft text-brand-soft-foreground">
                <PlayCircle className="size-3" />
                视频讲解
              </Pill>
            )}
          </div>
          {/* 题干 */}
          <div className="text-sm leading-relaxed text-foreground">
            <MathText>{q.stem}</MathText>
          </div>
          {/* 选项 */}
          {q.options && q.options.length > 0 && (
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {q.options.map((o) => (
                <div key={o.key} className="flex items-baseline gap-1.5 text-sm text-foreground/90">
                  <span className="font-medium text-muted-foreground">{o.key}.</span>
                  <MathText>{o.content}</MathText>
                </div>
              ))}
            </div>
          )}
          {/* 标签 + 操作 */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-border pt-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {q.knowledgePointIds.map((id) => (
                <span key={id} className="text-[11px] text-brand">
                  #{kpName(id)}
                </span>
              ))}
              {q.usage?.map((t) => (
                <span key={t} className="text-[11px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                展开详情
                <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
              </button>
              {onHistory && (
                <button
                  onClick={onHistory}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
                >
                  <GitBranch className="size-3" />
                  版本
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
                >
                  <Pencil className="size-3" />
                  编辑
                </button>
              )}
              {onMount && (
                <button
                  onClick={onMount}
                  className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-brand-foreground transition hover:opacity-90"
                >
                  <Plus className="size-3" />
                  挂载
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 展开详情：基本信息 / 系统标注 双 tab */}
      {open && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="mb-3 flex gap-1">
            {(["basic", "anno"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition",
                  tab === t
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t === "basic" ? "基本信息" : "系统标注"}
              </button>
            ))}
          </div>
          {tab === "basic" ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Field label="答案">{q.answer ? <MathText>{q.answer}</MathText> : "—"}</Field>
              <Field label="解析">{q.analysis ? <MathText>{q.analysis}</MathText> : "—"}</Field>
              {q.videoTitle && (
                <Field label="讲解视频">
                  {q.videoTitle}（{q.videoDuration}）
                </Field>
              )}
              <Field label="使用统计">
                组卷 {q.usedCount ?? 0} 次 · 已练 {q.studentCount ?? 0} 人
              </Field>
            </dl>
          ) : (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Field label="知识点">{q.knowledgePointIds.map(kpName).join("、") || "—"}</Field>
              <Field label="核心素养">{q.literacy?.join("、") || "—"}</Field>
              <Field label="认知层级">{q.cognitive || "—"}</Field>
              <Field label="教学用途">{q.usage?.join("、") || "—"}</Field>
              <Field label="情景属性">{q.scene || "—"}</Field>
              <Field label="教学标签">{q.teachTags?.join("、") || "—"}</Field>
            </dl>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  )
}

/* ----------------------------- 精品资源卡 ----------------------------- */

export function PremiumCard({
  data,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onMount,
}: {
  data: Premium
  index: number
  selected?: boolean
  onToggleSelect?: () => void
  onEdit?: () => void
  onMount?: () => void
}) {
  const { knowledgePoints } = useStore()
  const kpName = (id: string) => knowledgePoints.find((k) => k.id === id)?.name ?? id

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border bg-card p-4 transition",
        selected ? "border-brand ring-1 ring-brand/30" : "border-border hover:border-brand/40",
      )}
    >
      <SelectBox selected={selected} onToggle={onToggleSelect} />
      <span className="mt-0.5 text-sm font-semibold text-muted-foreground">{index}</span>
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-warn/20 text-warn-foreground">
        <Crown className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <LevelChip level={data.level} />
          <Pill className="bg-warn/15 text-warn-foreground">
            {PREMIUM_CATEGORY_LABELS[data.category]}
          </Pill>
          <span className="truncate text-sm font-medium text-foreground">{data.title}</span>
        </div>
        {data.description && (
          <p className="mb-1.5 line-clamp-1 text-xs text-muted-foreground">{data.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill className="bg-muted text-muted-foreground">
            <Layers className="size-3" />
            {data.questionIds.length} 题
          </Pill>
          {data.usedCount != null && (
            <span className="text-[11px] text-muted-foreground">使用 {data.usedCount} 次</span>
          )}
          {data.knowledgePointIds.map((id) => (
            <span key={id} className="text-[11px] text-brand">
              #{kpName(id)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
          >
            <Pencil className="size-3" />
            编辑
          </button>
        )}
        {onMount && (
          <button
            onClick={onMount}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-brand-foreground transition hover:opacity-90"
          >
            <Plus className="size-3" />
            挂载
          </button>
        )}
      </div>
    </div>
  )
}

/* --------------------------- 媒体/组合卡 --------------------------- */
// 作业 / 微课 / 空中课堂 共用一个紧凑卡

export function MediaCard({
  kind,
  data,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onMount,
}: {
  kind: "assignment" | "microlesson" | "airclass"
  data: Assignment | Microlesson | AirClass
  index: number
  selected?: boolean
  onToggleSelect?: () => void
  onEdit?: () => void
  onMount?: () => void
}) {
  const title = (data as { title: string }).title
  const Icon = kind === "assignment" ? ClipboardList : kind === "microlesson" ? PlayCircle : Clapperboard

  let meta: React.ReactNode = null
  if (kind === "assignment") {
    const a = data as Assignment
    meta = (
      <>
        <Pill className="bg-muted text-muted-foreground">
          <Layers className="size-3" />
          {a.questionIds.length} 题
        </Pill>
        {a.assignedClasses != null && (
          <Pill className="bg-muted text-muted-foreground">
            <Users className="size-3" />
            已布置 {a.assignedClasses} 班
          </Pill>
        )}
        {a.usedCount != null && (
          <span className="text-[11px] text-muted-foreground">使用 {a.usedCount} 次</span>
        )}
      </>
    )
  } else if (kind === "microlesson") {
    const m = data as Microlesson
    meta = (
      <>
        <Pill className="bg-muted text-muted-foreground">{m.duration}</Pill>
        {m.viewCount != null && (
          <Pill className="bg-muted text-muted-foreground">
            <Eye className="size-3" />
            {m.viewCount} 次观看
          </Pill>
        )}
      </>
    )
  } else {
    const ac = data as AirClass
    meta = (
      <>
        <Pill className="bg-muted text-muted-foreground">主讲 {ac.teacher}</Pill>
        {ac.scheduledAt && (
          <span className="text-[11px] text-muted-foreground">{ac.scheduledAt}</span>
        )}
      </>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border bg-card p-4 transition",
        selected ? "border-brand ring-1 ring-brand/30" : "border-border hover:border-brand/40",
      )}
    >
      <SelectBox selected={selected} onToggle={onToggleSelect} />
      <span className="mt-0.5 text-sm font-semibold text-muted-foreground">{index}</span>
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <LevelChip level={(data as { level: Question["level"] }).level} />
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">{meta}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
          >
            <Pencil className="size-3" />
            编辑
          </button>
        )}
        {onMount && (
          <button
            onClick={onMount}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-brand-foreground transition hover:opacity-90"
          >
            <Plus className="size-3" />
            挂载
          </button>
        )}
      </div>
    </div>
  )
}
