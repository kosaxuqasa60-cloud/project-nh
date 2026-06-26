// 资源中心-题库 需求文档生成脚本
// 运行：node scripts/gen-requirements-doc.mjs
// 输出：docs/资源中心-题库需求文档.docx
import fs from "node:fs"
import path from "node:path"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  TableOfContents,
} from "docx"

const ASSETS = "docs/assets"
const OUT = "docs/资源中心-题库需求文档.docx"

// —— 主题色 ——
const BRAND = "2E7D54" // 品牌绿
const INK = "1F2937" // 正文深灰
const MUTED = "6B7280" // 次要灰
const LINE = "D1D5DB" // 边框
const SOFT = "EAF3EC" // 浅绿底
const HEADBG = "2E7D54" // 表头底

const FONT = "Microsoft YaHei"

// 图片按内容宽度等比缩放（截图 1280x577）
const IMG_W = 560
const IMG_H = Math.round((IMG_W * 577) / 1280)

// —— 辅助函数 ——
function img(file) {
  const p = path.join(ASSETS, file)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [
      new ImageRun({
        data: fs.readFileSync(p),
        transformation: { width: IMG_W, height: IMG_H },
        // 细边框，让截图更像“插图”
        outline: { type: "solidFill", solidFillType: "rgb", value: LINE, width: 6350 },
      }),
    ],
  })
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, size: 18, color: MUTED, italics: true })],
  })
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: BRAND })],
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: INK })],
  })
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 21, bold: true, color: BRAND })],
  })
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320 },
    children: [new TextRun({ text, font: FONT, size: 21, color: INK, ...opts })],
  })
}

// 项目符号列表
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 21, color: INK })],
  })
}

// 带前导标签的列表项：「标签」描述
function bulletKV(key, val) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 300 },
    children: [
      new TextRun({ text: key + "：", font: FONT, size: 21, bold: true, color: INK }),
      new TextRun({ text: val, font: FONT, size: 21, color: INK }),
    ],
  })
}

function cell(text, { bold = false, color = INK, bg, width, header = false } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: bg ? { type: ShadingType.CLEAR, fill: bg } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT,
            size: 19,
            bold: bold || header,
            color: header ? "FFFFFF" : color,
          }),
        ],
      }),
    ],
  })
}

// 通用表格：headers=[], rows=[[...]], widths=[]
function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE }
  const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { header: true, bg: HEADBG, width: widths?.[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(c, { width: widths?.[i] })),
          }),
      ),
    ],
  })
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] })
}

// 小节固定四件套标题
const T_REQ = "核心需求说明"
const T_PAGE = "页面说明"
const T_INTERACT = "页面交互规则"
const T_DATA = "数据流转"
const T_RULE = "业务规则"

// 各功能点内容在 sections.mjs 暂不拆分，下面 buildBody() 内联构建
const children = []

// ============ 封面 ============
children.push(
  new Paragraph({ spacing: { before: 1800 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "点这笔 · 资源后台管理", font: FONT, size: 28, color: BRAND, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: "资源中心 - 题库", font: FONT, size: 56, bold: true, color: INK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "需求文档", font: FONT, size: 40, bold: true, color: MUTED })],
  }),
)

// 文档信息表
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [] }),
  table(
    ["文档项", "内容"],
    [
      ["文档名称", "资源中心-题库需求文档"],
      ["产品模块", "点这笔 · 资源后台管理 / 资源中心 / 题库"],
      ["文档版本", "V1.0"],
      ["面向对象", "UI 设计、前端开发、后端开发、测试"],
      ["文档状态", "评审稿"],
      ["更新日期", new Date().toISOString().slice(0, 10)],
    ],
    [30, 70],
  ),
)

children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 目录 ============
children.push(
  h1("目录"),
  new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
)

// ============ 1. 文档概述 ============
children.push(h1("一、文档概述"))
children.push(h2("1.1 文档目的"))
children.push(
  p(
    "本文档面向 UI 设计与研发测试团队，系统说明「资源中心-题库」模块的功能需求、页面结构、交互规则、数据流转与业务规则，作为设计、开发与测试的共同依据。文档按功能点组织，每个功能点均配真实页面截图，确保需求可视、可对照、可验收。",
  ),
)

