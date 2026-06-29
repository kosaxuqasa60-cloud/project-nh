"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Info, Pencil, Plus, Tags, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SUBJECTS } from "@/lib/mock-data"
import {
  BASE_SCOPE,
  ORG_TREE,
  TAG_DIMENSIONS,
  tagScopeChain,
  UNIVERSAL_SUBJECT,
  type TagDimensionKey,
  type TagItem,
} from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// 作用域下拉项：平台基准 + 市/区/校（按层级缩进）
type ScopeOption = { value: string; label: string; level: "base" | "city" | "district" | "school" }
function buildScopeOptions(): ScopeOption[] {
  const out: ScopeOption[] = [{ value: BASE_SCOPE, label: "平台基准（全局共享）", level: "base" }]
  for (const c of ORG_TREE) {
    out.push({ value: c.name, label: c.name, level: "city" })
    for (const d of c.districts) {
      out.push({ value: d.name, label: `　${d.name}`, level: "district" })
      for (const s of d.schools) {
        out.push({ value: s.name, label: `　　${s.name}`, level: "school" })
      }
    }
  }
  return out
}

const SCOPE_LEVEL_LABEL: Record<ScopeOption["level"], string> = {
  base: "平台基准",
  city: "市级",
  district: "区级",
  school: "校级",
}

