"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  airClasses as seedAirClasses,
  assignments as seedAssignments,
  chapters as seedChapters,
  knowledgePoints as seedKnowledgePoints,
  microlessons as seedMicrolessons,
  questions as seedQuestions,
  syncLinks as seedSyncLinks,
  textbooks as seedTextbooks,
} from "./mock-data"
import { QUESTION_TYPE_LABELS } from "./types"
import type {
  AirClass,
  Assignment,
  ChapterNode,
  ChapterSyncLink,
  KnowledgePoint,
  Microlesson,
  NormalizedResource,
  Question,
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
  // 通用资源：按类型取归一化资源列表
  resourcesByKind: (kind: SyncResourceType) => NormalizedResource[]
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
            knowledgePointIds: q.knowledgePointIds,
            chapterMounts: q.chapterMounts,
          }))
        if (kind === "assignment")
          return assignments.map<NormalizedResource>((a) => ({
            id: a.id,
            kind,
            title: a.title,
            subtitle: `${a.questionIds.length} 道题`,
            knowledgePointIds: a.knowledgePointIds,
            chapterMounts: a.chapterMounts,
          }))
        if (kind === "microlesson")
          return microlessons.map<NormalizedResource>((m) => ({
            id: m.id,
            kind,
            title: m.title,
            subtitle: m.duration,
            knowledgePointIds: m.knowledgePointIds,
            chapterMounts: m.chapterMounts,
          }))
        return airClasses.map<NormalizedResource>((a) => ({
          id: a.id,
          kind,
          title: a.title,
          subtitle: a.teacher,
          knowledgePointIds: a.knowledgePointIds,
          chapterMounts: a.chapterMounts,
        }))
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
