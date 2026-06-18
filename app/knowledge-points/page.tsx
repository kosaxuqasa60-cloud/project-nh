"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FileStack, ListTree, Plus, Tags } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { SUBJECTS } from "@/lib/mock-data"

export default function KnowledgePointsPage() {
  const { knowledgePoints, questions, chapters, textbooks, addKnowledgePoint } = useStore()
  const [name, setName] = useState("")
  const [group, setGroup] = useState("")
  const [subject, setSubject] = useState("数学")
  const [open, setOpen] = useState(false)

  // 按 group 分组展示
  const grouped = useMemo(() => {
    const map = new Map<string, typeof knowledgePoints>()
    knowledgePoints.forEach((kp) => {
      const arr = map.get(kp.group) ?? []
      arr.push(kp)
      map.set(kp.group, arr)
    })
    return Array.from(map.entries())
  }, [knowledgePoints])

  const qCountOf = (kpId: string) =>
    questions.filter((q) => q.knowledgePointIds.includes(kpId)).length
  const chapterCountOf = (kpId: string) =>
    chapters.filter((c) => c.knowledgePointIds.includes(kpId)).length

  const subjectItems = Object.fromEntries(SUBJECTS.map((s) => [s, s]))

  function submit() {
    if (!name.trim()) {
      toast.error("请填写知识点名称")
      return
    }
    addKnowledgePoint({ name: name.trim(), group: group.trim() || "未分组", subject })
    toast.success("已新增知识点")
    setName("")
    setGroup("")
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="知识点体系"
        description="知识点是跨教材通用的稳定锚点。题目打知识点标签、章节声明覆盖的知识点，系统据此自动归集题目到任意版本教材的对应章节 —— 这是降低挂载人力的核心。"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" /> 新增知识点</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新增知识点</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>学科</Label>
                <Select value={subject} onValueChange={setSubject} items={subjectItems}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>所属分组 / 主题</Label>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="如：有理数、整式"
                />
              </div>
              <div className="space-y-1.5">
                <Label>知识点名称</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：有理数的加减运算"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">取消</Button>} />
              <Button onClick={submit}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={<Tags className="size-5" />} value={knowledgePoints.length} label="知识点总数" />
        <MiniStat icon={<FileStack className="size-5" />} value={questions.filter((q) => q.knowledgePointIds.length > 0).length} label="已打标题目" />
        <MiniStat icon={<ListTree className="size-5" />} value={chapters.filter((c) => c.knowledgePointIds.length > 0).length} label="已声明章节" />
      </div>

      <div className="space-y-5">
        {grouped.map(([groupName, kps]) => (
          <div key={groupName}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              {groupName}
              <span className="text-xs">（{kps.length}）</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {kps.map((kp) => {
                const qc = qCountOf(kp.id)
                const cc = chapterCountOf(kp.id)
                return (
                  <Card key={kp.id} className="transition-colors hover:border-primary/40">
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug text-balance">{kp.name}</p>
                        <Badge variant="secondary" className="shrink-0 font-normal">
                          {kp.subject}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileStack className="size-3.5" /> {qc} 道题
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ListTree className="size-3.5" /> {cc} 个章节声明
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
