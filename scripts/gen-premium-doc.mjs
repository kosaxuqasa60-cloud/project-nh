// 生成《资源中心-精品资源（专题）需求文档》.docx
import {
  cover, build, h1, h2, h3, p, bullet, bulletKV, table, img, caption,
  spacer, pageBreak, T_REQ, T_PAGE, T_INTERACT, T_DATA, T_RULE,
} from "./doc-helpers.mjs"

const c = []

cover(c, {
  title: "精品资源（专题）",
  sub: "需求文档",
  moduleLabel: "资源中心 / 精品资源 / 专题",
  name: "《资源中心-精品资源（专题）需求文档》",
})

// ============ 1. 文档概述 ============
c.push(h1("一、文档概述"))

c.push(h2("1.1 文档目的"))
c.push(
  p(
    "本文档面向 UI 设计、前端、后端及测试人员，完整描述「资源中心 - 精品资源」中「专题」类型资源的产品需求、页面结构、交互规则、数据流转与业务规则，作为设计、研发与验收的统一依据。",
  ),
)

c.push(h2("1.2 模块定位"))
c.push(
  p(
    "精品资源是平台沉淀的高质量结构化教学资源库，按资源形态分为「专题」「试卷」「课件」等类别。其中「专题」是围绕某一知识主题（如「比和比例应用」）组织的结构化题目包：以有序「板块」承载教学内容，板块内含「补充知识」文本块与「题目」两类条目，题目支持多题型、答案、解析与配套讲解视频。",
  ),
)
c.push(
  p(
    "专题创建后可由教师在「教师端预览」中以类 PDF 的完整阅读版查看并下发；学生在「移动端预览」中以逐题作答的方式完成练习，作答后即时获得判分、解析与讲解视频。",
  ),
)

c.push(h2("1.3 名词术语"))
c.push(
  table(
    ["术语", "说明"],
    [
      ["专题", "精品资源的一种类别，围绕某知识主题组织的结构化题目包，由若干有序板块构成。"],
      ["板块（Section）", "专题内的一级内容分组，如「补充知识」「自学例题」「自我检测」「巩固练习」「阶段练习」，可排序、增删。"],
      ["条目（Item）", "板块内的最小内容单元，分「文本块」与「题目」两类。"],
      ["文本块（Text Item）", "用于承载补充知识、自我归纳等非作答性讲解内容。"],
      ["题目（Question Item）", "可作答的题目条目，含题型、题干、选项 / 答案、解析与讲解视频。"],
      ["题型", "单选、多选、填空、判断、解答题五类。"],
      ["授权范围 / 级别", "资源的可见与归属范围，分平台、城市、区、校等层级。"],
      ["章节挂载", "将资源关联到具体教材章节目录，便于按教材结构检索。"],
    ],
    [22, 78],
  ),
)

// ============ 2. 信息架构 ============
c.push(h1("二、信息架构与数据模型"))

c.push(h2("2.1 模块结构"))
c.push(p("精品资源（专题）在资源中心下的层级关系如下："))
c.push(bullet("资源中心 → 精品资源 → 专题列表（默认页）"))
c.push(bullet("专题列表 → 新建专题 / 编辑专题（专题编辑器）"))
c.push(bullet("专题列表 / 编辑器 → 教师端预览（阅读版，可下发）"))
c.push(bullet("教师端预览 → 移动端预览（学生逐题作答版）"))

c.push(h2("2.2 核心数据模型"))
c.push(p("专题（Premium，category=special）的主要字段："))
c.push(
  table(
    ["字段", "类型", "说明"],
    [
      ["id", "string", "专题唯一标识"],
      ["title", "string", "专题标题"],
      ["subject", "string", "所属学科"],
      ["category", "枚举", "资源类别，专题固定为 special"],
      ["level", "枚举", "授权级别：平台 / 城市 / 区 / 校"],
      ["ownerScope", "string", "归属范围名称，如「上海市」「徐汇区第一中心小学」"],
      ["coverImage", "string?", "专题封面图（模拟上传）"],
      ["sections", "TopicSection[]", "有序板块数组"],
      ["usedCount", "number?", "使用 / 引用次数"],
      ["updatedAt", "string", "更新日期"],
    ],
    [22, 22, 56],
  ),
)
c.push(spacer())
c.push(p("板块（TopicSection）与条目（TopicItem）："))
c.push(
  table(
    ["字段", "类型", "说明"],
    [
      ["section.id", "string", "板块标识"],
      ["section.title", "string", "板块标题，如「自我检测」"],
      ["section.items", "TopicItem[]", "板块下有序条目数组"],
      ["item.type", "'text' | 'question'", "条目类型：文本块 / 题目"],
      ["text.title / content", "string", "文本块标题与正文"],
      ["question.qType", "枚举", "题型：single/multi/fill/judge/subjective"],
      ["question.stem", "string", "题干"],
      ["question.options", "TopicOption[]", "选择题选项（含 correct 标记）"],
      ["question.answer", "string?", "填空 / 判断 / 解答的参考答案"],
      ["question.analysis", "string?", "解析"],
      ["question.video", "TopicVideo?", "讲解视频：标题 / 文件 / 时长"],
    ],
    [26, 26, 48],
  ),
)

