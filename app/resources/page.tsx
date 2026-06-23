"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  FileStack,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Video,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { LevelBadge } from "@/components/admin/level-badge"
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SUBJECTS } from "@/lib/mock-data"
import { useStore } from "@/lib/store"
import {
  RESOURCE_LEVEL_LABELS,
  RESOURCE_LEVELS,
  SYNC_RESOURCE_LABELS,
  SYNC_RESOURCE_TYPES,
  type AirClass,
  type Assignment,
  type Microlesson,
  type Question,
  type ResourceLevel,
  type SyncResourceType,
} from "@/lib/types"

type AnyResource = Question | Assignment | Microlesson | AirClass

const KIND_ICON: Record<SyncResourceType, typeof FileStack> = {
  question: FileStack,
  assignment: FileText,
  microlesson: Video,
  airclass: Radio,
}

const ALL = "all"

export default function ResourceCenterPage() {
  const {
    questions,
    assignments,
    microlessons,
    airClasses,
    resourcesByKind,
    mountCountByResource,
    removeResource,
  } = useStore()

  const [kind, setKind] = useState<SyncResourceType>("question")
  const [subject, setSubject] = useState(ALL)
  const [level, setLevel] = useState(ALL)
  const [mountStatus, setMountStatus] = useState(ALL) // all | mounted | unmounted
  const [keyword, setKeyword] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AnyResource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; mounts: number } | null>(null)

  // 当前类型的原始资源（用于编辑回填）
  const rawList: AnyResource[] = useMemo(() => {
    if (kind === "question") return questions
    if (kind === "assignment") return assignments
    if (kind === "microlesson") return microlessons
    return airClasses
  }, [kind, questions, assignments, microlessons, airClasses])

  // 各类型计数（tab 角标）
  const countByKind = useMemo(() => {
    const m = {} as Record<SyncResourceType, number>
    for (const k of SYNC_RESOURCE_TYPES) m[k] = resourcesByKind(k).length
    return m
  }, [resourcesByKind])

  const rows = useMemo(() => {
    return resourcesByKind(kind)
      .filter((r) => {
        if (subject !== ALL && r.subject !== subject) return false
        if (level !== ALL && r.level !== level) return false
        const mounts = r.chapterMounts.length
        if (mountStatus === "mounted" && mounts === 0) return false
        if (mountStatus === "unmounted" && mounts > 0) return false
        if (keyword && !r.title.includes(keyword)) return false
        return true
      })
      .map((r) => ({ ...r, mounts: mountCountByResource(kind, r.id) }))
  }, [resourcesByKind, kind, subject, level, mountStatus, keyword, mountCountByResource])

  function switchKind(k: SyncResourceType) {
    setKind(k)
    setSubject(ALL)
    setLevel(ALL)
    setMountStatus(ALL)
    setKeyword("")
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(id: string) {
    const raw = rawList.find((r) => r.id === id) ?? null
    setEditing(raw)
    setFormOpen(true)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    removeResource(kind, deleteTarget.id)
    toast.success(`已删除${SYNC_RESOURCE_LABELS[kind]}`, {
      description: deleteTarget.mounts > 0 ? `并解除了 ${deleteTarget.mounts} 处章节挂载` : undefined,
    })
    setDeleteTarget(null)
  }

  const hasFilter = subject !== ALL || level !== ALL || mountStatus !== ALL || keyword !== ""

  return (
    <div>
      <PageHeader
        title="资源中心"
        description="统一创建与维护题目、作业、微课、空中课堂。资源带学科与级别归属，进入资源库后可在教材章节中挂载使用。"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> 新建{SYNC_RESOURCE_LABELS[kind]}
          </Button>
        }
      />

      {/* 类型 tab */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {SYNC_RESOURCE_TYPES.map((k) => {
          const Icon = KIND_ICON[k]
          const active = kind === k
          return (
            <button
              key={k}
              onClick={() => switchKind(k)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {SYNC_RESOURCE_LABELS[k]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {countByKind[k]}
              </span>
            </button>
          )
        })}
      </div>

      {/* 横排筛选 */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FilterField label="学科">
          <Select
            value={subject}
            onValueChange={setSubject}
            items={{ [ALL]: "全部学科", ...Object.fromEntries(SUBJECTS.map((s) => [s, s])) }}
          >
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部学科</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="级别">
          <Select
            value={level}
            onValueChange={setLevel}
            items={{ [ALL]: "全部级别", ...RESOURCE_LEVEL_LABELS }}
          >
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部级别</SelectItem>
              {RESOURCE_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{RESOURCE_LEVEL_LABELS[l]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="挂载状态">
          <Select
            value={mountStatus}
            onValueChange={setMountStatus}
            items={{ [ALL]: "全部", mounted: "已挂载", unmounted: "未挂载" }}
          >
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部</SelectItem>
              <SelectItem value="mounted">已挂载</SelectItem>
              <SelectItem value="unmounted">未挂载</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="搜索">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标题 / 题干…"
            className="h-9 w-56"
          />
        </FilterField>
        {hasFilter && (
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setSubject(ALL)
              setLevel(ALL)
              setMountStatus(ALL)
              setKeyword("")
            }}
          >
            重置
          </Button>
        )}
      </div>

      {/* 列表 */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">{SYNC_RESOURCE_LABELS[kind]}</TableHead>
              <TableHead className="w-24">学科</TableHead>
              <TableHead className="w-44">级别 / 归属</TableHead>
              <TableHead className="w-28">挂载状态</TableHead>
              <TableHead className="w-28">更新时间</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="group">
                <TableCell className="max-w-md pl-5">
                  <p className="line-clamp-1 font-medium text-foreground">{r.title}</p>
                  {r.subtitle && (
                    <Badge variant="secondary" className="mt-1 font-normal">{r.subtitle}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.subject}</TableCell>
                <TableCell>
                  <LevelBadge level={r.level} ownerScope={r.ownerScope} />
                </TableCell>
                <TableCell>
                  {r.mounts > 0 ? (
                    <span className="text-sm text-foreground">已挂载 {r.mounts} 处</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">未挂载</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.updatedAt}</TableCell>
                <TableCell className="pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">更多操作</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(r.id)}>
                        <Pencil className="size-4" /> 编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget({ id: r.id, title: r.title, mounts: r.mounts })}
                      >
                        <Trash2 className="size-4" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  {hasFilter
                    ? "没有符合筛选条件的资源。"
                    : `还没有${SYNC_RESOURCE_LABELS[kind]}，点右上角「新建」开始创建。`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {formOpen && (
        <ResourceFormDialog kind={kind} open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除{SYNC_RESOURCE_LABELS[kind]}</DialogTitle>
            <DialogDescription>
              确认删除「{deleteTarget?.title}」？
              {deleteTarget && deleteTarget.mounts > 0
                ? ` 该资源当前挂载在 ${deleteTarget.mounts} 处章节，删除后会一并解除。`
                : " 此操作不可撤销。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
