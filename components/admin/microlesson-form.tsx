"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImageIcon, Paperclip, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { SUBJECTS, GRADES } from "@/lib/mock-data"
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
  MICROLESSON_CATEGORY_LABELS,
  MICROLESSON_STATUS_LABELS,
  type MicrolessonAttachment,
  type MicrolessonCategory,
  type MicrolessonStatus,
  type ResourceLevel,
} from "@/lib/types"

let _uid = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${_uid++}`

// 由归属名称反查级联 id（编辑时回填 OrgScopePicker）
function findScopeIds(ownerScope?: string) {
  let cityId = ""
  let districtId = ""
  let schoolId = ""
  if (!ownerScope) return { cityId, districtId, schoolId }
  for (const c of ORG_TREE) {
    if (c.name === ownerScope) return { cityId: c.id, districtId: "", schoolId: "" }
    for (const d of c.districts) {
      if (d.name === ownerScope) return { cityId: c.id, districtId: d.id, schoolId: "" }
      for (const s of d.schools) {
        if (s.name === ownerScope) return { cityId: c.id, districtId: d.id, schoolId: s.id }
      }
    }
  }
  return { cityId, districtId, schoolId }
}

export function MicrolessonForm({ id }: { id: string }) {
  const router = useRouter()
  const { microlessons, textbooks, chapters, knowledgePoints, createMicrolesson, updateMicrolesson } = useStore()
  const isNew = id === "new"
  const existing = isNew ? undefined : microlessons.find((m) => m.id === id)

  const [title, setTitle] = useState(existing?.title ?? "")
  const [subject, setSubject] = useState(existing?.subject ?? "数学")
  const [grade, setGrade] = useState(existing?.grade ?? "")
  const [duration, setDuration] = useState(existing?.duration ?? "")
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "")
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "")
  const [creatorName, setCreatorName] = useState(existing?.creatorName ?? "")
  const [creatorOrg, setCreatorOrg] = useState(existing?.creatorOrg ?? "")
  const [intro, setIntro] = useState(existing?.intro ?? "")
  const [category, setCategory] = useState<MicrolessonCategory>(existing?.category ?? "sync")
  const [status, setStatus] = useState<MicrolessonStatus>(existing?.status ?? "draft")
  const [attachments, setAttachments] = useState<MicrolessonAttachment[]>(existing?.attachments ?? [])
  const [kpIds, setKpIds] = useState<string[]>(existing?.knowledgePointIds ?? [])
  const [mounts, setMounts] = useState<{ textbookId: string; chapterId: string }[]>(existing?.chapterMounts ?? [])

  const [level, setLevel] = useState<ResourceLevel>(existing?.level ?? "city")
  const initIds = findScopeIds(existing?.ownerScope)
  const [cityId, setCityId] = useState(initIds.cityId)
  const [districtId, setDistrictId] = useState(initIds.districtId)
  const [schoolId, setSchoolId] = useState(initIds.schoolId)
  const [ownerScope, setOwnerScope] = useState(existing?.ownerScope ?? "")

  if (!isNew && !existing) {
    return (
      <div className="space-y-4">
        <Link href="/resources/microlessons" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
          <ArrowLeft className="size-4" /> 返回微课
        </Link>
        <p className="text-sm text-muted-foreground">未找到该微课，可能已被删除。</p>
      </div>
    )
  }

  // 年级筛选可挂载的教材（年级一致或未选年级时全部）
  const gradeTextbooks = textbooks.filter((t) => (grade ? t.grade === grade : true) && t.subject === subject)

  const toggleKp = (kpId: string) =>
    setKpIds((prev) => (prev.includes(kpId) ? prev.filter((x) => x !== kpId) : [...prev, kpId]))

  const addMount = () => setMounts((prev) => [...prev, { textbookId: "", chapterId: "" }])
  const patchMount = (i: number, patch: Partial<{ textbookId: string; chapterId: string }>) =>
    setMounts((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  const removeMount = (i: number) => setMounts((prev) => prev.filter((_, idx) => idx !== i))

  function save() {
    if (!title.trim()) {
      toast.error("请填写微课标题")
      return
    }
    if (!grade) {
      toast.error("请选择年级")
      return
    }
    if (level !== "city" && !ownerScope) {
      toast.error("请选择完整的授权归属")
      return
    }
    const validMounts = mounts.filter((m) => m.textbookId && m.chapterId)
    const payload = {
      title: title.trim(),
      subject,
      grade,
      duration: duration.trim() || "00:00",
      videoUrl: videoUrl.trim() || undefined,
      coverImage: coverImage || undefined,
      creatorName: creatorName.trim() || undefined,
      creatorOrg: creatorOrg.trim() || undefined,
      intro: intro.trim() || undefined,
      category,
      status,
      attachments,
      level,
      ownerScope: ownerScope || undefined,
      knowledgePointIds: kpIds,
      chapterMounts: validMounts,
    }
    if (isNew) {
      createMicrolesson(payload)
      toast.success("微课已创建")
      router.replace("/resources/microlessons")
    } else {
      updateMicrolesson(id, payload)
      toast.success("微课已保存")
      router.replace("/resources/microlessons")
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <Link
          href="/resources/microlessons"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="size-4" /> 返回
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {isNew ? "新建微课" : title || "编辑微课"}
          </h1>
          <p className="text-xs text-muted-foreground">配置年级、章节挂载、视频与创作者信息</p>
        </div>
        <Button onClick={save} className="gap-1.5">
          保存微课
        </Button>
      </div>

      {/* 基本信息 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">基本信息</h2>
        <Field label="微课标题" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：认识负数与数轴" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
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
          <Field label="年级" required>
            <Select value={grade} onValueChange={(v) => setGrade(v ?? "")} items={Object.fromEntries(GRADES.map((g) => [g, g]))}>
              <SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="时长">
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="如：08:30" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="微课分类">
            <Select
              value={category}
              onValueChange={(v) => setCategory((v ?? "sync") as MicrolessonCategory)}
              items={MICROLESSON_CATEGORY_LABELS}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MICROLESSON_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="状态">
            <Select
              value={status}
              onValueChange={(v) => setStatus((v ?? "draft") as MicrolessonStatus)}
              items={MICROLESSON_STATUS_LABELS}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MICROLESSON_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="简介 / 课程描述">
          <Textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="一句话描述这节微课讲解的内容"
            rows={2}
          />
        </Field>
      </section>

      {/* 创作者 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">创作者</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="创作者姓名">
            <Input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="如：王明" />
          </Field>
          <Field label="创作者单位 / 学校">
            <Input value={creatorOrg} onChange={(e) => setCreatorOrg(e.target.value)} placeholder="如：上海市徐汇区第一中心小学" />
          </Field>
        </div>
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

      {/* 媒体 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">视频与素材</h2>
        <Field label="视频链接">
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="封面图">
          <CoverUploader value={coverImage} onChange={setCoverImage} />
        </Field>
        <Field label="附件">
          <AttachmentUploader
            attachments={attachments}
            onAdd={(name, url, size) => setAttachments((prev) => [...prev, { id: uid("att"), name, url, size }])}
            onRemove={(attId) => setAttachments((prev) => prev.filter((a) => a.id !== attId))}
          />
        </Field>
      </section>

      {/* 章节挂载 */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">教材章节挂载</h2>
          <Button size="sm" variant="outline" onClick={addMount} className="gap-1.5">
            添加挂载
          </Button>
        </div>
        {mounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">可选：将微课挂载到具体教材章节，便于在教材目录中调用。</p>
        ) : (
          <div className="space-y-3">
            {mounts.map((m, i) => {
              const tbChapters = chapters.filter((c) => c.textbookId === m.textbookId && c.parentId !== null)
              return (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={m.textbookId}
                    onValueChange={(v) => patchMount(i, { textbookId: v ?? "", chapterId: "" })}
                    items={Object.fromEntries(gradeTextbooks.map((t) => [t.id, `${t.name}（${t.version}）`]))}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="选择教材" /></SelectTrigger>
                    <SelectContent>
                      {gradeTextbooks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}（{t.version}）</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={m.chapterId}
                    onValueChange={(v) => patchMount(i, { chapterId: v ?? "" })}
                    items={Object.fromEntries(tbChapters.map((c) => [c.id, c.title]))}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="选择章节" /></SelectTrigger>
                    <SelectContent>
                      {tbChapters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => removeMount(i)}
                    aria-label="移除挂载"
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 知识点 */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">关联知识点（已选 {kpIds.length}）</h2>
        <div className="flex flex-wrap gap-2">
          {knowledgePoints
            .filter((kp) => kp.subject === subject)
            .map((kp) => {
              const active = kpIds.includes(kp.id)
              return (
                <button
                  key={kp.id}
                  onClick={() => toggleKp(kp.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    active
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {kp.name}
                </button>
              )
            })}
        </div>
      </section>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </div>
  )
}

// 封面图模拟上传：选图后用本地 object URL 预览
function CoverUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            onChange(URL.createObjectURL(f))
            toast.success("封面已上传", { description: f.name })
          }
        }}
      />
      {value ? (
        <div className="relative size-16 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value || "/placeholder.svg"} alt="微课封面" className="size-full object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-background/90 text-muted-foreground hover:text-destructive"
            aria-label="移除封面"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid size-16 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
          <ImageIcon className="size-5" />
        </div>
      )}
      <button
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
      >
        <Upload className="size-3.5" /> {value ? "更换封面" : "上传封面"}
      </button>
    </div>
  )
}

// 附件模拟上传：选文件后记录文件名与本地 object URL
function AttachmentUploader({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: MicrolessonAttachment[]
  onAdd: (name: string, url: string, size: string) => void
  onRemove: (id: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(f.size / 1024)} KB`
            onAdd(f.name, URL.createObjectURL(f), size)
            toast.success("附件已上传", { description: f.name })
            e.target.value = ""
          }
        }}
      />
      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
              <Paperclip className="size-3.5 shrink-0 text-brand" />
              <span className="min-w-0 flex-1 truncate text-foreground">{a.name}</span>
              {a.size && <span className="text-muted-foreground">{a.size}</span>}
              <button
                onClick={() => onRemove(a.id)}
                aria-label="移除附件"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
      >
        <Upload className="size-3.5" /> 上传附件
      </button>
    </div>
  )
}
