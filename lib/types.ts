// 学段
export type Stage = "primary" | "junior" | "senior"
// 册次
export type Volume = "full" | "upper" | "lower"
// 教材状态
export type TextbookStatus = "draft" | "published" | "archived"

export const STAGE_LABELS: Record<Stage, string> = {
  primary: "小学",
  junior: "初中",
  senior: "高中",
}

export const VOLUME_LABELS: Record<Volume, string> = {
  full: "全一册",
  upper: "上册",
  lower: "下册",
}

export const STATUS_LABELS: Record<TextbookStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
}

export interface Textbook {
  id: string
  name: string // 教材名称
  subject: string // 学科
  stage: Stage // 学段
  grade: string // 年级
  volume: Volume // 册次
  version: string // 版本（人教/北师大等）
  year: number // 教材年份
  status: TextbookStatus
  cover?: string
  updatedAt: string
}

// 章节目录节点
export interface ChapterNode {
  id: string
  textbookId: string
  parentId: string | null
  title: string
  order: number
  // 节点上挂载的题目数量（冗余统计，便于展示）
}

// 题目
export type QuestionType = "single" | "multiple" | "fill" | "judge" | "subjective"
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  fill: "填空题",
  judge: "判断题",
  subjective: "解答题",
}

export type Difficulty = 1 | 2 | 3 | 4 | 5

export interface Question {
  id: string
  stem: string // 题干
  type: QuestionType
  subject: string
  difficulty: Difficulty
  // 一道题可以挂在多个教材的多个章节下（多对多）
  mounts: { textbookId: string; chapterId: string }[]
  updatedAt: string
}

// 作业
export interface Assignment {
  id: string
  title: string
  subject: string
  questionIds: string[]
  // 同样可以归属多个教材
  textbookIds: string[]
  status: "draft" | "published"
  updatedAt: string
}