// ============ 3. 专题列表 ============
c.push(pageBreak())
c.push(h1("三、专题列表页"))

c.push(h2("3.1 " + T_REQ))
c.push(p("作为精品资源「专题」的默认入口，以卡片形式概览全部专题，支持检索、筛选、新建与进入编辑 / 预览。"))
c.push(bullet("展示每个专题的封面、标题、学科、授权范围、板块数 / 题目数 / 视频数等结构化统计。"))
c.push(bullet("提供「新建专题」入口；每张卡片提供「预览」（教师端）与「编辑」两个操作。"))
c.push(bullet("支持按标题关键字搜索，按学科 / 授权级别筛选。"))

c.push(h2("3.2 " + T_PAGE))
c.push(img("p01-topic-list.png"))
c.push(caption("图 3-1 精品资源 - 专题列表页"))
c.push(p("页面顶部为标题与「新建专题」按钮，下方为搜索 / 筛选条，主体为专题卡片网格。每张卡片包含："))
c.push(bullet("封面缩略图与专题标题；"))
c.push(bullet("学科、授权范围（如「平台」「上海市」）标签；"))
c.push(bullet("板块 / 题目 / 视频数量统计；"))
c.push(bullet("使用量与更新日期；"))
c.push(bullet("「预览」「编辑」操作按钮。"))

c.push(h2("3.3 " + T_INTERACT))
c.push(bulletKV("新建专题", "点击后进入空白专题编辑器，默认创建一个板块。"))
c.push(bulletKV("预览", "跳转至该专题的教师端预览页（阅读版）。"))
c.push(bulletKV("编辑", "跳转至专题编辑器，载入该专题全部板块与条目。"))
c.push(bulletKV("搜索", "按标题实时过滤卡片；无结果时展示空态。"))
c.push(bulletKV("筛选", "学科 / 级别多条件叠加过滤。"))

c.push(h2("3.4 " + T_RULE))
c.push(bullet("卡片统计数（板块 / 题目 / 视频）由该专题 sections 实时聚合得出。"))
c.push(bullet("删除专题需二次确认，删除后从列表移除且不可恢复（演示态为前端状态）。"))

// ============ 4. 专题编辑器 ============
c.push(pageBreak())
c.push(h1("四、专题编辑器（新建 / 编辑）"))

c.push(h2("4.1 " + T_REQ))
c.push(p("用于录入与维护专题的全部内容，包括基本信息、封面、板块与条目（文本块 / 题目）。"))
c.push(bullet("基本信息：标题、学科、授权范围（级别 + 归属）、封面图。"))
c.push(bullet("板块管理：增加 / 删除板块，板块上下排序，编辑板块标题。"))
c.push(bullet("条目管理：在板块内添加「文本块」或「题目」，可排序、删除。"))
c.push(bullet("题目录入：选择题型，按题型动态录入选项 / 答案，填写解析与讲解视频。"))
c.push(bullet("顶部提供「预览与下发」入口与「保存」。"))

c.push(h2("4.2 " + T_PAGE + "：基本信息与板块"))
c.push(img("p02-editor-basic.png"))
c.push(caption("图 4-1 专题编辑器 - 基本信息与板块结构"))
c.push(p("页面顶栏含返回、标题、预览与下发、保存按钮。主体自上而下为：基本信息区（标题 / 学科 / 授权范围 / 封面图）、板块列表。每个板块为可折叠分组，含板块标题输入、排序与删除操作、以及条目列表。"))

c.push(h2("4.3 " + T_PAGE + "：题目录入"))
c.push(img("p03-editor-question.png"))
c.push(caption("图 4-2 专题编辑器 - 题目条目与题型 / 选项录入"))
c.push(p("题目条目包含："))
c.push(bullet("题型选择器：单选 / 多选 / 填空 / 判断 / 解答题；"))
c.push(bullet("题目编号（label）与题干（stem）；"))
c.push(bullet("选择题（单选 / 多选）：选项编辑器，可增删选项并勾选正确答案；"))
c.push(bullet("填空 / 解答：文本参考答案；判断题：对 / 错；"))
c.push(bullet("解析（analysis）输入框。"))

c.push(h2("4.4 " + T_PAGE + "：讲解视频（模拟上传）"))
c.push(img("p04-editor-video.png"))
c.push(caption("图 4-3 专题编辑器 - 讲解视频上传与标题 / 时长"))
c.push(p("每道题可附一段讲解视频，支持前端模拟上传：选择文件后展示文件名，并可填写视频标题与时长，支持更换 / 移除。"))

