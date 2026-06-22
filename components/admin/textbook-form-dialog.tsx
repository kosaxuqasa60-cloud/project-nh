"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GRADES, SUBJECTS, VERSIONS } from "@/lib/mock-data"
import { useStore } from "@/lib/store"
import {
  STAGE_LABELS,
  VOLUME_LABELS,
  type Stage,
  type Volume,
} from "@/lib/types"

const CURRENT_YEAR = 2026
const YEARS = Array.from({ length: 9 }, (_, i) => CURRENT_YEAR - i)
const YEAR_ITEMS = Object.fromEntries(YEARS.map((y) => [String(y), `${y} 年`]))

export function TextbookFormDialog({ trigger }: { trigger: React.ReactNode }) {
  const { addTextbook } = useStore()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("数学")
  const [version, setVersion] = useState("人教版")
  const [stage, setStage] = useState<Stage>("junior")
  const [grade, setGrade] = useState("七年级")
  const [volume, setVolume] = useState<Volume>("upper")
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [name, setName] = useState("")
  const [cover, setCover] = useState<string>("")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCover(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("请填写教材名称")
      return
    }
    addTextbook({
      name: name.trim(),
      subject,
      version,
      stage,
      grade,
      volume,
      year: Number(year),
      status: "draft",
      cover: cover || undefined,
    })
    toast.success("教材已创建（草稿）", {
      description: "可在教材详情中继续编辑章节目录",
    })
    setOpen(false)
    setName("")
    setCover("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新建教材</DialogTitle>
          <DialogDescription>
            教材是题目与作业挂载的载体。先确定基础信息，创建后再编辑章节目录。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>封面</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPick}
            />
            {cover ? (
              <div className="relative w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover || "/placeholder.svg"}
                  alt="教材封面预览"
                  className="aspect-[3/4] w-24 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCover("")}
                  className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  aria-label="移除封面"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[3/4] w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <ImagePlus className="size-5" />
                <span className="text-[11px]">上传封面</span>
              </button>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tb-name">教材名称</Label>
            <Input
              id="tb-name"
              placeholder="如：义务教育教科书·数学（七年级上册）"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="学科">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="版本">
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERSIONS.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="学段">
              <Select value={stage} onValueChange={(v) => setStage(v as Stage)} items={STAGE_LABELS}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAGE_LABELS) as Stage[]).map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="年级">
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="册次">
              <Select value={volume} onValueChange={(v) => setVolume(v as Volume)} items={VOLUME_LABELS}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(VOLUME_LABELS) as Volume[]).map((v) => (
                    <SelectItem key={v} value={v}>{VOLUME_LABELS[v]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="教材年份">
              <Select value={year} onValueChange={setYear} items={YEAR_ITEMS}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>创建教材</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
