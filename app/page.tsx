"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  FileStack,
  ListTree,
  PenLine,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export default function OverviewPage() {
  const { textbooks, chapters, questions, assignments } = useStore()

  const stats = [
    { label: "教材", value: textbooks.length, icon: BookOpen, href: "/textbooks" },
    { label: "章节节点", value: chapters.length, icon: ListTree, href: "/chapters" },
    { label: "题目", value: questions.length, icon: FileStack, href: "/questions" },
    { label: "作业", value: assignments.length, icon: PenLine, href: "/assignments" },
  ]

  const steps = [
    {
      n: 1,
      title: "建立教材",
      desc: "按学科 / 学段 / 年级 / 册次 / 版本 / 年份维护教材。教材是题目与作业的挂载载体。",
      icon: BookOpen,
      href: "/textbooks",
      action: "进入教材管理",
    },
    {
      n: 2,
      title: "编辑章节目录",
      desc: "为每套教材搭建树状章节目录。目录节点是题目挂载的最小颗粒。",
      icon: ListTree,
      href: "/chapters",
      action: "编辑章节目录",
    },
    {
      n: 3,
      title: "维护题库并挂载",
      desc: "题目独立存在，通过多对多挂载关联到一个或多个教材的章节。换教材无需迁移题目。",
      icon: FileStack,
      href: "/questions",
      action: "进入题库管理",
    },
    {
      n: 4,
      title: "组卷成作业",
      desc: "把题目组合成作业，作业同样可关联多个教材，实现跨版本复用。",
      icon: PenLine,
      href: "/assignments",
      action: "进入作业管理",
    },
  ]

  return (
    <div>
      <PageHeader
        title="后台配置流程总览"
        description="资源平台支持教材切换。后台以「教材 → 章节目录 → 题目 / 作业挂载」的链路组织内容，题目与作业以多对多方式挂载，一份资源可被多个版本教材复用。"
      />

      {/* 数据概览 */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 配置流程 */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        配置流程
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Card key={step.n} className="group">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {step.n}
                  </div>
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 space-y-2 pb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <h3 className="font-medium">{step.title}</h3>
                  </div>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {step.action}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 设计说明 */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">设计要点</Badge>
            <p className="font-medium">关于「换教材」的内容关系</p>
          </div>
          <ul className="ml-1 space-y-1.5 text-sm text-muted-foreground">
            <li>· 题目 / 作业不绑定单一教材，而是以「多对多挂载」关联到教材的章节节点。</li>
            <li>· 同一道题可同时挂载在人教版与北师大版的不同章节下，换教材时无需迁移题目。</li>
            <li>· 教材带「年份」字段，旧版本可归档保留，新版本独立维护，互不影响。</li>
            <li>· 后续若需自动对应，可在此基础上叠加「章节映射」或「知识点中间层」，当前结构已为其预留空间。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
