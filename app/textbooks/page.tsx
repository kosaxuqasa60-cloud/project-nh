"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BookOpen,
  FileStack,
  ListTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { TextbookFormDialog } from "@/components/admin/textbook-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
import { SUBJECTS, VERSIONS } from "@/lib/mock-data"
import { useStore } from "@/lib/store"
import { STAGE_LABELS, VOLUME_LABELS, type Textbook } from "@/lib/types"

const ALL = "all"

export default function TextbooksPage() {
  const { textbooks, countQuestionsByTextbook, updateTextbook } = useStore()
  const [subject, setSubject] = useState(ALL)
  const [version, setVersion] = useState(ALL)
  const [year, setYear] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [editing, setEditing] = useState<Textbook | null>(null)

  const years = useMemo(
    () => Array.from(new Set(textbooks.map((t) => t.year))).sort((a, b) => b - a),
    [textbooks],
  )

  const filtered = textbooks.filter(
    (t) =>
      (subject === ALL || t.subject === subject) &&
      (version === ALL || t.version === version) &&
      (year === ALL || String(t.year) === year) &&
      (status === ALL || t.status === status),
  )

  function publish(t: Textbook) {
    updateTextbook(t.id, { status: "published" })
    toast.success(`《${t.name}》已发布`)
  }
  function takeDown(t: Textbook) {
    updateTextbook(t.id, { status: "archived" })
    toast.success(`《${t.name}》已下架`)
  }

  return (
    <div>
      <PageHeader
        title="教材管理"
        description="维护各版本教材。题目、作业、微课、空中课堂以多对多方式挂载到教材章节，同一资源可同时归属多个教材。"
        actions={
          <TextbookFormDialog
            trigger={
              <Button>
                <Plus className="size-4" /> 新建教材
              </Button>
            }
          />
        }
      />

      {/* 横排筛选 */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect label="学科" value={subject} onChange={setSubject} options={SUBJECTS} />
          <FilterSelect label="版本" value={version} onChange={setVersion} options={VERSIONS} />
          <FilterSelect
            label="年份"
            value={year}
            onChange={setYear}
            options={years.map(String)}
            render={(y) => `${y} 年`}
          />
          <FilterSelect
            label="状态"
            value={status}
            onChange={setStatus}
            options={["published", "draft", "archived"]}
            render={(s) =>
              ({ published: "已发布", draft: "草稿", archived: "已下架" })[s] ?? s
            }
          />
          <div className="ml-auto flex items-center gap-3 pb-2">
            {(subject !== ALL || version !== ALL || year !== ALL || status !== ALL) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubject(ALL)
                  setVersion(ALL)
                  setYear(ALL)
                  setStatus(ALL)
                }}
              >
                重置
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              共 <span className="font-medium text-foreground">{filtered.length}</span> 套教材
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-16 pl-5">封面</TableHead>
              <TableHead>教材名称</TableHead>
              <TableHead>学科</TableHead>
              <TableHead>学段 / 年级 / 册次</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>年份</TableHead>
              <TableHead>资源数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} className="group">
                <TableCell className="pl-5">
                  <Link href={`/textbooks/${t.id}`} className="block">
                    {t.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.cover || "/placeholder.svg"}
                        alt={`${t.name} 封面`}
                        className="aspect-[3/4] w-10 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-10 items-center justify-center rounded border border-border bg-muted text-muted-foreground">
                        <BookOpen className="size-4" />
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Link
                    href={`/textbooks/${t.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {t.subject}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {STAGE_LABELS[t.stage]} · {t.grade} · {VOLUME_LABELS[t.volume]}
                </TableCell>
                <TableCell className="text-sm">{t.version}</TableCell>
                <TableCell className="text-sm tabular-nums">{t.year}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
                    <FileStack className="size-3.5" />
                    {countQuestionsByTextbook(t.id)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/textbooks/${t.id}`} />}
                    >
                      <ListTree className="size-4" /> 配置目录
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">更多操作</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setEditing(t)}>
                          <Pencil className="size-4" /> 编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/textbooks/${t.id}`} />}>
                          <ListTree className="size-4" /> 配置目录
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {t.status === "published" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => takeDown(t)}
                          >
                            <ArrowDownToLine className="size-4" /> 下架
                          </DropdownMenuItem>
                        ) : t.status === "archived" ? (
                          <DropdownMenuItem onClick={() => publish(t)}>
                            <ArrowUpToLine className="size-4" /> 重新上架
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => publish(t)}>
                            <Send className="size-4" /> 发布
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                  没有符合条件的教材
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 编辑基础信息（受控） */}
      {editing && (
        <TextbookFormDialog
          textbook={editing}
          open={Boolean(editing)}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  render?: (v: string) => string
}) {
  const items = {
    all: "全部",
    ...Object.fromEntries(options.map((o) => [o, render ? render(o) : o])),
  }
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} items={items}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {render ? render(o) : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
