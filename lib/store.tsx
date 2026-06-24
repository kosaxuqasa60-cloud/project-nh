"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  airClasses as seedAirClasses,
  assignments as seedAssignments,
  chapters as seedChapters,
  knowledgePoints as seedKnowledgePoints,
  microlessons as seedMicrolessons,
  premiums as seedPremiums,
  questions as seedQuestions,
  syncLinks as seedSyncLinks,
  textbooks as seedTextbooks,
} from "./mock-data"
import { PREMIUM_CATEGORY_LABELS, QUESTION_TYPE_LABELS } from "./types"
import type {
  AirClass,
  Assignment,
  ChapterNode,
  ChapterSyncLink,
  KnowledgePoint,
  Microlesson,
  NormalizedResource,
  Premium,
  Question,
  ResourceKind,
  ResourceLevel,
  SyncResourceType,
  Textbook,
} from "./types"

interface StoreValue {
  textbooks: Textbook[]
  chapters: ChapterNode[]
  questions: Question[]
  assignments: Assignment[]
  microlessons: Microlesson[]
  airClasses: AirClass[]
  premiums: Premium[]
  knowledgePoints: KnowledgePoint[]
  syncLinks: ChapterSyncLink[]
  addTextbook: (tb: Omit<Textbook, "id" | "updatedAt">) => Textbook
  updateTextbook: (id: string, patch: Partial<Textbook>) => void
  addChapter: (c: Omit<ChapterNode, "id">) => void
  updateChapter: (id: string, patch: Partial<ChapterNode>) => void
  removeChapter: (id: string) => void
  // 批量导入章节目录：rows 为 { level, title }，level=1 为章、2 为节、3 为子目，replace 表示清空原目录后导入
  importChapters: (
    textbookId: string,
    rows: { level: number; title: string }[],
    replace: boolean,
  ) => number
  // 知识点
  addKnowledgePoint: (kp: Omit<KnowledgePoint, "id">) => void
  setChapterKnowledgePoints: (chapterId: string, kpIds: string[]) => void
  // 通用资源：按类型取归一化资源列表（含精品资源）
  resourcesByKind: (kind: ResourceKind) => NormalizedResource[]
  // 资源中心：创建各类资源（进库，未挂载）；version/versions 由 store 自动初始化为 v1
  addQuestion: (
    q: Omit<Question, "id" | "updatedAt" | "chapterMounts" | "version" | "versions"> & {
      chapterMounts?: Question["chapterMounts"]
    },
  ) => void
  addAssignment: (
    a: Omit<Assignment, "id" | "updatedAt" | "chapterMounts" | "textbookIds" | "status">,
  ) => void
  addMicrolesson: (m: Omit<Microlesson, "id" | "updatedAt" | "chapterMounts">) => void
  addAirClass: (a: Omit<AirClass, "id" | "updatedAt" | "chapterMounts">) => void
  addPremium: (p: Omit<Premium, "id" | "updatedAt" | "chapterMounts">) => void
  // 题目版本：另存为新版本（旧版本归档保留统计，新版本成为当前生效版本，统计清零）
  saveQuestionAsNewVersion: (
    familyId: string,
    content: { stem: string; type: Question["type"]; options?: Question["options"]; answer?: string; analysis?: string },
    changeNote: string,
  ) => void
  // 题目族级汇总统计（跨所有版本累计）
  questionFamilyStats: (familyId: string) => { totalUsed: number; totalStudents: number; versionCount: number }
  // 资源中心：编辑 / 删除（删除会一并解除所有章节挂载）
  updateResource: (kind: ResourceKind, id: string, patch: Record<string, unknown>) => void
  removeResource: (kind: ResourceKind, id: string) => void
  // 资源中心：批量管理
  batchUpdateLevel: (
    kind: ResourceKind,
    ids: string[],
    level: ResourceLevel,
    ownerScope?: string,
  ) => void
  batchRemoveResources: (kind: ResourceKind, ids: string[]) => void
  // 某资源被挂载到的章节锚点数量（资源中心列表用）
  mountCountByResource: (kind: ResourceKind, id: string) => number
  // 批量挂载：把一批资源挂入某教材的某章节
  batchMountResources: (
    kind: SyncResourceType,
    textbookId: string,
    chapterId: string,
    ids: string[],
  ) => void
  // 卸载某资源在某章节的挂载
  unmountResource: (
    kind: SyncResourceType,
    id: string,
    textbookId: string,
    chapterId: string,
  ) => void
  // 按知识点把资源自动归集到某章节（一键拉取）
  autoCollectByKnowledgePoints: (
    kind: SyncResourceType,
    textbookId: string,
    chapterId: string,
  ) => number
  // 某章节某类资源的数量
  countResourcesByChapter: (chapterId: string, kind: SyncResourceType) => number
  // 教材同步关系：建立 / 更新同步资源 / 删除
  addSyncLink: (link: Omit<ChapterSyncLink, "id">) => void
  updateSyncLinkTypes: (id: string, syncTypes: SyncResourceType[]) => void
  removeSyncLink: (id: string) => void
  // 统计
  countQuestionsByChapter: (chapterId: string) => number
  countQuestionsByTextbook: (textbookId: string) => number
  questionsByKnowledgePoints: (kpIds: string[]) => Question[]
}

