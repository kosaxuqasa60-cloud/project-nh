// 生成《资源中心-微课需求文档》.docx
import {
  cover, build, h1, h2, h3, p, bullet, bulletKV, table, img, caption,
  spacer, pageBreak, T_REQ, T_PAGE, T_INTERACT, T_DATA, T_RULE,
} from "./doc-helpers.mjs"

const c = []

cover(c, {
  title: "微课",
  sub: "需求文档",
  moduleLabel: "资源中心 / 微课",
  name: "《资源中心-微课需求文档》",
})

// ============ 1. 文档概述 ============
c.push(h1("一、文档概述"))

c.push(h2("1.1 文档目的"))
c.push(
  p(
    "本文档面向 UI 设计、前端、后端及测试人员，完整描述「资源中心 - 微课」模块的产品需求、页面结构、交互规则、数据流转与业务规则，作为设计、研发与验收的统一依据。",
  ),
)

c.push(h2("1.2 模块定位"))
c.push(
  p(
    "微课是平台沉淀的短视频教学资源，围绕单一知识点或专题进行讲解。每节微课对应一段教学视频，并附带年级、学科、教材章节、创作者、封面、附件、简介、分类与发布状态等结构化信息，便于按教材结构组织、检索与下发。",
  ),
)
c.push(
  p(
    "微课模块默认以列表形式呈现全部微课，提供搜索与多维筛选；通过专属表单完成新建与编辑，支持年级与教材章节挂载、视频链接、封面与附件的前端模拟上传等。",
  ),
)

c.push(h2("1.3 名词术语"))
c.push(
  table(
    ["术语", "说明"],
    [
      ["微课", "围绕单一知识点 / 专题的短视频教学资源。"],
      ["年级", "微课适用年级，必填，是组织与筛选的核心维度。"],
      ["章节挂载", "将微课关联到具体教材的章节目录，可挂载多个；非必填。"],
      ["授权范围 / 级别", "微课的可见与归属范围，分平台、城市、区、校等层级。"],
      ["创作者", "微课的制作者姓名及其所属单位 / 学校。"],
      ["微课分类", "同步讲解、专题突破、复习巩固、考点精析、其他。"],
      ["状态", "草稿 / 已发布，控制微课是否对外可见。"],
      ["附件", "微课的配套资料（如讲义、练习），支持前端模拟上传。"],
    ],
    [20, 80],
  ),
)

// ============ 2. 信息架构与数据模型 ============
c.push(h1("二、信息架构与数据模型"))

c.push(h2("2.1 模块结构"))
c.push(bullet("资源中心 → 微课 → 微课列表（默认页）"))
c.push(bullet("微课列表 → 新建微课 / 编辑微课（微课表单页）"))

c.push(h2("2.2 核心数据模型"))
c.push(p("微课（Microlesson）的主要字段："))
c.push(
  table(
    ["字段", "类型", "说明"],
    [
      ["id", "string", "微课唯一标识"],
      ["title", "string", "微课标题（必填）"],
      ["subject", "string", "所属学科"],
      ["grade", "string", "适用年级（必填）"],
      ["duration", "string", "视频时长，如 08:30"],
      ["videoUrl", "string?", "视频地址（链接录入）"],
      ["coverImage", "string?", "封面图（模拟上传）"],
      ["creatorName", "string?", "创作者姓名"],
      ["creatorOrg", "string?", "创作者单位 / 学校"],
      ["intro", "string?", "简介 / 课程描述"],
      ["category", "枚举", "微课分类：同步 / 专题 / 复习 / 考点 / 其他"],
      ["status", "枚举", "草稿 draft / 已发布 published"],
      ["level / ownerScope", "枚举 / string", "授权级别与归属范围"],
      ["attachments", "Attachment[]", "附件列表（文件名 / 大小）"],
      ["knowledgePointIds", "string[]", "关联知识点"],
      ["chapterMounts", "Mount[]", "教材章节挂载（教材 + 章节）"],
      ["viewCount", "number?", "观看数"],
      ["updatedAt", "string", "更新日期"],
    ],
    [26, 26, 48],
  ),
)

// ============ 3. 微课列表页 ============
c.push(pageBreak())
c.push(h1("三、微课列表页"))

c.push(h2("3.1 " + T_REQ))
c.push(p("作为微课模块的默认入口，以列表形式概览全部微课，支持检索、多维筛选、新建、编辑与删除。"))
c.push(bullet("默认以「列表（行）」形式呈现，单行信息密度高于卡片。"))
c.push(bullet("每行展示封面缩略图、标题、级别、分类、章节挂载与附件数、年级 / 学科、创作者 / 单位、时长 / 观看数、状态。"))
c.push(bullet("提供「新建微课」入口；每行提供「编辑」「删除」操作。"))
c.push(bullet("支持按标题搜索，按学科 / 年级 / 状态筛选。"))

