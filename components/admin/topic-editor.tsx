"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  Layers,
  Plus,
  Trash2,
  Type,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SUBJECTS } from "@/lib/mock-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrgScopePicker } from "@/components/admin/org-scope-picker"
import {
  ORG_TREE,
  topicQuestionCount,
  topicVideoCount,
  type ResourceLevel,
  type TopicItem,
  type TopicQuestionItem,
  type TopicSection,
  type TopicTextItem,
} from "@/lib/types"

let _uid = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${_uid++}`

// 由归属名称反查级联 id（编辑已有专题时回填 OrgScopePicker）
function findScopeIds(level: ResourceLevel, ownerScope?: string) {
  let cityId = ""
  let districtId = ""
  let schoolId = ""
  if (!ownerScope) return { cityId, districtId, schoolId }
  for (const c of ORG_TREE) {
    if (c.name === ownerScope) return { cityId: c.id, districtId: "", schoolId: "" }
    for (const d of c.districts) {
      if (d.name === ownerScope) return { cityId: c.id, districtId: d.id, schoolId: "" }
      for (const s of d.schools) {
        if (s.name === ownerScope)
          return { cityId: c.id, districtId: d.id, schoolId: s.id }
      }
    }
  }
  return { cityId, districtId, schoolId }
}

export function TopicEditor({ id }: { id: string }) {
  const router = useRouter()
  const { premiums, createTopic, updateTopic } = useStore()
  const isNew = id === "new"
  const existing = isNew ? undefined : premiums.find((p) => p.id === id)

  // —— 元信息 ——
  const [title, setTitle] = useState(existing?.title ?? "")
  const [subject, setSubject] = useState(existing?.subject ?? "数学")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [level, setLevel] = useState<ResourceLevel>(existing?.level ?? "city")
  const initIds = findScopeIds(existing?.level ?? "city", existing?.ownerScope)
  const [cityId, setCityId] = useState(initIds.cityId)
  const [districtId, setDistrictId] = useState(initIds.districtId)
  const [schoolId, setSchoolId] = useState(initIds.schoolId)
  const [ownerScope, setOwnerScope] = useState(existing?.ownerScope ?? "")
  // —— 板块 ——
  const [sections, setSections] = useState<TopicSection[]>(existing?.sections ?? [])

  if (!isNew && !existing) {
    return (
      <div className="space-y-4">
        <Link href="/resources/premium" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
          <ArrowLeft className="size-4" /> 返回精品资源
        </Link>
        <p className="text-sm text-muted-foreground">未找到该专题，可能已被删除。</p>
      </div>
    )
  }

  // —— 板块操作 ——
  const patchSection = (sid: string, patch: Partial<TopicSection>) =>
    setSections((prev) => prev.map((s) => (s.id === sid ? { ...s, ...patch } : s)))
  const addSection = () =>
    setSections((prev) => [...prev, { id: uid("sec"), title: "新板块", items: [] }])
  const removeSection = (sid: string) =>
    setSections((prev) => prev.filter((s) => s.id !== sid))
  const moveSection = (sid: string, dir: "up" | "down") =>
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === sid)
      const j = dir === "up" ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  // —— 条目操作 ——
  const addItem = (sid: string, type: TopicItem["type"]) =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s
        const item: TopicItem =
          type === "text"
            ? { id: uid("it"), type: "text", content: "" }
            : { id: uid("it"), type: "question", label: "", stem: "" }
        return { ...s, items: [...s.items, item] }
      }),
    )
  const patchItem = (sid: string, iid: string, patch: Partial<TopicTextItem> & Partial<TopicQuestionItem>) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sid
          ? s
          : { ...s, items: s.items.map((it) => (it.id === iid ? ({ ...it, ...patch } as TopicItem) : it)) },
      ),
    )
  const removeItem = (sid: string, iid: string) =>
    setSections((prev) =>
      prev.map((s) => (s.id !== sid ? s : { ...s, items: s.items.filter((it) => it.id !== iid) })),
    )
  const moveItem = (sid: string, iid: string, dir: "up" | "down") =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s
        const i = s.items.findIndex((it) => it.id === iid)
        const j = dir === "up" ? i - 1 : i + 1
        if (i < 0 || j < 0 || j >= s.items.length) return s
        const items = [...s.items]
        ;[items[i], items[j]] = [items[j], items[i]]
        return { ...s, items }
      }),
    )

  function save() {
    if (!title.trim()) {
      toast.error("请填写专题标题")
      return
    }
    if (level !== "city" && !ownerScope) {
      toast.error("请选择完整的授权归属")
      return
    }
    const payload = {
      title: title.trim(),
      subject,
      description: description.trim() || undefined,
      level,
      ownerScope: ownerScope || undefined,
      sections,
    }
    if (isNew) {
      const newId = createTopic(payload)
      toast.success("专题已创建")
      router.replace(`/resources/premium/topics/${newId}`)
    } else {
      updateTopic(id, payload)
      toast.success("专题已保存")
    }
  }

  const qCount = topicQuestionCount({ sections })
  const vCount = topicVideoCount({ sections })

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <Link
          href="/resources/premium"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="size-4" /> 返回
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {isNew ? "新建专题" : title || "编辑专题"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {sections.length} 板块 · {qCount} 题 · {vCount} 视频
          </p>
        </div>
        <Button onClick={save} className="gap-1.5">
          保存专题
        </Button>
      </div>

      {/* 元信息 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">基本信息</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="专题标题">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：专题十 · 比和比例应用" />
          </Field>
          <Field label="学科">
            <Select value={subject} onValueChange={(v) => setSubject(v ?? "数学")} items={Object.fromEntries(SUBJECTS.map((s) => [s, s]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="专题简介">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话描述这个专题的内容与编排"
            rows={2}
          />
        </Field>
        <Field label="授权范围">
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
        </Field>
      </section>

      {/* 板块 */}
      <div className="space-y-4">
        {sections.map((sec, si) => (
          <SectionCard
            key={sec.id}
            section={sec}
            index={si}
            total={sections.length}
            onPatch={(patch) => patchSection(sec.id, patch)}
            onRemove={() => removeSection(sec.id)}
            onMove={(dir) => moveSection(sec.id, dir)}
            onAddItem={(type) => addItem(sec.id, type)}
            onPatchItem={(iid, patch) => patchItem(sec.id, iid, patch)}
            onRemoveItem={(iid) => removeItem(sec.id, iid)}
            onMoveItem={(iid, dir) => moveItem(sec.id, iid, dir)}
          />
        ))}

        <button
          onClick={addSection}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition hover:border-brand/50 hover:text-brand"
        >
          <Plus className="size-4" /> 添加板块
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function SectionCard({
  section,
  index,
  total,
  onPatch,
  onRemove,
  onMove,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onMoveItem,
}: {
  section: TopicSection
  index: number
  total: number
  onPatch: (patch: Partial<TopicSection>) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
  onAddItem: (type: TopicItem["type"]) => void
  onPatchItem: (iid: string, patch: Partial<TopicTextItem> & Partial<TopicQuestionItem>) => void
  onRemoveItem: (iid: string) => void
  onMoveItem: (iid: string, dir: "up" | "down") => void
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      {/* 板块头 */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Layers className="size-4 shrink-0 text-brand" />
        <Input
          value={section.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="板块名称，如 自我检测"
          className="h-8 max-w-xs border-transparent bg-transparent px-1 text-sm font-semibold focus-visible:border-input focus-visible:bg-background"
        />
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {section.items.length} 条
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="上移" disabled={index === 0} onClick={() => onMove("up")}>
            <ChevronUp className="size-4" />
          </IconBtn>
          <IconBtn label="下移" disabled={index === total - 1} onClick={() => onMove("down")}>
            <ChevronDown className="size-4" />
          </IconBtn>
          <IconBtn label="删除板块" danger onClick={onRemove}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      {/* 条目列表 */}
      <div className="space-y-3 p-4">
        {section.items.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">暂无条目，在下方添加文本块或题目</p>
        )}
        {section.items.map((it, ii) => (
          <ItemRow
            key={it.id}
            item={it}
            index={ii}
            total={section.items.length}
            onPatch={(patch) => onPatchItem(it.id, patch)}
            onRemove={() => onRemoveItem(it.id)}
            onMove={(dir) => onMoveItem(it.id, dir)}
          />
        ))}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAddItem("question")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <FileText className="size-3.5 text-brand" /> 添加题目
          </button>
          <button
            onClick={() => onAddItem("text")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <Type className="size-3.5 text-brand" /> 添加文本块
          </button>
        </div>
      </div>
    </section>
  )
}

function ItemRow({
  item,
  index,
  total,
  onPatch,
  onRemove,
  onMove,
}: {
  item: TopicItem
  index: number
  total: number
  onPatch: (patch: Partial<TopicTextItem> & Partial<TopicQuestionItem>) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
}) {
  const isQ = item.type === "question"
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        <GripVertical className="size-3.5 text-muted-foreground" />
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-medium",
            isQ ? "bg-brand-soft text-brand-soft-foreground" : "bg-accent text-accent-foreground",
          )}
        >
          {isQ ? "题目" : "文本块"}
        </span>
        {isQ && (
          <Input
            value={(item as TopicQuestionItem).label ?? ""}
            onChange={(e) => onPatch({ label: e.target.value })}
            placeholder="编号 如 例1 / 1"
            className="h-7 w-28 text-xs"
          />
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="上移" disabled={index === 0} onClick={() => onMove("up")}>
            <ChevronUp className="size-4" />
          </IconBtn>
          <IconBtn label="下移" disabled={index === total - 1} onClick={() => onMove("down")}>
            <ChevronDown className="size-4" />
          </IconBtn>
          <IconBtn label="删除" danger onClick={onRemove}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      {item.type === "text" ? (
        <div className="space-y-2">
          <Input
            value={item.title ?? ""}
            onChange={(e) => onPatch({ title: e.target.value })}
            placeholder="小标题（可选）"
            className="h-8 text-sm"
          />
          <Textarea
            value={item.content}
            onChange={(e) => onPatch({ content: e.target.value })}
            placeholder="讲解正文，如补充知识、自我归纳…"
            rows={3}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <LabeledMini label="题干">
            <Textarea
              value={(item as TopicQuestionItem).stem}
              onChange={(e) => onPatch({ stem: e.target.value })}
              placeholder="输入题干"
              rows={3}
            />
          </LabeledMini>
          <div className="grid gap-2 sm:grid-cols-2">
            <LabeledMini label="答案">
              <Input
                value={(item as TopicQuestionItem).answer ?? ""}
                onChange={(e) => onPatch({ answer: e.target.value })}
                placeholder="参考答案"
                className="h-8 text-sm"
              />
            </LabeledMini>
            <LabeledMini label="解析（可选）">
              <Input
                value={(item as TopicQuestionItem).analysis ?? ""}
                onChange={(e) => onPatch({ analysis: e.target.value })}
                placeholder="解题过程"
                className="h-8 text-sm"
              />
            </LabeledMini>
          </div>

          {/* 视频讲解 */}
          <div className="rounded-md border border-dashed border-border p-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Video className="size-3.5 text-brand" /> 视频讲解
            </div>
            <div className="grid gap-2 sm:grid-cols-[120px_1fr_90px]">
              <Input
                value={(item as TopicQuestionItem).video?.title ?? ""}
                onChange={(e) => onPatch({ video: { ...(item as TopicQuestionItem).video, title: e.target.value } })}
                placeholder="标题 如 视频1"
                className="h-8 text-sm"
              />
              <Input
                value={(item as TopicQuestionItem).video?.url ?? ""}
                onChange={(e) => onPatch({ video: { ...(item as TopicQuestionItem).video, url: e.target.value } })}
                placeholder="视频地址 URL"
                className="h-8 text-sm"
              />
              <Input
                value={(item as TopicQuestionItem).video?.duration ?? ""}
                onChange={(e) => onPatch({ video: { ...(item as TopicQuestionItem).video, duration: e.target.value } })}
                placeholder="时长"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LabeledMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition disabled:opacity-30",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
