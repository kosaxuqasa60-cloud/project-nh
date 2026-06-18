"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  FileStack,
  ListTree,
  PenLine,
  Replace,
  Tags,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export default function OverviewPage() {
  const { textbooks, chapters, questions, assignments, knowledgePoints } = useStore()

  const stats = [
    { label: "教材", value: textbooks.length, icon: BookOpen, href: "/textbooks" },
    { label: "知识点", value: knowledgePoints.length, icon: Tags, href: "/knowledge-points" },
    { label: "题目", value: questions.length, icon: FileStack, href: "/questions" },
    { label: "作业", value: assignments.length, icon: PenLine, href: "/assignments" },
  ]

  const steps = [
    {
      n: 1,
      title: "建立教材与章节目录",
      desc: "按学科 / 学段 / 年级 / 册次 / 版本 / 年份维护教材，并为每套教材搭建树状章节目录。",
      icon: BookOpen,
      href: "/textbooks",
      action: "进入教材管理",
    },
    {
      n: 2,
      title: "维护知识点 + 题目打标签",
      desc: "知识点是跨教材的稳定锚点。题目只需打一次知识点标签，即可被任意版本教材复用归集。",
      icon: Tags,
      href: "/knowledge-points",
      action: "进入知识点体系",
    },
    {
      n: 3,
      title: "章节批量挂题（非逐题）",
      desc: "在章节上一键按知识点自动归集题目，或批量勾选挂入。操作在章节层，不再一题一题挂。",
      icon: FileStack,
      href: "/textbooks",
      action: "去教材详情批量挂题",
    },
    {
      n: 4,
      title: "教材同步关系",
      desc: "把两套教材的目录手工对应，并为每条对应勾选要同步的资源：题目 / 作业 / 微课 / 空中课堂。",
      icon: Replace,
      href: "/migrate",
      action: "进入教材同步关系",
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
            <p className="font-medium">如何把挂载的人力成本降下来</p>
          </div>
          <ul className="ml-1 space-y-1.5 text-sm text-muted-foreground">
            <li>· 操作从「单题」上移到「章节 + 批量」：在章节上批量挂题，不再逐题点。</li>
            <li>· 知识点中间层：题目打一次知识点标签，即可被任意版本教材的章节自动归集。</li>
            <li>· 教材间靠「同步关系」：手工把两套教材的目录两两对应，并逐条勾选要同步的资源（题目 / 作业 / 微课 / 空中课堂）。</li>
            <li>· 教材带「年份」字段，旧版本归档保留，新版本独立维护，互不影响。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
