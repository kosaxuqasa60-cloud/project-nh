"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  assignments as seedAssignments,
  chapters as seedChapters,
  knowledgePoints as seedKnowledgePoints,
  questions as seedQuestions,
  syncLinks as seedSyncLinks,
  textbooks as seedTextbooks,
} from "./mock-data"
import type {
  Assignment,
  ChapterNode,
  ChapterSyncLink,
  KnowledgePoint,
  Question,
  SyncResourceType,
  Textbook,
} from "./types"

interface StoreValue {
  textbooks: Textbook[]
  chapters: ChapterNode[]
  questions: Question[]
  assignments: Assignment[]
  knowledgePoints: KnowledgePoint[]
  syncLinks: ChapterSyncLink[]
  addTextbook: (tb: Omit<Textbook, "id" | "updatedAt">) => Textbook
  updateTextbook: (id: string, patch: Partial<Textbook>) => void
  addChapter: (c: Omit<ChapterNode, "id">) => void
  updateChapter: (id: string, patch: Partial<ChapterNode>) => void
  removeChapter: (id: string) => void
  // 知识点
  addKnowledgePoint: (kp: Omit<KnowledgePoint, "id">) => void
  setChapterKnowledgePoints: (chapterId: string, kpIds: string[]) => void
  // 批量挂题：把一批题目挂入某教材的某章节
  batchMountQuestions: (textbookId: string, chapterId: string, questionIds: string[]) => void
  // 卸载某题在某章节的挂载
  unmountQuestion: (questionId: string, textbookId: string, chapterId: string) => void
  // 按知识点把题目自动归集到某章节（一键拉题）
  autoCollectByKnowledgePoints: (textbookId: string, chapterId: string) => number
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
  const [assignments] = useState<Assignment[]>(seedAssignments)
  const [knowledgePoints, setKnowledgePoints] =
    useState<KnowledgePoint[]>(seedKnowledgePoints)
  const [syncLinks, setSyncLinks] = useState<ChapterSyncLink[]>(seedSyncLinks)

  const value = useMemo<StoreValue>(
    () => ({
      textbooks,
      chapters,
      questions,
      assignments,
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

      addKnowledgePoint: (kp) =>
        setKnowledgePoints((prev) => [...prev, { ...kp, id: nextId("kp") }]),
      setChapterKnowledgePoints: (chapterId, kpIds) =>
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, knowledgePointIds: kpIds } : c)),
        ),

      batchMountQuestions: (textbookId, chapterId, questionIds) =>
        setQuestions((prev) =>
          prev.map((q) => {
            if (!questionIds.includes(q.id)) return q
            const exists = q.chapterMounts.some(
              (m) => m.textbookId === textbookId && m.chapterId === chapterId,
            )
            if (exists) return q
            return {
              ...q,
              chapterMounts: [...q.chapterMounts, { textbookId, chapterId }],
              updatedAt: today(),
            }
          }),
        ),

      unmountQuestion: (questionId, textbookId, chapterId) =>
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  chapterMounts: q.chapterMounts.filter(
                    (m) => !(m.textbookId === textbookId && m.chapterId === chapterId),
                  ),
                  updatedAt: today(),
                }
              : q,
          ),
        ),

      autoCollectByKnowledgePoints: (textbookId, chapterId) => {
        const chapter = chapters.find((c) => c.id === chapterId)
        if (!chapter || chapter.knowledgePointIds.length === 0) return 0
        const kpSet = new Set(chapter.knowledgePointIds)
        let count = 0
        setQuestions((prev) =>
          prev.map((q) => {
            const matches = q.knowledgePointIds.some((id) => kpSet.has(id))
            if (!matches) return q
            const exists = q.chapterMounts.some(
              (m) => m.textbookId === textbookId && m.chapterId === chapterId,
            )
            if (exists) return q
            count++
            return {
              ...q,
              chapterMounts: [...q.chapterMounts, { textbookId, chapterId }],
              updatedAt: today(),
            }
          }),
        )
        return count
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
    [textbooks, chapters, questions, assignments, knowledgePoints, syncLinks],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