children.push(h2("1.2 模块定位"))
children.push(
  p(
    "题库是资源中心的核心子模块，承载平台全部题目资源的录入、标注、归集、检索与版本治理。题目是“资源”，但其背后绑定的是学生的真实做题数据，因此题库在“内容可编辑”与“统计可追溯”之间需要严谨的版本与归属机制。",
  ),
)
children.push(
  bullet("内容轴：题目通过知识点与章节挂载，归集到教材目录树下，供组卷、作业、精品资源引用。"),
  bullet("归属轴：题目按 市 / 区 / 校 三级机构归属，支持上级向下级下发共享。"),
  bullet("版本轴：题目内容一旦被学生作答，修改须以“新版本”形式留存，旧版本归档以保留历史统计。"),
)

children.push(h2("1.3 名词术语"))
children.push(
  table(
    ["术语", "说明"],
    [
      ["题目族", "题目的稳定逻辑身份（ID 不变），承载可变的元数据与全部版本。统计顺着题目族汇总。"],
      ["题目版本", "某一时刻题目内容（题干/题型/选项/答案/解析）的不可变快照，含该版本独立的作答统计。"],
      ["内容字段", "题干、题型、选项、答案、解析。修改这些字段在有作答数据时需另存为新版本。"],
      ["元数据", "难度、知识点、核心素养、认知层级、情景属性、教学用途、教学标签、章节挂载、授权范围等，可直接修改。"],
      ["机构上下文", "当前“进入”的 市/区/校 视角，决定题库展示哪个机构范围内的题目。"],
      ["含上级下发", "查看下级机构时，是否叠加显示上级机构下发共享的题目。"],
      ["授权范围/级别", "题目归属的机构层级（市级/区级/校级）及具体机构（如“徐汇区”）。"],
    ],
    [22, 78],
  ),
)

children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 2. 信息架构与导航 ============
children.push(h1("二、信息架构与导航"))
children.push(
  p("题库位于左侧导航「资源中心 > 题库」。页面采用左右两栏布局：左栏为教材/章节内容树，右栏为机构上下文栏、筛选区与题目列表。"),
)
children.push(h2("2.1 页面整体结构"))
children.push(img("01-library-overview.png"))
children.push(caption("图 2-1 题库主页面整体结构"))
children.push(
  table(
    ["区域", "说明"],
    [
      ["左侧导航", "配置流程入口：教材管理、资源中心（题库/作业/精品资源/微课/空中课堂）、教材同步关系。"],
      ["教材卡 + 章节树（左栏）", "顶部展示当前教材封面与版本，下方为“全部题目/未归入章节 + 各章节”的题数统计树。"],
      ["机构上下文栏（右栏顶部）", "面包屑式 市 › 区 › 校 切换，显示当前范围题数、含上级下发开关、重置。"],
      ["筛选区（右栏）", "授权范围/级别、题型、难度、关键词，可展开“更多筛选条件”。"],
      ["题目列表（右栏）", "题目卡片，支持列表/网格视图、多选、批量操作。"],
    ],
    [32, 68],
  ),
)
children.push(
  bulletKV("数据流转", "页面加载时拉取教材、章节、题目三类数据；左栏章节树的题数、右栏机构题数、级别计数均由当前题目集合按条件实时计算。"),
)

children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点一：题库浏览与筛选 ============
children.push(h1("三、功能点一：题库浏览与筛选"))

children.push(h2("3.1 " + T_REQ))
children.push(
  p("用户进入题库后，需能沿教材章节树定位题目，并按授权范围/级别、题型、难度、关键词组合筛选，快速找到目标题目；支持列表与网格两种视图，支持多选后批量操作。"),
)

