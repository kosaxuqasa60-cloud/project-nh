"use client"

import { useState } from "react"
import { Archive, CheckCircle2, GitBranch, TrendingUp, Users, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MathText } from "@/components/admin/math-text"
import { useStore } from "@/lib/store"
import {
  QUESTION_TYPE_LABELS,
  QUESTION_VERSION_STATUS_LABELS,
  type Question,
  type QuestionVersion,
} from "@/lib/types"

const STATUS_CLASS: Record<string, string> = {
  published: "bg-easy/15 text-easy",
  archived: "bg-muted text-muted-foreground",
  draft: "bg-medium/15 text-medium",
}

export function QuestionVersionSheet({
  q,
  open,
  onOpenChange,
}: {
  q: Question | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { questionFamilyStats } = useStore()
  // 对比模式：选中两个版本并排 diff
  const [compare, setCompare] = useState<number[]>([])

  if (!q) return null
  const stats = questionFamilyStats(q.id)
  // 版本按新→旧展示
  const ordered = [...q.versions].sort((a, b) => b.version - a.version)

  function toggleCompare(v: number) {
    setCompare((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v)
      if (prev.length >= 2) return [prev[1], v]
      return [...prev, v]
    })
  }

  const compareVersions =
    compare.length === 2
      ? compare
          .map((v) => q.versions.find((x) => x.version === v))
          .filter(Boolean as unknown as (x: QuestionVersion | undefined) => x is QuestionVersion)
          .sort((a, b) => a.version - b.version)
      : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="size-4 text-brand" />
            版本历史
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            <MathText>{q.stem}</MathText>
          </SheetDescription>
        </SheetHeader>

        {/* 族级累计汇总 */}
        <div className="grid grid-cols-3 gap-3 border-b border-border bg-muted/30 p-5">
          <FamilyStat icon={Layers} label="累计组卷" value={`${stats.totalUsed} 次`} />
          <FamilyStat icon={Users} label="累计学生" value={`${stats.totalStudents} 人`} />
          <FamilyStat icon={GitBranch} label="版本数" value={`${stats.versionCount} 个`} />
        </div>

        {/* 版本对比结果 */}
        {compareVersions.length === 2 && (
          <div className="border-b border-border bg-brand-soft/40 p-5">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <TrendingUp className="size-4 text-brand" />
              版本对比 v{compareVersions[0].version} → v{compareVersions[1].version}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {compareVersions.map((v) => (
                <div key={v.version} className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    v{v.version}
                  </div>
                  <div className="mb-2 text-sm leading-relaxed text-foreground">
                    <MathText>{v.stem}</MathText>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    正确率 {v.correctRate != null ? `${v.correctRate}%` : "—"} · 学生{" "}
                    {v.studentCount ?? 0} 人
                  </div>
                </div>
              ))}
            </div>
            {compareVersions[0].correctRate != null &&
              compareVersions[1].correctRate != null && (
                <p className="mt-3 text-xs text-foreground/80">
                  正确率变化：
                  <span
                    className={cn(
                      "font-semibold",
                      compareVersions[1].correctRate >= compareVersions[0].correctRate
                        ? "text-easy"
                        : "text-hard",
                    )}
                  >
                    {compareVersions[1].correctRate >= compareVersions[0].correctRate ? " +" : " "}
                    {compareVersions[1].correctRate - compareVersions[0].correctRate}%
                  </span>
                </p>
              )}
          </div>
        )}

        {/* 版本时间线 */}
        <div className="flex-1 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">版本时间线</span>
            <span className="text-xs text-muted-foreground">勾选两个版本进行对比</span>
          </div>
          <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
            {ordered.map((v) => {
              const isCurrent = v.version === q.version
              const checked = compare.includes(v.version)
              return (
                <li key={v.version} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[27px] top-1 grid size-4 place-items-center rounded-full ring-2 ring-card",
                      isCurrent ? "bg-easy" : "bg-muted-foreground/40",
                    )}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="size-3 text-card" />
                    ) : (
                      <Archive className="size-2.5 text-card" />
                    )}
                  </span>
                  <div
                    className={cn(
                      "rounded-lg border bg-card p-3 transition",
                      checked ? "border-brand ring-1 ring-brand/30" : "border-border",
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">v{v.version}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium",
                          STATUS_CLASS[v.status],
                        )}
                      >
                        {QUESTION_VERSION_STATUS_LABELS[v.status]}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {QUESTION_TYPE_LABELS[v.type]}
                      </span>
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {v.createdAt}
                      </span>
                    </div>
                    <div className="mb-2 text-sm leading-relaxed text-foreground">
                      <MathText>{v.stem}</MathText>
                    </div>
                    {v.changeNote && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        <span className="text-foreground/70">修订说明：</span>
                        {v.changeNote}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>组卷 {v.usedCount ?? 0} 次</span>
                        <span>学生 {v.studentCount ?? 0} 人</span>
                        <span>正确率 {v.correctRate != null ? `${v.correctRate}%` : "—"}</span>
                      </div>
                      <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCompare(v.version)}
                          className="size-3.5 accent-[var(--brand)]"
                        />
                        对比
                      </label>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FamilyStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 text-center">
      <Icon className="size-4 text-brand" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