c.push(h2("3.2 " + T_PAGE))
c.push(img("m01-list.png"))
c.push(caption("图 3-1 微课列表页"))
c.push(p("页面顶部为标题、计数与「新建微课」按钮，其下为搜索框与学科 / 年级 / 状态筛选器，主体为微课行列表。每行自左至右包含："))
c.push(bullet("封面缩略图；"))
c.push(bullet("标题及级别徽标、分类、章节挂载数、附件数；"))
c.push(bullet("年级 / 学科；"))
c.push(bullet("创作者姓名与单位；"))
c.push(bullet("时长与观看数；"))
c.push(bullet("状态徽标（已发布 / 草稿）；"))
c.push(bullet("「编辑」「删除」操作。"))

c.push(h2("3.3 " + T_INTERACT))
c.push(bulletKV("新建微课", "进入空白微课表单页。"))
c.push(bulletKV("编辑", "进入微课表单页并载入该微课全部字段。"))
c.push(bulletKV("删除", "二次确认弹窗，确认后从列表移除并解除其章节挂载。"))
c.push(bulletKV("搜索", "按标题实时过滤。"))
c.push(bulletKV("筛选", "学科 / 年级 / 状态多条件叠加过滤。"))

c.push(h2("3.4 " + T_RULE))
c.push(bullet("章节挂载数与附件数由该微课数据实时统计。"))
c.push(bullet("草稿状态的微课在面向学生 / 对外场景不可见，仅管理端可见。"))
c.push(bullet("删除为不可恢复操作（演示态为前端状态）。"))

// ============ 4. 微课表单页 ============
c.push(pageBreak())
c.push(h1("四、微课表单页（新建 / 编辑）"))

c.push(h2("4.1 " + T_REQ))
c.push(p("用于录入与维护微课的全部字段，分为基本信息、创作者、授权范围、视频与素材、教材章节挂载、关联知识点等分区。"))
c.push(bullet("基本信息：标题（必填）、学科、年级（必填）、时长、分类、状态、简介。"))
c.push(bullet("创作者：姓名、单位 / 学校。"))
c.push(bullet("授权范围：级别 + 归属（平台 / 城市 / 区 / 校联动）。"))
c.push(bullet("视频与素材：视频链接录入、封面图模拟上传、附件模拟上传。"))
c.push(bullet("教材章节挂载：按年级联动教材，添加一个或多个章节挂载。"))
c.push(bullet("关联知识点：勾选与本微课相关的知识点。"))

c.push(h2("4.2 " + T_PAGE + "：基本信息"))
c.push(img("m02-form-basic.png"))
c.push(caption("图 4-1 微课表单 - 基本信息"))
c.push(p("顶栏含返回与保存按钮。基本信息区包含标题（必填）、学科 / 年级（必填）/ 时长、微课分类与状态、简介等字段。"))

c.push(h2("4.3 " + T_PAGE + "：完整表单"))
c.push(img("m03-form-full.png"))
c.push(caption("图 4-2 微课表单 - 完整分区（创作者 / 授权范围 / 视频与素材 / 章节挂载 / 知识点）"))
c.push(p("完整表单自上而下依次为：基本信息、创作者、授权范围、视频与素材（视频链接 + 封面上传 + 附件上传）、教材章节挂载、关联知识点。"))

c.push(h2("4.4 " + T_INTERACT))
c.push(bulletKV("年级选择", "年级为必填项；选定年级后教材章节挂载按该年级联动可选教材。"))
c.push(bulletKV("章节挂载", "可添加多条挂载（教材 + 章节），亦可不挂载；支持移除单条。"))
c.push(bulletKV("视频链接", "以链接方式录入视频地址。"))
c.push(bulletKV("封面 / 附件上传", "前端模拟上传，选取后展示预览 / 文件名（演示态不落地存储）。"))
c.push(bulletKV("授权范围", "选择级别后联动归属范围（城市 / 区 / 校）。"))
c.push(bulletKV("保存", "校验标题与年级后写入，返回列表并提示成功。"))

c.push(h2("4.5 " + T_DATA))
c.push(bullet("新建：createMicrolesson 生成 id 并写入全部字段，updatedAt 取当前日期。"))
c.push(bullet("编辑：updateMicrolesson 按 id 局部覆盖并更新 updatedAt。"))
c.push(bullet("章节挂载以「教材 ID + 章节 ID」数组形式随微课一并存储。"))

c.push(h2("4.6 " + T_RULE))
c.push(bullet("标题与年级为必填项，未填写不可保存。"))
c.push(bullet("状态默认为草稿；设为已发布后微课对外可见。"))
c.push(bullet("章节挂载非必填，但挂载的教材须与所选年级一致。"))
c.push(bullet("视频以链接录入；封面与附件采用前端模拟上传。"))

await build(c, {
  out: "docs/《资源中心-微课需求文档》.docx",
  title: "资源中心-微课需求文档",
})