children.push(h2("3.2 " + T_PAGE))
children.push(img("02-filters.png"))
children.push(caption("图 3-1 展开“更多筛选条件”后的完整筛选区"))
children.push(
  table(
    ["元素", "说明"],
    [
      ["章节树（左栏）", "“全部题目 / 未归入章节 + 各章节”，每项右侧显示题数；点击章节即筛选该章节题目。"],
      ["授权范围 / 级别", "全部 / 市级 / 区级 / 校级，chip 右侧显示当前机构上下文下的实时题数。"],
      ["题型", "全部 / 单选题 / 多选题 / 填空题 / 判断题 / 解答题。"],
      ["难度", "全部 / 1星·易 / 2星·易 / 3星·中 / 4星·难 / 5星·难。"],
      ["关键词", "按题干内容模糊匹配。"],
      ["视图切换", "右上角列表 / 网格两种视图切换。"],
    ],
    [28, 72],
  ),
)

children.push(h2("3.3 " + T_INTERACT))
children.push(
  bullet("章节树点击：选中某章节，仅展示挂载到该章节（含子章节）的题目；“全部题目”取消章节限制。"),
  bullet("筛选项为“与”关系：章节、级别、题型、难度、关键词、机构上下文同时生效，结果取交集。"),
  bullet("“更多筛选条件”可展开/收起难度与关键词，收起时保留已选条件。"),
  bullet("级别 chip 文案随机构上下文动态显示计数（如“市级 6 · 区级 1 · 校级 0”）。"),
  bullet("多选：勾选题目卡复选框后出现批量操作（批量挂载章节、批量设级别、批量删除等）；“全选”作用于当前筛选结果。"),
)

children.push(h2("3.4 " + T_DATA))
children.push(
  bulletKV("输入", "教材 ID、选中章节、机构上下文、级别/题型/难度/关键词筛选条件。"),
  bulletKV("处理", "前端对题目集合按“章节匹配 → 机构匹配 → 级别 → 题型 → 难度 → 关键词”依次过滤。"),
  bulletKV("输出", "题目列表结果集、各章节题数、级别计数。筛选条件变化即重算，无需刷新页面。"),
)

children.push(h2("3.5 " + T_RULE))
children.push(
  bullet("题数统计口径以“当前机构上下文 + 章节范围”为基准，与级别筛选联动但不互相覆盖。"),
  bullet("关键词匹配范围为题干文本；公式（$...$）按原始文本匹配。"),
  bullet("题目卡始终展示：题型、具体归属（如“市级·上海市”）、难度、版本角标（vN/总数）、是否含讲解视频。"),
)
children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点二：教材切换（年级学期 + 机构联动） ============
children.push(h1("四、功能点二：教材切换（年级学期 + 机构联动）"))

children.push(h2("4.1 " + T_REQ))
children.push(
  p("题库内容随教材而定。用户需先选择年级与学期，再从匹配的教材版本中切换；同时教材与机构存在联动关系——部分教材仅特定区域可见（如沪教版仅上海市），切换该教材时机构范围相应受限。"),
)

children.push(h2("4.2 " + T_PAGE))
children.push(img("03-textbook-switch.png"))
children.push(caption("图 4-1 切换教材弹窗：先选年级学期，再选教材版本"))
children.push(
  table(
    ["元素", "说明"],
    [
      ["年级选择", "按学段分组：小学（一~六年级）、初中（七~九年级）、高中（高一~高三）。"],
      ["学期/册次", "全部 / 上册 / 下册 / 全一册。"],
      ["教材列表", "按所选年级、学期实时过滤；命中教材以卡片列出（封面、名称、学科·版本·年级），当前教材标注“当前”。"],
    ],
    [26, 74],
  ),
)

children.push(h2("4.3 " + T_INTERACT))
children.push(
  bullet("弹窗打开时默认对齐当前教材所属年级。"),
  bullet("选择年级 / 学期后，下方教材列表实时过滤；无匹配时提示“该年级/学期暂无教材”。"),
  bullet("点击某教材即切换，页面左栏教材卡、章节树与右栏题目列表随之刷新。"),
  bullet("教材与机构联动（业务规则，见 4.5）：选定区域专属教材后，机构上下文栏可切换的机构范围相应受限。"),
)

