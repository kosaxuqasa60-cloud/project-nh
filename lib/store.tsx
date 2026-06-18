"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  assignments as seedAssignments,
  chapters as seedChapters,
  questions as seedQuestions,
  textbooks as seedTextbooks,
} from "./mock-data"
import type { Assignment, ChapterNode, Question, Textbook } from "./types"

interface StoreValue {
  textbooks: Textbook[]
  chapters: ChapterNode[]
  questions: Question[]
  assignments: Assignment[]
  addTextbook: (tb: Omit<Textbook, "id" | "updatedAt">) => Textbook
  updateTextbook: (id: string, patch: Partial<Textbook>) => void
  addChapter: (c: Omit<ChapterNode, "id">) => void
  updateChapter: (id: string, patch: Partial<ChapterNode>) => void
  removeChapter: (id: string) => void
  setQuestionMounts: (id: string, mounts: Question["mounts"]) => void
  countQuestionsByChapter: (chapterId: string) => number
  countQuestionsByTextbook: (textbookId: string) => number
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

  const value = useMemo<StoreValue>(
    () => ({
      textbooks,
      chapters,
      questions,
      assignments,
      addTextbook: (tb) => {
        const created: Textbook = { ...tb, id: nextId("tb"), updatedAt: today() }
        setTextbooks((prev) => [created, ...prev])
        return created
      },
      updateTextbook: (id, patch) =>
        setTextbooks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: today() } : t))),
      addChapter: (c) => setChapters((prev) => [...prev, { ...c, id: nextId("ch") }]),
      updateChapter: (id, patch) =>
        setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      removeChapter: (id) =>
        setChapters((prev) => prev.filter((c) => c.id !== id && c.parentId !== id)),
      setQuestionMounts: (id, mounts) =>
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, mounts, updatedAt: today() } : q)),
        ),
      countQuestionsByChapter: (chapterId) =>
        questions.filter((q) => q.mounts.some((m) => m.chapterId === chapterId)).length,
      countQuestionsByTextbook: (textbookId) =>
        questions.filter((q) => q.mounts.some((m) => m.textbookId === textbookId)).length,
    }),
    [textbooks, chapters, questions, assignments],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
