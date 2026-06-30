"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Crown, FileText, Layers, Pencil, Plus, Search, Trash2, Video } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PREMIUM_CATEGORY_LABELS,
  RESOURCE_LEVEL_LABELS,
  topicQuestionCount,
  topicVideoCount,
  type Premium,
  type PremiumCategory,
} from "@/lib/types"

const LEVEL_BADGE: Record<string, string> = {
  city: "bg-brand-soft text-brand-soft-foreground",
  district: "bg-accent text-accent-foreground",
  school: "bg-muted text-muted-foreground",
}

type Tab = "all" | PremiumCategory

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "special", label: "专题资源" },
  { key: "paper", label: "精品试卷" },
  { key: "courseware", label: "精品课件" },
]

export function PremiumTopicsView() {
  const { premiums, removeResource } = useStore()
  const [tab, setTab] = useState<Tab>("special")
  const [q, setQ] = useState("")

  const list = useMemo(() => {
    return premiums.filter((p) => {
      if (tab !== "all" && p.category !== tab) return false
      if (q && !p.title.includes(q) && !(p.subject ?? "").includes(q)) return false
      return true
    })
  }, [premiums, tab, q])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Crown className="size-5 text-brand" /> 精品资源
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            精品资源本质是结构化题目包，可按章节或专题编排。专题资源由多个板块组成，每道题目可挂配套视频讲解。
          </p>
        </div>
        <Link href="/resources/premium/topics/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" /> 新建专题
        </Link>
      </div>

      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                tab === t.key
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题、学科…"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {/* 卡片网格 */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          暂无资源，点击右上角「新建专题」开始创建
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <TopicCard key={p.id} data={p} onDelete={() => {
              removeResource("premium", p.id)
              toast.success("已删除")
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function TopicCard({ data, onDelete }: { data: Premium; onDelete: () => void }) {
  const isTopic = data.category === "special"
  const sectionCount = data.sections?.length ?? 0
  const qCount = topicQuestionCount(data)
  const vCount = topicVideoCount(data)
  const editHref = `/resources/premium/topics/${data.id}`

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-brand/50 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-soft-foreground">
          {PREMIUM_CATEGORY_LABELS[data.category]}
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", LEVEL_BADGE[data.level])}>
          {RESOURCE_LEVEL_LABELS[data.level]}
          {data.ownerScope ? ` · ${data.ownerScope}` : ""}
        </span>
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground text-balance">
        {data.title}
      </h3>
      {data.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {data.description}
        </p>
      )}

      {/* 统计 */}
      {isTopic ? (
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" /> {sectionCount} 板块
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" /> {qCount} 题
          </span>
          <span className="inline-flex items-center gap-1">
            <Video className="size-3.5" /> {vCount} 视频
          </span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" /> {data.questionIds.length} 题
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>{data.subject} · 更新于 {data.updatedAt}</span>
        <span>已用 {data.usedCount ?? 0}</span>
      </div>

      {/* 操作 */}
      <div className="mt-3 flex items-center gap-2">
        {isTopic ? (
          <Link href={editHref} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1 gap-1.5")}>
            <Pencil className="size-3.5" /> 编辑专题
          </Link>
        ) : (
          <span className="flex-1 text-center text-xs text-muted-foreground">
            {PREMIUM_CATEGORY_LABELS[data.category]}（暂不支持结构化编辑）
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="删除"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
