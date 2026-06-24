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

// 资源级别 / 授权范围：决定资源的归属与可见广度
// SaaS 平台后台新增资源时，必须指定归属到具体的 市 / 区 / 校
export type ResourceLevel = "city" | "district" | "school"

export const RESOURCE_LEVEL_LABELS: Record<ResourceLevel, string> = {
  city: "市级",
  district: "区级",
  school: "校级",
}

export const RESOURCE_LEVELS: ResourceLevel[] = ["city", "district", "school"]

// 市 → 区 → 校 三级级联组织结构（SaaS 多租户：每个市/区/校是一个授权范围）
export interface SchoolOrg {
  id: string
  name: string
}
export interface DistrictOrg {
  id: string
  name: string
  schools: SchoolOrg[]
}
export interface CityOrg {
  id: string
  name: string
  districts: DistrictOrg[]
}

export const ORG_TREE: CityOrg[] = [
  {
    id: "sh",
    name: "上海市",
    districts: [
      {
        id: "sh-xh",
        name: "徐汇区",
        schools: [
          { id: "sh-xh-1", name: "徐汇区第一中心小学" },
          { id: "sh-xh-2", name: "上海市第二中学" },
          { id: "sh-xh-3", name: "位育中学" },
        ],
      },
      {
        id: "sh-pd",
        name: "浦东新区",
        schools: [
          { id: "sh-pd-1", name: "张江中学" },
          { id: "sh-pd-2", name: "建平中学" },
        ],
      },
      {
        id: "sh-hp",
        name: "黄浦区",
        schools: [
          { id: "sh-hp-1", name: "格致中学" },
          { id: "sh-hp-2", name: "大同中学" },
        ],
      },
    ],
  },
  {
    id: "bj",
    name: "北京市",
    districts: [
      {
        id: "bj-hd",
        name: "海淀区",
        schools: [
          { id: "bj-hd-1", name: "中关村中学" },
          { id: "bj-hd-2", name: "人大附中" },
        ],
      },
      {
        id: "bj-dc",
        name: "东城区",
        schools: [
          { id: "bj-dc-1", name: "北京二中" },
          { id: "bj-dc-2", name: "汇文中学" },
        ],
      },
    ],
  },
]

// 按级别提供可选归属范围（由级联结构派生，保持向后兼容）
export const SCOPE_OPTIONS: Record<ResourceLevel, string[]> = {
  city: ORG_TREE.map((c) => c.name),
  district: ORG_TREE.flatMap((c) => c.districts.map((d) => d.name)),
  school: ORG_TREE.flatMap((c) => c.districts.flatMap((d) => d.schools.map((s) => s.name))),
}

// 资源级别 + 归属的公共字段：所有资源都带，后台新增时必须指定具体 市/区/校
export interface LeveledResource {
  level: ResourceLevel
  ownerScope?: string // 具体的 市 / 区 / 校 名称
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

// 难度三档（对齐教师端 易/中/难）：1-2=易, 3=中, 4-5=难
export const DIFFICULTY_TIER_LABELS = ["易", "中", "难"] as const
export function difficultyTier(d: Difficulty): "易" | "中" | "难" {
  if (d <= 2) return "易"
  if (d === 3) return "中"
  return "难"
}

// 标注体系受控词表（对齐教师端新建题目的标签命名空间）
export const LITERACY_OPTIONS = ["数学运算", "逻辑推理", "数学建模", "直观想象", "数据分析"] // 核心素养
export const COGNITIVE_OPTIONS = ["记忆", "理解", "应用", "分析综合"] // 认知层级
export const USAGE_OPTIONS = [
  "基础巩固",
  "易错训练",
  "课后练习",
  "课堂讲解",
  "单元复习",
  "拓展提升",
] // 教学用途
export const SCENE_OPTIONS = ["纯数学情景", "生活情景", "跨学科情景"] // 情景属性

// 题目版本状态：草稿 / 已发布（当前生效）/ 已归档（被新版本取代，仅保留统计可追溯）
export type QuestionVersionStatus = "draft" | "published" | "archived"
export const QUESTION_VERSION_STATUS_LABELS: Record<QuestionVersionStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
}

