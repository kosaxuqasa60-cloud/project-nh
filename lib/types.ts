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

// ——— 机构归属索引：题库页“机构上下文切换”用的纯函数 ———

// 当前选中的机构上下文（市/区/校逐级，越深越具体；includeParent 表示是否叠加上级下发）
export interface OrgContext {
  cityName?: string
  districtName?: string
  schoolName?: string
  includeParent: boolean
}

// 取某市下的区列表（下拉级联用）
export function districtsOfCity(cityName?: string): DistrictOrg[] {
  if (!cityName) return []
  return ORG_TREE.find((c) => c.name === cityName)?.districts ?? []
}

// 取某区下的学校列表（下拉级联用）
export function schoolsOfDistrict(cityName?: string, districtName?: string): SchoolOrg[] {
  if (!cityName || !districtName) return []
  return districtsOfCity(cityName).find((d) => d.name === districtName)?.schools ?? []
}

// 当前上下文中“最深的那一级”对应的级别（用于卡片/标题判定）
export function deepestLevel(ctx: OrgContext): ResourceLevel | null {
  if (ctx.schoolName) return "school"
  if (ctx.districtName) return "district"
  if (ctx.cityName) return "city"
  return null
}

// 根据机构上下文，解析出应匹配的 ownerScope 名称集合。
// 返回 null 表示“全部机构”（不按机构过滤）。
// 仅本级 = 最深选中的那个机构名；含上级 = 该链上从市到最深一节的所有已选机构名。
export function resolveOrgScopeNames(ctx: OrgContext): string[] | null {
  const chain = [ctx.cityName, ctx.districtName, ctx.schoolName].filter(Boolean) as string[]
  if (chain.length === 0) return null
  if (ctx.includeParent) return chain
  return [chain[chain.length - 1]]
}

// 由具体机构名反推它的级别（市/区/校）。用于卡片展示“区级·徐汇区”。
export function levelOfScopeName(name?: string): ResourceLevel | undefined {
  if (!name) return undefined
  if (ORG_TREE.some((c) => c.name === name)) return "city"
  if (ORG_TREE.some((c) => c.districts.some((d) => d.name === name))) return "district"
  if (ORG_TREE.some((c) => c.districts.some((d) => d.schools.some((s) => s.name === name))))
    return "school"
  return undefined
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

// ===================== 题目标签体系（字典管理） =====================
// 标注维度可后台自定义增删（内置维度 + 自定义维度），各维度下再配置具体标签。
// 知识点是独立体系（KnowledgePoint，绑定学科/章节），不在此维度内重复管理。
// 维度 key：内置为固定字符串（difficulty 等），自定义为生成的 "dim-xxx"。
export type TagDimensionKey = string

// 通用学科：难度、学习水平等通用标准归入该学科，全学科共享
export const UNIVERSAL_SUBJECT = "通用"

export interface TagDimensionMeta {
  key: TagDimensionKey
  label: string
  select: "single" | "multiple" // 题目标注时单选 / 多选
  bySubject: boolean // 是否按学科区分（false=通用标准，归入“通用”学科）
  builtin: boolean // 是否内置维度（内置可改名/删除，自定义同样可删）
  desc: string
}

// 难度维度的固定 key：题目难度走独立的 difficulty 数值字段，UI 特殊处理
export const DIFFICULTY_DIM_KEY = "difficulty"

// 内置维度种子。store 以此初始化为可变状态，后续支持增删改。
export const DEFAULT_TAG_DIMENSIONS: TagDimensionMeta[] = [
  { key: "difficulty", label: "难度", select: "single", bySubject: false, builtin: true, desc: "难度档位，可自定义新增、改名、排序" },
  { key: "learningLevel", label: "学习水平", select: "single", bySubject: false, builtin: true, desc: "认知/学习层级，如记忆、理解、应用" },
  { key: "contentDomain", label: "内容领域", select: "multiple", bySubject: true, builtin: true, desc: "学科内容板块划分" },
  { key: "literacy", label: "核心素养", select: "multiple", bySubject: true, builtin: true, desc: "学科核心素养标签" },
  { key: "scene", label: "情境属性", select: "single", bySubject: true, builtin: true, desc: "题目情境类型" },
  { key: "usage", label: "教学用途", select: "multiple", bySubject: true, builtin: true, desc: "题目的教学使用场景" },
]

// 标���字典作用域：平台基准（所有区域共享）或具体机构名（市/区/校）
export const BASE_SCOPE = "base"

// 标签项：一条具体的字典值。scope = BASE_SCOPE（平台基准）或机构名（区域专属）
export interface TagItem {
  id: string
  dimensionKey: TagDimensionKey
  subject: string // 通用维度（难度）用 "通用"
  name: string
  order: number
  scope: string // BASE_SCOPE | 机构名（如 "上海市" / "徐汇区"）
  tier?: number // 难度专用：固定档位 1~5
}

// 区域对“基准标签”的停用覆盖（区域可隐藏不适用的基准项，但不删除基准）
export interface TagDisable {
  tagId: string
  scope: string // 在该机构下停用
}

// 给定机构名，返回从平台基准到该机构的作用域继承链：[base, 市, 区, 校...]
export function tagScopeChain(scopeName?: string): string[] {
  if (!scopeName || scopeName === BASE_SCOPE) return [BASE_SCOPE]
  for (const city of ORG_TREE) {
    if (city.name === scopeName) return [BASE_SCOPE, city.name]
    for (const d of city.districts) {
      if (d.name === scopeName) return [BASE_SCOPE, city.name, d.name]
      for (const s of d.schools) {
        if (s.name === scopeName) return [BASE_SCOPE, city.name, d.name, s.name]
      }
    }
  }
  return [BASE_SCOPE]
}

// 解析某维度在“某学科 + 某机构”下最终可用的标签：
// 基准 + 继承链上各级区域专属，减去链上任意一级停用的项；按 order 排序。
export function resolveTagOptions(
  items: TagItem[],
  disables: TagDisable[],
  dimensions: TagDimensionMeta[],
  dimensionKey: TagDimensionKey,
  subject: string,
  scopeName?: string,
): TagItem[] {
  const meta = dimensions.find((d) => d.key === dimensionKey)
  const chain = tagScopeChain(scopeName)
  const chainSet = new Set(chain)
  const disabledIds = new Set(
    disables.filter((d) => chainSet.has(d.scope)).map((d) => d.tagId),
  )
  return items
    .filter((t) => t.dimensionKey === dimensionKey)
    .filter((t) => (meta?.bySubject ? t.subject === subject : true))
    .filter((t) => chainSet.has(t.scope))
    .filter((t) => !disabledIds.has(t.id))
    .sort((a, b) => a.order - b.order)
}

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
  // 教师端标注维度（兼容旧字段，用于卡片详情展示）
  literacy?: string[] // 核心素养
  cognitive?: string // 认知层级（= 学习水平）
  usage?: string[] // 教学用途
  scene?: string // 情景属性
  teachTags?: string[] // 自定义教学标签
  // 维度标注值：按维度 key 存所选标签名（含自定义维度），是动态标注的统一存储
  dimTags?: Record<string, string[]>



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

// 精品资源（独立类型）：平台/区域精选的优质资源包，可由组卷或专题构成，同样�� 市/区/校 级别
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
  // 专题资源（category="special"）的结构化题目包：有序板块
  sections?: TopicSection[]
}