export function TagDictionaryView() {
  const { tagItems, tagDisables, addTagItem, updateTagItem, removeTagItem, reorderTagItem, toggleTagDisable, resolveTags } =
    useStore()

  const scopeOptions = useMemo(buildScopeOptions, [])
  // 学科选项：通用 + 各具体学科。通用学科承载难度、学习水平等通用标准
  const subjectOptions = useMemo(() => [UNIVERSAL_SUBJECT, ...SUBJECTS], [])
  const [subject, setSubject] = useState<string>(UNIVERSAL_SUBJECT)
  const [scope, setScope] = useState<string>(BASE_SCOPE)
  const [activeDim, setActiveDim] = useState<TagDimensionKey>("difficulty")

  const isUniversal = subject === UNIVERSAL_SUBJECT
  // 当前学科下可见的维度：通用学科显示通用维度，具体学科显示按学科维度
  const visibleDims = useMemo(
    () => TAG_DIMENSIONS.filter((d) => (isUniversal ? !d.bySubject : d.bySubject)),
    [isUniversal],
  )

  // 切换学科后，若当前维度不在可见列表内，自动切到该学科第一个维度
  if (!visibleDims.some((d) => d.key === activeDim) && visibleDims.length > 0) {
    setActiveDim(visibleDims[0].key)
  }

  // 新增 / 编辑标签弹窗
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<TagItem | null>(null) // null = 新增
  const [nameInput, setNameInput] = useState("")

  const isBase = scope === BASE_SCOPE
  const scopeMeta = scopeOptions.find((s) => s.value === scope)!
  const meta = TAG_DIMENSIONS.find((d) => d.key === activeDim)!
  const subjForActive = meta.bySubject ? subject : UNIVERSAL_SUBJECT

  // 左侧各维度在当前作用域下的可用标签数（用于角标）
  const dimCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const d of visibleDims) {
      const subj = d.bySubject ? subject : UNIVERSAL_SUBJECT
      m[d.key] = resolveTags(d.key, subj, scope).length
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagItems, tagDisables, subject, scope, visibleDims])

  // 当前维度：本级自有标签
  const ownItems = useMemo(
    () =>
      tagItems
        .filter((t) => t.dimensionKey === activeDim && t.subject === subjForActive && t.scope === scope)
        .sort((a, b) => a.order - b.order),
    [tagItems, activeDim, subjForActive, scope],
  )

  // 当前维度：从上级继承的标签（区域作用域时展示）
  const chain = tagScopeChain(scope)
  const parentScope = chain.length >= 2 ? chain[chain.length - 2] : null
  const inheritedItems = useMemo(() => {
    if (isBase || !parentScope) return []
    return resolveTags(activeDim, subjForActive, parentScope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagItems, tagDisables, activeDim, subjForActive, parentScope, isBase])

  function isDisabledHere(tagId: string) {
    return tagDisables.some((d) => d.tagId === tagId && d.scope === scope)
  }

  function openAdd() {
    setEditing(null)
    setNameInput("")
    setEditOpen(true)
  }
  function openEdit(t: TagItem) {
    setEditing(t)
    setNameInput(t.name)
    setEditOpen(true)
  }
  function submitEdit() {
    const name = nameInput.trim()
    if (!name) {
      toast.error("请输入标签名称")
      return
    }
    if (editing) {
      updateTagItem(editing.id, { name })
      toast.success("标签已更新")
    } else {
      const maxOrder = ownItems.reduce((mx, t) => Math.max(mx, t.order), 0)
      // 难度维度：新增档位时自动续接 tier 序号
      const isDifficulty = activeDim === "difficulty"
      const maxTier = isDifficulty
        ? tagItems
            .filter((t) => t.dimensionKey === "difficulty")
            .reduce((mx, t) => Math.max(mx, t.tier ?? 0), 0)
        : undefined
      addTagItem({
        dimensionKey: activeDim,
        subject: subjForActive,
        name,
        order: maxOrder + 1,
        scope,
        ...(isDifficulty ? { tier: (maxTier ?? 0) + 1 } : {}),
      })
      toast.success("标签已新增")
    }
    setEditOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 标题 */}
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Tags className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-foreground">标签字典</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            统一管理题目标注维度下的标签。维度固定，按学科区分；平台维护基准，区域可新增专属或停用基准项。
          </p>
        </div>
      </div>

      {/* 顶部上下文：学科 + 作用域 */}
      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">学科</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === UNIVERSAL_SUBJECT ? "通用（全学科）" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">配置作用域</label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue>
                {(v: string) => scopeOptions.find((o) => o.value === v)?.label.trim() ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {scopeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 text-brand" />
          {isBase
            ? "当前编辑平台基准字典，所有区域共享。"
            : `当前编辑「${scopeMeta.label.trim()}」（${SCOPE_LEVEL_LABEL[scopeMeta.level]}）：可新增本级专属标签，或停用上级下发的标签。`}
        </div>
      </div>

      <div className="flex flex-col gap-5 md:flex-row">
        {/* 左：维度列表 */}
        <div className="w-full shrink-0 md:w-52">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
            {visibleDims.map((d) => {
              const active = d.key === activeDim
              return (
                <button
                  key={d.key}
                  onClick={() => setActiveDim(d.key)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-brand text-brand-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{d.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px]",
                      active ? "bg-brand-foreground/20 text-brand-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {dimCounts[d.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 右：当前维度标签 */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-border bg-card">
            {/* 维度头 */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">{meta.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {meta.select === "single" ? "单选" : "多选"}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {meta.bySubject ? `按学科 · ${subject}` : "全学科通用"}
              </span>
              <span className="text-xs text-muted-foreground">{meta.desc}</span>
              <Button size="sm" className="ml-auto gap-1" onClick={openAdd}>
                <Plus className="size-4" /> 新增标签
              </Button>
            </div>

            <div className="divide-y divide-border">
              {/* 继承自上级（区域作用域） */}
              {!isBase && inheritedItems.length > 0 && (
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">继承（基准 / 上级，可停用）</p>
                  <div className="flex flex-col gap-1.5">
                    {inheritedItems.map((t) => {
                      const disabled = isDisabledHere(t.id)
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3 py-2",
                            disabled ? "border-dashed border-border bg-muted/30" : "border-border",
                          )}
                        >
                          <span className={cn("text-sm", disabled ? "text-muted-foreground line-through" : "text-foreground")}>
                            {t.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {t.scope === BASE_SCOPE ? "基准" : t.scope}
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{disabled ? "已停用" : "启用"}</span>
                            <Switch
                              checked={!disabled}
                              onCheckedChange={(v) => {
                                toggleTagDisable(t.id, scope, !v)
                                toast.success(v ? "已在本级启用" : "已在本级停用")
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 本级标签 */}
              <div className="px-4 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {isBase ? "基准标签" : "本级新增标签"}
                </p>
                {ownItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {isBase ? "暂无标签，点击右上角新增" : "本级暂无专属标签"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {ownItems.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                      >
                        {/* 排序 */}
                        <div className="flex flex-col">
                          <button
                            onClick={() => reorderTagItem(t.id, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                            aria-label="上移"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            onClick={() => reorderTagItem(t.id, "down")}
                            disabled={idx === ownItems.length - 1}
                            className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                            aria-label="下移"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </div>
                        {t.tier ? (
                          <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            {t.tier} 档
                          </span>
                        ) : null}
                        <span className="text-sm text-foreground">{t.name}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => openEdit(t)}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label="编辑"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              removeTagItem(t.id)
                              toast.success("标签已删除")
                            }}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label="删除"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增 / 编辑标签弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑标签" : `新增标签 · ${meta.label}`}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <label className="text-xs font-medium text-muted-foreground">标签名称</label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={`请���入${meta.label}标签名称`}
              onKeyDown={(e) => e.key === "Enter" && submitEdit()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {isBase ? "平台基准标签，所有区域共享。" : `归属「${scopeMeta.label.trim()}」本级专属标签。`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={submitEdit}>{editing ? "保存" : "新增"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