children.push(h2("4.4 " + T_DATA))
children.push(
  bulletKV("输入", "年级、学期、目标教材 ID。"),
  bulletKV("处理", "按年级 + 学期过滤教材集合；切换教材后以新教材 ID 重新拉取章节树与题目。"),
  bulletKV("输出", "当前教材、章节树、题目列表；机构上下文可选范围（受教材可见区域约束）。"),
)

children.push(h2("4.5 " + T_RULE))
children.push(
  bullet("教材与机构为联动关系：部分教材仅对应区域可见。例如“沪教版”仅上海市可见，切换到沪教版教材时，机构上下文的机构切换仅出现“上海市”。"),
  bullet("通用教材（如人教版、北师大版）不受区域限制，机构上下文可在全部机构间切换。"),
  bullet("年级取值与教材 grade 字段一致，覆盖小学一年级至高三。"),
)
children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点三：机构归属上下文切换 ============
children.push(h1("五、功能点三：机构归属上下文切换"))

children.push(h2("5.1 " + T_REQ))
children.push(
  p("平台为多租户结构，题目按 市 / 区 / 校 三级归属。用户需能直观地“进入”某个机构视角查看其题库（如上海市市级题库、徐汇区题库、某校校本题库），并可选择是否叠加上级下发共享的题目。"),
)

children.push(h2("5.2 " + T_PAGE))
children.push(img("04-org-context.png"))
children.push(caption("图 5-1 机构上下文：上海市 › 徐汇区，含上级下发开关与级别计数"))
children.push(
  table(
    ["元素", "说明"],
    [
      ["面包屑切换", "全部机构 › 市 › 区 › 校，逐级分段下拉；越深越具体。"],
      ["范围题数", "面包屑右侧显示当前机构范围内题目总数（如“7 道题”）。"],
      ["含上级下发开关", "进入下级机构后出现；开启=叠加上级下发题目，关闭=仅本级自有题目。"],
      ["重置", "一键回到“全部机构”。"],
      ["级别计数", "筛选区级别 chip 显示当前上下文下 市/区/校 题数。"],
    ],
    [28, 72],
  ),
)

children.push(h2("5.3 " + T_INTERACT))
children.push(
  bullet("逐级下钻：选市后出现“区”级下拉，选区后出现“校”级下拉。"),
  bullet("切换任一级即重新筛选题库；面包屑右侧题数与级别计数实时更新。"),
  bullet("“含上级下发”默认开启；关闭后仅显示当前机构自有题目。"),
  bullet("“重置”清空机构上下文，回到全部机构（开关恢复默认开启）。"),
)

children.push(h2("5.4 " + T_DATA))
children.push(
  bulletKV("输入", "当前机构上下文（市/区/校）、含上级下发开关。"),
  bulletKV("处理", "解析出应匹配的机构名集合——仅本级=最深选中机构；含上级=该链上从市到最深一节的全部机构名。题目按 ownerScope 是否落入集合过滤。"),
  bulletKV("输出", "机构范围内题目结果集、范围题数、各级别题数。"),
)

children.push(h2("5.5 " + T_RULE))
children.push(
  bullet("题目 ownerScope（具体机构）隐含其级别：归属“徐汇区”必为区级，无需单独维护级别。"),
  bullet("含上级下发示例：徐汇区“含上级”=上海市下发题 + 徐汇区自有题；“仅本级”=仅徐汇区自有题。"),
  bullet("本期不做登录角色权限边界，可自由切换至任意 市/区/校（后续可在此基础上叠加角色限制）。"),
)
children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点四：题目版本管理 ============
children.push(h1("六、功能点四：题目版本管理"))

children.push(h2("6.1 " + T_REQ))
children.push(
  p("题目是资源，但背后绑定学生的真实作答数据。题目内容一旦被学生作答，便不应就地修改（否则历史正确率失真）；也不能简单复制成新题（否则统计血缘断裂）。因此引入“题目族 + 版本”机制：内容修改以新版本留存，旧版本归档保留统计；引用方钉死创建时版本。"),
)

