import type { Assignment, ChapterNode, Question, Textbook } from "./types"

export const SUBJECTS = ["数学", "语文", "英语", "物理", "化学", "生物"]
export const VERSIONS = ["人教版", "北师大版", "苏教版", "华师大版", "外研版"]
export const GRADES = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级"]

export const textbooks: Textbook[] = [
  {
    id: "tb-1",
    name: "义务教育教科书·数学（七年级上册）",
    subject: "数学",
    stage: "junior",
    grade: "七年级",
    volume: "upper",
    version: "人教版",
    year: 2024,
    status: "published",
    updatedAt: "2026-05-12",
  },
  {
    id: "tb-2",
    name: "义务教育教科书·数学（七年级上册）",
    subject: "数学",
    stage: "junior",
    grade: "七年级",
    volume: "upper",
    version: "北师大版",
    year: 2024,
    status: "published",
    updatedAt: "2026-04-28",
  },
  {
    id: "tb-3",
    name: "义务教育教科书·数学（七年级上册）",
    subject: "数学",
    stage: "junior",
    grade: "七年级",
    volume: "upper",
    version: "人教版",
    year: 2019,
    status: "archived",
    updatedAt: "2025-09-01",
  },
  {
    id: "tb-4",
    name: "义务教育教科书·语文（八年级下册）",
    subject: "语文",
    stage: "junior",
    grade: "八年级",
    volume: "lower",
    version: "人教版",
    year: 2024,
    status: "published",
    updatedAt: "2026-03-15",
  },
  {
    id: "tb-5",
    name: "普通高中教科书·物理（必修第一册）",
    subject: "物理",
    stage: "senior",
    grade: "高一",
    volume: "full",
    version: "人教版",
    year: 2025,
    status: "draft",
    updatedAt: "2026-06-10",
  },
]

// 章节目录（以 tb-1 人教版数学七上为例做完整目录）
export const chapters: ChapterNode[] = [
  { id: "ch-1", textbookId: "tb-1", parentId: null, title: "第一章 有理数", order: 1 },
  { id: "ch-1-1", textbookId: "tb-1", parentId: "ch-1", title: "1.1 正数和负数", order: 1 },
  { id: "ch-1-2", textbookId: "tb-1", parentId: "ch-1", title: "1.2 有理数", order: 2 },
  { id: "ch-1-3", textbookId: "tb-1", parentId: "ch-1", title: "1.3 有理数的加减法", order: 3 },
  { id: "ch-1-4", textbookId: "tb-1", parentId: "ch-1", title: "1.4 有理数的乘除法", order: 4 },
  { id: "ch-2", textbookId: "tb-1", parentId: null, title: "第二章 整式的加减", order: 2 },
  { id: "ch-2-1", textbookId: "tb-1", parentId: "ch-2", title: "2.1 整式", order: 1 },
  { id: "ch-2-2", textbookId: "tb-1", parentId: "ch-2", title: "2.2 整式的加减", order: 2 },
  { id: "ch-3", textbookId: "tb-1", parentId: null, title: "第三章 一元一次方程", order: 3 },
  { id: "ch-3-1", textbookId: "tb-1", parentId: "ch-3", title: "3.1 从算式到方程", order: 1 },
  { id: "ch-3-2", textbookId: "tb-1", parentId: "ch-3", title: "3.2 解一元一次方程", order: 2 },
  // 北师大版数学七上（结构不同，用于演示同一题目挂多教材）
  { id: "bs-1", textbookId: "tb-2", parentId: null, title: "第一章 丰富的图形世界", order: 1 },
  { id: "bs-2", textbookId: "tb-2", parentId: null, title: "第二章 有理数及其运算", order: 2 },
  { id: "bs-2-1", textbookId: "tb-2", parentId: "bs-2", title: "2.1 有理数", order: 1 },
  { id: "bs-2-2", textbookId: "tb-2", parentId: "bs-2", title: "2.2 数轴", order: 2 },
  { id: "bs-3", textbookId: "tb-2", parentId: null, title: "第三章 整式及其加减", order: 3 },
]

export const questions: Question[] = [
  {
    id: "q-1",
    stem: "下列各数中，是负数的是（　）。A. -3  B. 0  C. 2.5  D. |−1|",
    type: "single",
    subject: "数学",
    difficulty: 1,
    mounts: [
      { textbookId: "tb-1", chapterId: "ch-1-1" },
      { textbookId: "tb-2", chapterId: "bs-2-1" },
    ],
    updatedAt: "2026-05-20",
  },
  {
    id: "q-2",
    stem: "计算：(−7) + (+3) − (−5) = ______。",
    type: "fill",
    subject: "数学",
    difficulty: 2,
    mounts: [{ textbookId: "tb-1", chapterId: "ch-1-3" }],
    updatedAt: "2026-05-18",
  },
  {
    id: "q-3",
    stem: "判断：两个负数相乘，积一定为正数。（　）",
    type: "judge",
    subject: "数学",
    difficulty: 2,
    mounts: [
      { textbookId: "tb-1", chapterId: "ch-1-4" },
      { textbookId: "tb-2", chapterId: "bs-2" },
    ],
    updatedAt: "2026-05-15",
  },
  {
    id: "q-4",
    stem: "解方程：3x − 5 = 2x + 7，并写出完整求解过程。",
    type: "subjective",
    subject: "数学",
    difficulty: 3,
    mounts: [{ textbookId: "tb-1", chapterId: "ch-3-2" }],
    updatedAt: "2026-06-01",
  },
  {
    id: "q-5",
    stem: "下列式子中，属于单项式的有（　）。",
    type: "multiple",
    subject: "数学",
    difficulty: 3,
    mounts: [],
    updatedAt: "2026-06-08",
  },
]

export const assignments: Assignment[] = [
  {
    id: "as-1",
    title: "第一章 有理数 · 课后基础练",
    subject: "数学",
    questionIds: ["q-1", "q-2", "q-3"],
    textbookIds: ["tb-1", "tb-2"],
    status: "published",
    updatedAt: "2026-05-22",
  },
  {
    id: "as-2",
    title: "一元一次方程 · 专项提升",
    subject: "数学",
    questionIds: ["q-4"],
    textbookIds: ["tb-1"],
    status: "draft",
    updatedAt: "2026-06-02",
  },
]
