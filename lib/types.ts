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

// 知识点（学科内的稳定锚点，跨教材通用，是批量归集的核心）
export interface KnowledgePoint {
  id: string
  subject: string
  name: string
  // 知识点可分组（章/主题），便于管理
  group: string
}

// 章节目录节点
export interface ChapterNode {
  id: string
  textbookId: string
  parentId: string | null
  title: string
  order: number
  // 章节声明它覆盖的知识点 —— 题目据此自动归集，无需逐题挂载
  knowledgePointIds: string[]
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
  // 题目打知识点标签 —— 这是归集与自动挂载的依据
  knowledgePointIds: string[]
  // 章节锚点：题目最终落在哪些章节（可由知识点自动归集，也可手工批量挂入）
  chapterMounts: { textbookId: string; chapterId: string }[]
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

// 换教材时的章节映射：把旧教材的章节对应到新教材的章节
export interface ChapterMappingPair {
  fromChapterId: string
  toChapterId: string | null // null 表示尚未对应
  // 推荐置信度（按标题 / 知识点相似度），用于辅助决策
  confidence?: number
}

export interface ChapterMapping {
  fromTextbookId: string
  toTextbookId: string
  pairs: ChapterMappingPair[]
}