children.push(h2("6.2 " + T_PAGE))
children.push(img("05-version-history.png"))
children.push(caption("图 6-1 版本历史：族级累计汇总 + 版本时间线"))
children.push(img("06-version-compare.png"))
children.push(caption("图 6-2 版本对比：v1 → v2 并排，含正确率变化"))
children.push(
  table(
    ["元素", "说明"],
    [
      ["版本角标", "题目卡显示“vN / 版本总数”，点击进入版本历史。"],
      ["族级汇总", "版本历史顶部：累计组卷次数、累计学生数、版本数（跨全部版本汇总）。"],
      ["版本时间线", "各版本卡片：版本号、状态（已发布/已归档）、题型、日期、修订说明、组卷/学生/正确率。"],
      ["版本对比", "勾选两个版本并排对比题干与统计，显示正确率变化（如 +18%）。"],
    ],
    [26, 74],
  ),
)

children.push(h2("6.3 " + T_INTERACT))
children.push(
  bullet("点击题目卡版本角标或“版本”按钮，右侧滑出版本历史 Sheet。"),
  bullet("时间线按版本号倒序：当前版本标“已发布”，历史版本标“已归档”。"),
  bullet("勾选任意两个版本，顶部出现并排对比区，高亮正确率变化。"),
  bullet("另存为新版本：编辑题目时若改动内容字段且该题已有作答数据，保存按钮变为“另存为新版本…”，弹窗填写修订说明后生成新版本。"),
)

children.push(h2("6.4 " + T_DATA))
children.push(
  bulletKV("输入", "题目族 ID、修改后的内容字段、修订说明。"),
  bulletKV("处理", "生成新版本号（max+1），旧版本状态置为“已归档”并保留各自统计；新版本状态“已发布”、统计清零；题目族顶层内容镜像新版本。"),
  bulletKV("输出", "更新后的版本列表、当前版本、族级汇总。作业/精品的引用仍指向其创建时钉死的版本。"),
)

children.push(h2("6.5 " + T_RULE))
children.push(
  bullet("触发方式：手动“另存为新版本”，系统不自动分叉。"),
  bullet("内容字段（题干/题型/选项/答案/解析）改动 + 已有作答数据 → 引导另存新版；元数据（难度/标注等）可直接改，不产生新版本。"),
  bullet("引用钉版：已发布的作业/试卷永远指向创建时的版本，不随题目升级而变；可对草稿提供“升级到最新版本”动作。"),
  bullet("有作答数据的版本只能归档、不能硬删，保证可追溯。"),
  bullet("统计口径：版本级（各版本独立组卷/学生/正确率）+ 族级（跨版本累计），均可查看。"),
)
children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点五：题目增删改与文件导入 ============
children.push(h1("七、功能点五：题目增删改与文件导入"))

children.push(h2("7.1 " + T_REQ))
children.push(
  p("支持单题新建/编辑（含内容、标注、授权、章节挂载），以及通过固定 Excel 模板批量导入题目。导入采用“下载模板→填写上传→逐题确认→批量入库”流程，模板内含详细导入说明。"),
)

children.push(h2("7.2 " + T_PAGE))
children.push(img("08-new-question.png"))
children.push(caption("图 7-1 新建题目页：题目内容 + 授权范围 + 章节挂载"))
children.push(img("10-edit-dialog.png"))
children.push(caption("图 7-2 编辑题目弹窗"))
children.push(img("11-new-version-prompt.png"))
children.push(caption("图 7-3 编辑有作答数据的题目时，引导“另存为新版本”"))
children.push(img("07-file-import.png"))
children.push(caption("图 7-4 文件导入：下载模板 / 上传已填写模板"))
children.push(
  table(
    ["元素", "说明"],
    [
      ["题目内容", "学科、题型、难度、题干（支持 $...$ 公式）、选项、答案、解析、讲解视频。"],
      ["授权范围", "市/区/校级联选择，资源必须归属到具体机构。"],
      ["章节挂载", "挂入当前教材章节目录（可多选）。"],
      ["文件导入", "步骤条：下载/上传模板 → 读取表格 → 确认入库；模板含“导入说明”与“题目数据”两个工作表。"],
    ],
    [24, 76],
  ),
)

