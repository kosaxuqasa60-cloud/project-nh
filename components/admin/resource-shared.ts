import { PREMIUM_CATEGORY_LABELS } from "@/lib/types"
import type {
  AirClass,
  Assignment,
  Difficulty,
  Microlesson,
  Premium,
  Question,
  QuestionType,
  ResourceKind,
  ResourceLevel,
} from "@/lib/types"

// 难度 1-5 → 易/中/难（对齐教师端三档显示）
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "易",
  2: "易",
  3: "中",
  4: "难",
  5: "难",
}

export { RESOURCE_LEVEL_LABELS } from "@/lib/types"

// 管理端列表统一行模型：四类资源归一 + 卡片展示所需的派生字段
export interface AdminResourceRow {
  id: string
  kind: ResourceKind
  title: string
  subject: string
  level: ResourceLevel
  ownerScope?: string
  knowledgePointLabels: string[]
  mounts: number
  updatedAt: string
  // 差异化字段
  questionType?: QuestionType
  difficulty?: Difficulty
  hasVideo?: boolean
  metaLine?: string // 类型专属的元信息（时长/观看、题数/班级、主讲/时间）
}

export function buildRow(
  kind: ResourceKind,
  raw: Question | Assignment | Microlesson | AirClass | Premium,
  kpLabel: (id: string) => string,
  mounts: number,
): AdminResourceRow {
  const base = {
    id: raw.id,
    kind,
    subject: raw.subject,
    level: raw.level,
    ownerScope: raw.ownerScope,
    mounts,
    updatedAt: raw.updatedAt,
  }

  if (kind === "question") {
    const q = raw as Question
    return {
      ...base,
      title: q.stem,
      knowledgePointLabels: q.knowledgePointIds.map(kpLabel),
      questionType: q.type,
      difficulty: q.difficulty,
      hasVideo: false,
    }
  }
  if (kind === "assignment") {
    const a = raw as Assignment
    return {
      ...base,
      title: a.title,
      knowledgePointLabels: a.knowledgePointIds.map(kpLabel),
      metaLine: `${a.questionIds.length} 题 · 已挂载 ${mounts} 处`,
    }
  }
  if (kind === "microlesson") {
    const m = raw as Microlesson
    return {
      ...base,
      title: m.title,
      knowledgePointLabels: m.knowledgePointIds.map(kpLabel),
      hasVideo: Boolean(m.videoUrl) || true,
      metaLine: `时长 ${m.duration}`,
    }
  }
  if (kind === "premium") {
    const p = raw as Premium
    return {
      ...base,
      title: p.title,
      knowledgePointLabels: p.knowledgePointIds.map(kpLabel),
      metaLine: `${PREMIUM_CATEGORY_LABELS[p.category]} · ${p.questionIds.length} 题`,
    }
  }
  const ac = raw as AirClass
  return {
    ...base,
    title: ac.title,
    knowledgePointLabels: ac.knowledgePointIds.map(kpLabel),
    metaLine: [`主讲 ${ac.teacher}`, ac.scheduledAt].filter(Boolean).join(" · "),
  }
}