// 题目版本：某一时刻“内容”的不可变快照 + 该版本独立的作答统计
// 内容字段（题干/题型/选项/答案/解析）一旦有学生作答，应另存为新版本而非就地改
export interface QuestionVersion {
  version: number // 版本号，从 1 递增
  status: QuestionVersionStatus
  // —— 内容快照 ——
  stem: string
  type: QuestionType
  options?: { key: string; content: string }[]
  answer?: string
  analysis?: string
  // —— 版本级统计（学生作答数据绑定到具体版本）——
  usedCount?: number // 该版本被组卷次数
  studentCount?: number // 该版本已练学生数
  correctRate?: number // 该版本正确率 0-100
  changeNote?: string // 修订说明（相对上一版本改了什么）
  createdAt: string
}

export interface Question extends LeveledResource {
  id: string // 题目族 ID：稳定的逻辑身份，统计顺着它汇总
  // —— 当前生效版本的内容镜像（= versions 中 version===当前版本 的快照，便于向后兼容直接读取）——
  stem: string // 题干（支持 $...$ 公式）
  type: QuestionType
  subject: string
  options?: { key: string; content: string }[] // 选项（选择题）
  answer?: string // 答案
  analysis?: string // 解析
  // —— 族级元数据（可直接改，不产生新版本；难度归此类）——
  difficulty: Difficulty
  // 题目打知识点标签 —— 这是归集与自动挂载的依据
  knowledgePointIds: string[]
  // 教师端标注维度
  literacy?: string[] // 核心素养
  cognitive?: string // 认知层级
  usage?: string[] // 教学用途
  scene?: string // 情景属性
  teachTags?: string[] // 自定义教学标签
  // 讲解资源
  videoTitle?: string
  videoDuration?: string
  // —— 版本 ——
  version: number // 当前生效版本号
  versions: QuestionVersion[] // 全部版本（含历史），按 version 升序
  // —— 当前版本统计镜像（= 当前版本的统计，列表直接展示）——
  usedCount?: number // 组卷次数
  studentCount?: number // 已练学生数
  // 章节锚点：题目最终落在哪些章节（可由知识点自动归集，也可手工批量挂入）
  chapterMounts: { textbookId: string; chapterId: string }[]
  updatedAt: string
}

// 题目引用（作业/精品用）：钉死到具体题目族的具体版本
export interface QuestionRef {
  familyId: string // = Question.id
  version: number // 引用创建时钉死的版本
}

// 作业
export interface Assignment extends LeveledResource {
  id: string
  title: string
  subject: string
  questionIds: string[] // 题目族 ID 列表（兼容旧引用）
  // 钉死版本的引用：已发布作业永远指向创建时的版本，不随题目升级而变
  questionVersions?: QuestionRef[]
  // 同样可以归属多个教材
  textbookIds: string[]
  // 章节锚点：作业也挂到具体章节
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
  status: "draft" | "published"
  assignedClasses?: number // 已布置班级数
  usedCount?: number // 使用次数
  updatedAt: string
}

// 微课
export interface Microlesson extends LeveledResource {
  id: string
  title: string
  subject: string
  duration: string // 时长，如 "8:30"
  videoUrl?: string // 视频地址
  viewCount?: number // 观看数
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

// 精品资源（独立类型）：平台/区域精选的优质资源包，可由组卷或专题构成，同样带 市/区/校 级别
export type PremiumCategory = "paper" | "special" | "courseware"
export const PREMIUM_CATEGORY_LABELS: Record<PremiumCategory, string> = {
  paper: "精品试卷",
  special: "专题资源",
  courseware: "精品课件",
}
export interface Premium extends LeveledResource {
  id: string
  title: string
  subject: string
  category: PremiumCategory
  description?: string
  questionIds: string[] // 精品试卷 / 专题包含的题目（题目族 ID）
  questionVersions?: QuestionRef[] // 钉死版本的引用
  knowledgePointIds: string[]
  chapterMounts: { textbookId: string; chapterId: string }[]
  usedCount?: number
  updatedAt: string
}

// 可同步的资源类型（参与教材章节挂载 / 同步关系的类型）
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

// 资源中心菜单覆盖的全部资源类型（含精品资源），用于左侧二级菜单与各资源页
export type ResourceKind = SyncResourceType | "premium"

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  question: "题库",
  assignment: "作业",
  premium: "精品资源",
  microlesson: "微课",
  airclass: "空中课堂",
}

// 左侧二级菜单顺序：题库 / 作业 / 精品资源 / 微课 / 空中课堂
export const RESOURCE_KINDS: ResourceKind[] = [
  "question",
  "assignment",
  "premium",
  "microlesson",
  "airclass",
]

// 章节挂载时，四类资源统一成这个结构展示 / 操作
export interface NormalizedResource {
  id: string
  kind: ResourceKind
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