children.push(h2("7.3 " + T_INTERACT))
children.push(
  bullet("新建题目：题型为选择题时展示选项编辑（可增删选项 A~F）；非选择题隐藏选项。"),
  bullet("编辑题目：内容字段改动 + 已有作答数据时，出现提示横幅、保存按钮变“另存为新版本…”（见功能点四）。"),
  bullet("删除题目：有作答数据时应二次确认；删除会一并解除章节挂载。"),
  bullet("文件导入：第一步下载模板（以中文名“题目导入模板.xlsx”下载），第二步上传 .xlsx/.xls，系统读取“题目数据”工作表并逐题预览确认。"),
)

children.push(h2("7.4 " + T_DATA))
children.push(
  bulletKV("输入", "题目内容/标注/授权/挂载字段；或上传的 Excel 模板文件。"),
  bulletKV("处理", "新建写入题库并初始化 v1；导入读取“题目数据”工作表、校验题型/答案/难度后转为待入库草稿。"),
  bulletKV("输出", "入库后的题目进入资源库，可在教材章节中挂载、被作业/精品引用。"),
)

children.push(h2("7.5 " + T_RULE))
children.push(
  bullet("题干为必填；授权范围（市/区/校）必须完成选择。"),
  bullet("Excel 模板为固定格式，“导入说明”工作表标明逐列填写规范与注意事项；“题目数据”工作表含表头与各题型示例行，题型/难度带数据校验。"),
  bullet("仅支持 .xlsx / .xls，单文件不超过 10MB。"),
)
children.push(new Paragraph({ children: [new PageBreak()] }))

// ============ 功能点六：AI 一键生成标签 + 标签库 ============
children.push(h1("八、功能点六：AI 一键生成标签与标签库"))

children.push(h2("8.1 " + T_REQ))
children.push(
  p("新建/编辑题目时，提供“AI 生成标注”一键能力：依据题干内容，从后台配置的标签库中智能挑选合适的标签（核心素养、认知层级、情境属性、教学用途、知识点等），由人工在此基础上微调确认。标签并非自由生成，而是从标签库中“挑选”，以保证口径统一、可统计。"),
)

children.push(h2("8.2 " + T_PAGE))
children.push(img("09a-annotation-before.png"))
children.push(caption("图 8-1 标注体系与“AI 生成标注”入口"))
children.push(img("09b-annotation-after.png"))
children.push(caption("图 8-2 AI 生成后：各维度标签自动选中，可手动调整"))

children.push(h2("8.3 标签库（后台配置）"))
children.push(
  p("标签库由后台统一维护，是 AI 挑选与人工标注的唯一来源。维度固定，管理员只在各维度下增删改具体标签；标签按学科区分（不同学科内容不同）。"),
)
children.push(
  table(
    ["维度", "选择规则", "说明"],
    [
      ["知识点", "多选", "按学科与章节体系组织，是题目归集与自动挂载的依据。"],
      ["核心素养", "多选", "学科核心素养标签（如数学：数学运算、逻辑推理、数学建模等）。"],
      ["认知层级", "单选", "如：了解 / 理解 / 应用 / 分析等。"],
      ["情境属性", "单选", "如：纯数学情境 / 生活情境 / 科学情境等。"],
      ["内容领域", "多选", "学科内容板块划分（按学科定义）。"],
    ],
    [18, 16, 66],
  ),
)
children.push(spacer())
children.push(
  bulletKV("维度配置", "5 个维度固定，不支持后台新增自定义维度；管理员仅配置每个维度下的具体标签。"),
  bulletKV("学科区分", "每个标签归属具体学科；AI 挑选与人工选择时，仅展示当前题目学科下的标签。"),
  bulletKV("单/多选", "认知层级、情境属性为单选；知识点、核心素养、内容领域为多选。"),
)

