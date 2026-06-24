"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ClipboardList,
  Crown,
  Library,
  MonitorPlay,
  PenLine,
  Replace,
  Search,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

// 资源中心二级菜单：题库 / 作业 / 精品资源 / 微课 / 空中课堂
const RESOURCE_CHILDREN = [
  { href: "/resources/questions", label: "题库", icon: PenLine },
  { href: "/resources/assignments", label: "作业", icon: ClipboardList },
  { href: "/resources/premium", label: "精品资源", icon: Crown },
  { href: "/resources/microlessons", label: "微课", icon: Video },
  { href: "/resources/airclasses", label: "空中课堂", icon: MonitorPlay },
]

const NAV = [
  { href: "/textbooks", label: "教材管理", icon: BookOpen },
  { href: "/resources", label: "资源中心", icon: Library, children: RESOURCE_CHILDREN },
  { href: "/migrate", label: "教材同步关系", icon: Replace },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PenLine className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">点这笔</p>
            <p className="text-[11px] text-muted-foreground">资源后台管理</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            配置流程
          </p>
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <div key={item.href}>
                <Link
                  href={item.children ? item.children[0].href : item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
                {item.children && active && (
                  <div className="mt-1 flex flex-col gap-0.5 pl-4">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-1.5 text-[13px] transition-colors",
                            childActive
                              ? "border-sidebar-primary bg-sidebar-accent/70 font-medium text-sidebar-accent-foreground"
                              : "border-transparent text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                          )}
                        >
                          <ChildIcon className="size-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                运营
              </AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="text-sm font-medium text-sidebar-foreground">资源运营</p>
              <p className="text-[11px] text-muted-foreground">admin@dianzhebi.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索教材、章节、题目…"
              className="h-9 bg-muted/60 pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground sm:inline">
              2026 学年
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
