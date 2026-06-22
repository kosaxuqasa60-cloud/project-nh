"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, ChevronRight, FileStack, Plus } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { TextbookFormDialog } from "@/components/admin/textbook-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { STAGE_LABELS, VOLUME_LABELS } from "@/lib/types"

const ALL = "all"

export default function TextbooksPage() {
  const { textbooks, countQuestionsByTextbook } = useStore()
  const [subject, setSubject] = useState(ALL)
  const [version, setVersion] = useState(ALL)
  const [year, setYear] = useState(ALL)
  const [status, setStatus] = useState(ALL)

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

  return (
    <div>
      <PageHeader
        title="教材管理"
        description="维护各版本教材。题目与作业以多对多方式挂载到教材章节，同一道题可同时归属多个教材。"
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

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
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
            ({ published: "已发布", draft: "草稿", archived: "已归档" })[s] ?? s
          }
        />
        <span className="ml-auto text-sm text-muted-foreground">
          共 {filtered.length} 套教材
        </span>
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
              <TableHead>题目数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right pr-5">操作</TableHead>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/textbooks/${t.id}`} />}
                  >
                    配置目录 <ChevronRight className="size-4" />
                  </Button>
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
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange} items={items}>
        <SelectTrigger className="h-9 w-[130px]">
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