children.push(h2("8.4 AI 生成规则与 Prompt 设计"))
children.push(
  p("AI 生成是“受约束的挑选”：输入题干、学科、题型，输出从该学科标签库候选项中命中的标签 ID/名称，并对每个维度遵守单选/多选约束。模型不得创造标签库以外的标签。建议采用结构化输出（JSON），由前端映射回标签库。"),
)
children.push(h3("8.4.1 输入上下文"))
children.push(
  bullet("题目题干（必填，含公式原文）、学科、题型、难度。"),
  bullet("该学科标签库的候选项：各维度下的标签清单（名称 + ID）。"),
)
children.push(h3("8.4.2 Prompt 模板（建议）"))
children.push(
  new Paragraph({
    spacing: { after: 160, line: 300 },
    shading: { type: ShadingType.CLEAR, fill: SOFT },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
      left: { style: BorderStyle.SINGLE, size: 12, color: BRAND },
      right: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
    },
    children: [
      new TextRun({
        text:
          "你是一名 K12 学科教研专家。请根据给定题目，从“候选标签库”中为题目挑选最贴切的标注。\n\n" +
          "【题目信息】\n学科：{{subject}}\n题型：{{type}}\n难度：{{difficulty}}\n题干：{{stem}}\n\n" +
          "【候选标签库】（只能从下列各维度的候选项中挑选，不得新增）\n" +
          "知识点（可多选）：{{knowledgePoints}}\n" +
          "核心素养（可多选）：{{literacy}}\n" +
          "认知层级（单选）：{{cognitive}}\n" +
          "情境属性（单选）：{{scene}}\n" +
          "内容领域（可多选）：{{contentDomain}}\n\n" +
          "【要求】\n" +
          "1. 严格只从候选项中选择，不得创造候选库以外的标签；\n" +
          "2. 认知层级、情境属性各只选 1 个；其余维度按相关度选 1~3 个，无合适项可为空；\n" +
          "3. 依据题干的知识与能力要求判断，避免过度标注；\n" +
          "4. 仅输出 JSON，结构如下：\n" +
          '{ "knowledgePointIds": [], "literacy": [], "cognitive": "", "scene": "", "contentDomain": [] }',
        font: "Consolas",
        size: 18,
        color: INK,
      }),
    ],
  }),
)
children.push(h3("8.4.3 输出与回填"))
children.push(
  bullet("模型返回结构化 JSON；前端按 ID/名称映射回标签库，自动勾选对应维度的标签。"),
  bullet("生成结果以“建议”呈现，人工可增删调整后再保存；toast 提示“AI 已生成标注建议，可在此基础上手动调整”。"),
)

children.push(h2("8.5 " + T_INTERACT))
children.push(
  bullet("点击“AI 生成标注”：题干为空时提示“请先填写题干”；否则进入生成中状态（按钮 loading）。"),
  bullet("生成完成后，各维度命中标签自动选中（多选维度显示“已选 N”）。"),
  bullet("人工可继续在各维度增删标签；保存时以最终人工确认的标注为准。"),
)

children.push(h2("8.6 " + T_DATA))
children.push(
  bulletKV("输入", "题干、学科、题型、难度 + 该学科标签库候选项。"),
  bulletKV("处理", "调用模型生成结构化标注建议 → 校验约束（单/多选、是否在候选库内）→ 映射回标签库。"),
  bulletKV("输出", "自动勾选的各维度标签（建议态），随题目一并保存。"),
)

children.push(h2("8.7 " + T_RULE))
children.push(
  bullet("标签必须来自标签库，AI 不得生成库外标签；维度固定、按学科区分。"),
  bullet("单选维度（认知层级、情境属性）最多 1 个；多选维度按相关度控制数量。"),
  bullet("AI 结果为建议，最终以人工确认为准；标注口径统一以支撑后续统计与检索。"),
)


const doc = new Document({
  creator: "点这笔",
  title: "资源中心-题库需求文档",
  styles: {
    default: {
      document: { run: { font: FONT, size: 21, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } },
      },
      children,
    },
  ],
})

fs.mkdirSync(path.dirname(OUT), { recursive: true })
const buf = await Packer.toBuffer(doc)
fs.writeFileSync(OUT, buf)
console.log("已生成", OUT, "段落数", children.length)