c.push(h2("4.5 " + T_INTERACT))
c.push(bulletKV("题型切换", "切换题型后表单动态变化：选到单选 / 多选展示选项编辑器，其余题型展示文本答案 / 对错。"))
c.push(bulletKV("选项管理", "单选 / 多选可增删选项；单选仅允许一个正确项，多选允许多个。"))
c.push(bulletKV("板块 / 条目排序", "通过上下移动调整顺序，顺序即学生端与预览端的呈现顺序。"))
c.push(bulletKV("封面 / 视频上传", "前端模拟上传，选取后本地预览 / 显示文件名（演示态不落地存储）。"))
c.push(bulletKV("保存", "校验标题非空后写入，返回列表并提示成功。"))

c.push(h2("4.6 " + T_DATA))
c.push(bullet("新建：createTopic 生成 id 并写入 sections / 封面 / 归属，usedCount 初始为 0。"))
c.push(bullet("编辑：updateTopic 按 id 局部覆盖，更新 updatedAt。"))
c.push(bullet("题型与选项随题目条目一起存入对应 section.items。"))

c.push(h2("4.7 " + T_RULE))
c.push(bullet("标题为必填项，未填写不可保存。"))
c.push(bullet("单选题正确项有且仅有一个；多选题至少一个正确项。"))
c.push(bullet("讲解视频固定为「学生作答后解锁」，无需单独开关配置。"))

// ============ 5. 教师端预览 ============
c.push(pageBreak())
c.push(h1("五、教师端预览（阅读版）"))

c.push(h2("5.1 " + T_REQ))
c.push(p("供教师以类 PDF 的完整阅读版查看专题全文，含答案、解析与讲解视频，并可一键下发给班级。"))

c.push(h2("5.2 " + T_PAGE))
c.push(img("p05-teacher-preview.png"))
c.push(caption("图 5-1 教师端预览 - 完整阅读版"))
c.push(p("页面顶栏含返回、移动端预览、编辑、下发按钮。主体按板块顺序渲染："))
c.push(bullet("专题标题、学科、授权范围等元信息；"))
c.push(bullet("文本块以知识讲解形式直接呈现；"))
c.push(bullet("题目展示题型标签、题干、选项（正确项高亮）、参考答案、解析；"))
c.push(bullet("每题的讲解视频以可点击卡片形式展示（标题 + 时长）。"))

c.push(h2("5.3 " + T_INTERACT))
c.push(bulletKV("移动端预览", "切换到学生手机端作答视图。"))
c.push(bulletKV("编辑", "返回专题编辑器修改内容。"))
c.push(bulletKV("下发", "选择班级与截止时间后下发该专题（演示态为模拟提交）。"))

c.push(h2("5.4 " + T_RULE))
c.push(bullet("教师端为只读阅读视图，所有答案与解析默认可见，便于备课与讲评。"))
c.push(bullet("选择题正确选项以高亮 / 对勾标识。"))

// ============ 6. 移动端预览 ============
c.push(pageBreak())
c.push(h1("六、移动端预览（学生逐题作答）"))

c.push(h2("6.1 " + T_REQ))
c.push(p("以手机框模拟学生端作答体验。专题全部板块条目被摊平为有序步骤，学生逐题（或逐知识块）推进，作答后即时判分并解锁解析与讲解视频。"))

c.push(h2("6.2 " + T_PAGE + "：逐题作答"))
c.push(img("p06-mobile-question.png"))
c.push(caption("图 6-1 移动端预览 - 逐题作答"))
c.push(p("顶部为进度指示（如 7/16），中部为当前步骤内容：文本块以知识卡呈现；题目展示题型标签、题干与作答控件（单选 / 多选点选、填空 / 解答输入、判断对错）。底部为「上一步 / 下一题」导航与「提交答案」。"))

c.push(h2("6.3 " + T_PAGE + "：作答反馈与视频解锁"))
c.push(img("p07-mobile-result.png"))
c.push(caption("图 6-2 移动端预览 - 提交后判分、解析与解锁视频"))
c.push(p("提交后即时判分：正确项 / 错误项高亮，展示「回答正确 / 错误」、参考答案与解析，并解锁该题讲解视频；可「重做本题」。"))

c.push(h2("6.4 " + T_INTERACT))
c.push(bulletKV("作答控件", "单选单选、多选多选；填空 / 解答文本输入；判断选择对 / 错。"))
c.push(bulletKV("提交答案", "未作答时按钮禁用；提交后锁定本题作答并展示反馈。"))
c.push(bulletKV("逐题导航", "上一步 / 下一题切换，文本块作为独立步骤参与推进。"))
c.push(bulletKV("重做本题", "清空本题作答与反馈，重新作答。"))

c.push(h2("6.5 " + T_RULE))
c.push(bullet("判分逻辑：单选 / 多选比对正确项集合；判断比对对错；填空 / 解答比对参考答案（演示态为文本比对）。"))
c.push(bullet("讲解视频在本题提交后解锁，未作答前不展示视频入口。"))
c.push(bullet("文本块（补充知识）不需作答，作为阅读步骤直接展示。"))

await build(c, {
  out: "docs/《资源中心-精品资源（专题）需求文档》.docx",
  title: "资源中心-精品资源（专题）需求文档",
})
