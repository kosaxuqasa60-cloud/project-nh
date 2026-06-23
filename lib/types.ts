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
  archived: "已下架",
}

// 资源级别 / 来源：决定资源的归属与可见广度
// city/district/school 为行政来源（需配归属 ownerScope），premium 为平台精品（全员可见，仅平台管理员可建）
export type ResourceLevel = "city" | "district" | "school" | "premium"

export const RESOURCE_LEVEL_LABELS: Record<ResourceLevel, string> = {
  city: "市级",
  district: "区级",
  school: "校级",
  premium: "精品",
}

export const RESOURCE_LEVELS: ResourceLevel[] = ["city", "district", "school", "premium"]

// 原型阶段：归属用固定枚举（不建独立组织表），按级别提供可选范围
export const SCOPE_OPTIONS: Record<Exclude<ResourceLevel, "premium">, string[]> = {
  city: ["上海市", "北京市"],
  district: ["徐汇区", "浦东新区", "黄浦区", "海淀区"],
  school: ["上海市实验中学", "徐汇区第一中心小学", "浦东新区张江中学"],
}

// 资源级别 + 归属的公共字段，四类资源都带
export interface LeveledResource {
  level: ResourceLevel
  ownerScope?: string // premium 时为空（平台全员），其余为具体 市/区/校
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

export interface Question extends LeveledResource {
  id: string
  stem: string // 题干
  type: QuestionType
  subject: string
  difficulty: Difficulty
  answer?: string // 答案
  analysis?: string // 解析
  // 题目打知识点标签 —— 这是归集与自动挂载的依据
  knowledgePointIds: string[]
  // 章节锚点：题目最终落在哪些章节（可由知识点自动归集，也可手工批量挂入）
  chapterMounts: { textbookId: string; chapterId: string }[]
  updatedAt: string
}

// 作业
export interface Assignment extends LeveledResource {
  id: string
  title: string
  subject: string
  questionIds: string[]
  // 同样可以归属多个教材
  textbookIds: string[]
  // 章节锚点：作业也挂到具体章节
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
  status: "draft" | "published"
  updatedAt: string
}

// 微课
export interface Microlesson extends LeveledResource {
  id: string
  title: string
  subject: string
  duration: string // 时长，如 "8:30"
  videoUrl?: string // 视频地址
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
  updatedAt: string
}

// 空中课堂
export interface AirClass extends LeveledResource {
  id: string
  title: string
  subject: string
  teacher: string // 主讲教师
  scheduledAt?: string // 直播时间
  liveUrl?: string // 直播链接
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
  updatedAt: string
}

// 可同步的资源类型
export type SyncResourceType = "question" | "assignment" | "microlesson" | "airclass"

export const SYNC_RESOURCE_LABELS: Record<SyncResourceType, string> = {
  question: "题目",
  assignment: "作业",
  microlesson: "微课",
  airclass: "空中课堂",
}

export const SYNC_RESOURCE_TYPES: SyncResourceType[] = [
  "question",
  "assignment",
  "microlesson",
  "airclass",
]

// 章节挂载时，四类资源统一成这个结构展示 / 操作
export interface NormalizedResource {
  id: string
  kind: SyncResourceType
  title: string
  subtitle?: string // 题型 / 时长 / 主讲等附属信息
  subject: string
  level: ResourceLevel
  ownerScope?: string
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
}

// 教材同步关系：把教材A的某个目录与教材B的某个目录建立对应，
// 并指定这条对应上要同步哪些资源（纯手工设定，无自动推荐 / 置信度）
export interface ChapterSyncLink {
  id: string
  fromTextbookId: string
  fromChapterId: string
  toTextbookId: string
  toChapterId: string
  syncTypes: SyncResourceType[]
}