// ===================== 专题资源：结构化题目包 =====================
// 专题 = 多个有序板块（Section），每个板块下多个条目（Item）。
// 条目要么是“纯文本块”（补充知识/自我归纳等讲解），要么是“题目”（题干+答案+解析+视频讲解）。
// 题目在专题内直接录入，视频讲解挂在题目条目上。
export type TopicItemType = "text" | "question"

// 视频讲解
export interface TopicVideo {
  title?: string // 如 “视频1”
  url?: string // 视频地址
  duration?: string // 时长，如 “3:25”
}

// 纯文本块：补充知识、自我归纳等非题目内容
export interface TopicTextItem {
  id: string
  type: "text"
  title?: string // 文本块小标题（可选）
  content: string // 讲解正文
}

// 题目条目：专题内直接录入的题目，含可选视频讲解
export interface TopicQuestionItem {
  id: string
  type: "question"
  label?: string // 题目编号/标识，如 “例1” “1”
  stem: string // 题干
  answer?: string // 答案
  analysis?: string // 解析
  video?: TopicVideo // 视频讲解
}

export type TopicItem = TopicTextItem | TopicQuestionItem

// 板块：如 补充知识 / 自学例题 / 自我检测 / 巩固练习 / 阶段练习
export interface TopicSection {
  id: string
  title: string
  intro?: string // 板块说明（可选）
  items: TopicItem[]
}

// —— 专题统计辅助 ——
export function topicQuestionCount(p: Pick<Premium, "sections">): number {
  return (p.sections ?? []).reduce(
    (n, s) => n + s.items.filter((it) => it.type === "question").length,
    0,
  )
}
export function topicVideoCount(p: Pick<Premium, "sections">): number {
  return (p.sections ?? []).reduce(
    (n, s) =>
      n +
      s.items.filter((it) => it.type === "question" && !!(it as TopicQuestionItem).video?.url)
        .length,
    0,
  )
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