const StoreContext = createContext<StoreValue | null>(null)

let idCounter = 1000
const nextId = (prefix: string) => `${prefix}-${++idCounter}`
const today = () => new Date().toISOString().slice(0, 10)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [textbooks, setTextbooks] = useState<Textbook[]>(seedTextbooks)
  const [chapters, setChapters] = useState<ChapterNode[]>(seedChapters)
  const [questions, setQuestions] = useState<Question[]>(seedQuestions)
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments)
  const [microlessons, setMicrolessons] = useState<Microlesson[]>(seedMicrolessons)
  const [airClasses, setAirClasses] = useState<AirClass[]>(seedAirClasses)
  const [premiums, setPremiums] = useState<Premium[]>(seedPremiums)
  const [knowledgePoints, setKnowledgePoints] =
    useState<KnowledgePoint[]>(seedKnowledgePoints)
  const [syncLinks, setSyncLinks] = useState<ChapterSyncLink[]>(seedSyncLinks)

  // 四类资源共享的可挂载基础结构
  type Mountable = {
    id: string
    knowledgePointIds: string[]
    chapterMounts: { textbookId: string; chapterId: string }[]
    updatedAt: string
  }
  // 按资源类型更新对应的状态数组
  const updateByKind = (
    kind: SyncResourceType,
    mapper: (r: Mountable) => Mountable,
  ) => {
    if (kind === "question")
      setQuestions((p) => p.map((r) => mapper(r) as Question))
    else if (kind === "assignment")
      setAssignments((p) => p.map((r) => mapper(r) as Assignment))
    else if (kind === "microlesson")
      setMicrolessons((p) => p.map((r) => mapper(r) as Microlesson))
    else setAirClasses((p) => p.map((r) => mapper(r) as AirClass))
  }

  const value = useMemo<StoreValue>(
    () => ({
      textbooks,
      chapters,
      questions,
      assignments,
      microlessons,
      airClasses,
      premiums,
      knowledgePoints,
      syncLinks,
      addTextbook: (tb) => {
        const created: Textbook = { ...tb, id: nextId("tb"), updatedAt: today() }
        setTextbooks((prev) => [created, ...prev])
        return created
      },
      updateTextbook: (id, patch) =>
        setTextbooks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: today() } : t)),
        ),
      addChapter: (c) => setChapters((prev) => [...prev, { ...c, id: nextId("ch") }]),
      updateChapter: (id, patch) =>
        setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      removeChapter: (id) =>
        setChapters((prev) => prev.filter((c) => c.id !== id && c.parentId !== id)),

      importChapters: (textbookId, rows, replace) => {
        const created: ChapterNode[] = []
        // 各层级最近一个父节点，用于把 level 转成 parentId
        const lastByLevel: Record<number, string> = {}
        // 各父节点下的排序计数
        const orderByParent: Record<string, number> = {}
        rows.forEach((row) => {
          const level = Math.max(1, Math.min(3, row.level))
          const parentId = level === 1 ? null : lastByLevel[level - 1] ?? null
          const pk = parentId ?? "root"
          orderByParent[pk] = (orderByParent[pk] ?? 0) + 1
          const id = nextId("ch")
          created.push({
            id,
            textbookId,
            parentId,
            title: row.title,
            order: orderByParent[pk],
            knowledgePointIds: [],
          })
          lastByLevel[level] = id
          // 进入更深层级时，清除更深的缓存
          for (let l = level + 1; l <= 3; l++) delete lastByLevel[l]
        })
        setChapters((prev) => {
          const kept = replace
            ? prev.filter((c) => c.textbookId !== textbookId)
            : prev
          return [...kept, ...created]
        })
        return created.length
      },

      addKnowledgePoint: (kp) =>
        setKnowledgePoints((prev) => [...prev, { ...kp, id: nextId("kp") }]),
      setChapterKnowledgePoints: (chapterId, kpIds) =>
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, knowledgePointIds: kpIds } : c)),
        ),

      resourcesByKind: (kind) => {
        if (kind === "question")
          return questions.map<NormalizedResource>((q) => ({
            id: q.id,
            kind,
            title: q.stem,
            subtitle: QUESTION_TYPE_LABELS[q.type],
            subject: q.subject,
            level: q.level,
            ownerScope: q.ownerScope,
            knowledgePointIds: q.knowledgePointIds,
            chapterMounts: q.chapterMounts,
          }))
        if (kind === "assignment")
          return assignments.map<NormalizedResource>((a) => ({
            id: a.id,
            kind,
            title: a.title,
            subtitle: `${a.questionIds.length} 道题`,
            subject: a.subject,
            level: a.level,
            ownerScope: a.ownerScope,
            knowledgePointIds: a.knowledgePointIds,
            chapterMounts: a.chapterMounts,
          }))
        if (kind === "microlesson")
          return microlessons.map<NormalizedResource>((m) => ({
            id: m.id,
            kind,
            title: m.title,
            subtitle: m.duration,
            subject: m.subject,
            level: m.level,
            ownerScope: m.ownerScope,
            knowledgePointIds: m.knowledgePointIds,
            chapterMounts: m.chapterMounts,
          }))
        if (kind === "premium")
          return premiums.map<NormalizedResource>((p) => ({
            id: p.id,
            kind: "premium",
            title: p.title,
            subtitle: PREMIUM_CATEGORY_LABELS[p.category],
            subject: p.subject,
            level: p.level,
            ownerScope: p.ownerScope,
            knowledgePointIds: p.knowledgePointIds,
            chapterMounts: p.chapterMounts,
          }))
        return airClasses.map<NormalizedResource>((a) => ({
          id: a.id,
          kind,
          title: a.title,
          subtitle: a.teacher,
          subject: a.subject,
          level: a.level,
          ownerScope: a.ownerScope,
          knowledgePointIds: a.knowledgePointIds,
          chapterMounts: a.chapterMounts,
        }))
      },

      addQuestion: (q) =>
        setQuestions((prev) => {
          const id = nextId("q")
          const qq = q as Partial<Question>
          // 新题目自带 v1（已发布），作为内容快照
          const v1 = {
            version: 1,
            status: "published" as const,
            stem: qq.stem ?? "",
            type: qq.type ?? "single",
            options: qq.options,
            answer: qq.answer,
            analysis: qq.analysis,
            usedCount: 0,
            studentCount: 0,
            changeNote: "初始版本",
            createdAt: today(),
          }
          return [
            {
              ...q,
              id,
              version: 1,
              versions: [v1],
              chapterMounts: qq.chapterMounts ?? [],
              updatedAt: today(),
            } as Question,
            ...prev,
          ]
        }),
      addAssignment: (a) =>
        setAssignments((prev) => [
          {
            ...a,
            id: nextId("as"),
            chapterMounts: [],
            textbookIds: [],
            status: "published",
            updatedAt: today(),
          } as Assignment,
          ...prev,
        ]),
      addMicrolesson: (m) =>
        setMicrolessons((prev) => [
          { ...m, id: nextId("ml"), chapterMounts: [], updatedAt: today() } as Microlesson,
          ...prev,
        ]),
      addAirClass: (a) =>
        setAirClasses((prev) => [
          { ...a, id: nextId("ac"), chapterMounts: [], updatedAt: today() } as AirClass,
          ...prev,
        ]),
      addPremium: (p) =>
        setPremiums((prev) => [
          { ...p, id: nextId("pm"), chapterMounts: [], updatedAt: today() } as Premium,
          ...prev,
        ]),

      saveQuestionAsNewVersion: (familyId, content, changeNote) =>
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id !== familyId) return q
            const nextVersion = Math.max(...q.versions.map((v) => v.version)) + 1
            // 旧版本全部归档（保留各自统计），新版本成为当前生效版本、统计清零
            const archived = q.versions.map((v) => ({ ...v, status: "archived" as const }))
            const newVer = {
              version: nextVersion,
              status: "published" as const,
              stem: content.stem,
              type: content.type,
              options: content.options,
              answer: content.answer,
              analysis: content.analysis,
              usedCount: 0,
              studentCount: 0,
              changeNote: changeNote || `修订为 v${nextVersion}`,
              createdAt: today(),
            }
            return {
              ...q,
              // 顶层内容镜像新版本
              stem: content.stem,
              type: content.type,
              options: content.options,
              answer: content.answer,
              analysis: content.analysis,
              version: nextVersion,
              versions: [...archived, newVer],
              usedCount: 0,
              studentCount: 0,
              updatedAt: today(),
            }
          }),
        ),

      questionFamilyStats: (familyId) => {
        const q = questions.find((x) => x.id === familyId)
        if (!q) return { totalUsed: 0, totalStudents: 0, versionCount: 0 }
        return {
          totalUsed: q.versions.reduce((s, v) => s + (v.usedCount ?? 0), 0),
          totalStudents: q.versions.reduce((s, v) => s + (v.studentCount ?? 0), 0),
          versionCount: q.versions.length,
        }
      },

      updateResource: (kind, id, patch) => {
        const apply = <T extends { id: string }>(p: T[]) =>
          p.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: today() } : r))
        if (kind === "question") setQuestions((p) => apply(p))
        else if (kind === "assignment") setAssignments((p) => apply(p))
        else if (kind === "microlesson") setMicrolessons((p) => apply(p))
        else if (kind === "premium") setPremiums((p) => apply(p))
        else setAirClasses((p) => apply(p))
      },
      removeResource: (kind, id) => {
        if (kind === "question") setQuestions((p) => p.filter((r) => r.id !== id))
        else if (kind === "assignment") setAssignments((p) => p.filter((r) => r.id !== id))
        else if (kind === "microlesson") setMicrolessons((p) => p.filter((r) => r.id !== id))
        else if (kind === "premium") setPremiums((p) => p.filter((r) => r.id !== id))
        else setAirClasses((p) => p.filter((r) => r.id !== id))
      },
      mountCountByResource: (kind, id) => {
        const list: Mountable[] =
          kind === "question"
            ? questions
            : kind === "assignment"
              ? assignments
              : kind === "microlesson"
                ? microlessons
                : kind === "premium"
                  ? premiums
                  : airClasses
        return list.find((r) => r.id === id)?.chapterMounts.length ?? 0
      },

      batchUpdateLevel: (kind, ids, level, ownerScope) => {
        const idSet = new Set(ids)
        const apply = <T extends { id: string }>(p: T[]) =>
          p.map((r) =>
            idSet.has(r.id) ? { ...r, level, ownerScope, updatedAt: today() } : r,
          )
        if (kind === "question") setQuestions((p) => apply(p))
        else if (kind === "assignment") setAssignments((p) => apply(p))
        else if (kind === "microlesson") setMicrolessons((p) => apply(p))
        else if (kind === "premium") setPremiums((p) => apply(p))
        else setAirClasses((p) => apply(p))
      },
      batchRemoveResources: (kind, ids) => {
        const idSet = new Set(ids)
        const filterOut = <T extends { id: string }>(p: T[]) => p.filter((r) => !idSet.has(r.id))
        if (kind === "question") setQuestions((p) => filterOut(p))
        else if (kind === "assignment") setAssignments((p) => filterOut(p))
        else if (kind === "microlesson") setMicrolessons((p) => filterOut(p))
        else if (kind === "premium") setPremiums((p) => filterOut(p))
        else setAirClasses((p) => filterOut(p))
      },

      batchMountResources: (kind, textbookId, chapterId, ids) =>
        updateByKind(kind, (r) => {
          if (!ids.includes(r.id)) return r
          const exists = r.chapterMounts.some(
            (m) => m.textbookId === textbookId && m.chapterId === chapterId,
          )
          if (exists) return r
          return {
            ...r,
            chapterMounts: [...r.chapterMounts, { textbookId, chapterId }],
            updatedAt: today(),
          }
        }),

      unmountResource: (kind, id, textbookId, chapterId) =>
        updateByKind(kind, (r) =>
          r.id === id
            ? {
                ...r,
                chapterMounts: r.chapterMounts.filter(
                  (m) => !(m.textbookId === textbookId && m.chapterId === chapterId),
                ),
                updatedAt: today(),
              }
            : r,
        ),

      autoCollectByKnowledgePoints: (kind, textbookId, chapterId) => {
        const chapter = chapters.find((c) => c.id === chapterId)
        if (!chapter || chapter.knowledgePointIds.length === 0) return 0
        const kpSet = new Set(chapter.knowledgePointIds)
        let count = 0
        updateByKind(kind, (r) => {
          const matches = r.knowledgePointIds.some((id) => kpSet.has(id))
          if (!matches) return r
          const exists = r.chapterMounts.some(
            (m) => m.textbookId === textbookId && m.chapterId === chapterId,
          )
          if (exists) return r
          count++
          return {
            ...r,
            chapterMounts: [...r.chapterMounts, { textbookId, chapterId }],
            updatedAt: today(),
          }
        })
        return count
      },

      countResourcesByChapter: (chapterId, kind) => {
        const list: Mountable[] =
          kind === "question"
            ? questions
            : kind === "assignment"
              ? assignments
              : kind === "microlesson"
                ? microlessons
                : airClasses
        return list.filter((r) =>
          r.chapterMounts.some((m) => m.chapterId === chapterId),
        ).length
      },

      addSyncLink: (link) =>
        setSyncLinks((prev) => [{ ...link, id: nextId("sl") }, ...prev]),
      updateSyncLinkTypes: (id, syncTypes) =>
        setSyncLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, syncTypes } : l)),
        ),
      removeSyncLink: (id) => setSyncLinks((prev) => prev.filter((l) => l.id !== id)),

      countQuestionsByChapter: (chapterId) =>
        questions.filter((q) => q.chapterMounts.some((m) => m.chapterId === chapterId))
          .length,
      countQuestionsByTextbook: (textbookId) =>
        questions.filter((q) => q.chapterMounts.some((m) => m.textbookId === textbookId))
          .length,
      questionsByKnowledgePoints: (kpIds) => {
        const set = new Set(kpIds)
        return questions.filter((q) => q.knowledgePointIds.some((id) => set.has(id)))
      },
    }),
    [
      textbooks,
      chapters,
      questions,
      assignments,
      microlessons,
      airClasses,
      premiums,
      knowledgePoints,
      syncLinks,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
