// 生成《资源中心-标签字典需求文档》.docx
import {
  cover, build, h1, h2, h3, p, bullet, bulletKV, table, img, caption,
  spacer, pageBreak, codeBox, T_REQ, T_PAGE, T_INTERACT, T_DATA, T_RULE,
} from "./doc-helpers.mjs"

const c = []

cover(c, {
  title: "标签字典",
  sub: "需求文档",
  moduleLabel: "资源中心 / 标签字典",
  name: "《资源中心-标签字典需求文档》",
})

// ============ 1. 文档概述 ============
c.push(h1("一、文档概述"))

c.push(h2("1.1 文档目的"))
c.push(
  p(
    "本文档面向 UI 设计、前端、后端及测试人员，完整描述「资源中心 - 标签字典」模块的产品需求、页面结构、交互规则、数据流转与业务规则，重点阐明标签的「维度 - 学科 - 作用域」三层组织方式及作用域继承与停用机制，作为设计、研发与验收的统一依据。",
  ),
)

c.push(h2("1.2 模块定位"))
c.push(
  p(
    "标签字典是全平台题目 / 资源标注体系的基础数据中心。它统一管理用于标注的各类「维度」（如难度、学习水平、内容领域、核心素养、情境属性、教学用途）及其下的具体「标签值」，供题库等模块在标注时调用。",
  ),
)
c.push(
  p(
    "字典采用「平台基准 + 区域专属」的分级治理：平台统一维护一套基准标签，各级区域（市 / 区 / 校）可在继承基准的基础上新增本级专属标签，或停用对本级不适用的基准标签，从而实现「全平台统一 + 区域差异化」的平衡。",
  ),
)

c.push(h2("1.3 名词术语"))
c.push(
  table(
    ["术语", "说明"],
    [
      ["维度（Dimension）", "标注的分类角度，如难度、核心素养。维度决定其下标签在标注时是单选还是多选、是否按学科区分。"],
      ["标签 / 标签值（Tag Item）", "某维度下的一条具体字典值，如核心素养下的「数学运算」。"],
      ["作用域（Scope）", "标签的归属层级：平台基准（base）或具体机构名（市 / 区 / 校）。"],
      ["平台基准", "全平台共享的基准标签集合，作用域为 base。"],
      ["区域专属", "某机构在本级新增的标签，仅本级及其下级继承可见。"],
      ["继承链", "从平台基准到目标机构的作用域链：[base, 市, 区, 校]。"],
      ["停用（Disable）", "区域对继承到的基准 / 上级标签做隐藏覆盖，不删除原标签。"],
      ["按学科区分", "维度属性；为真时标签按学科各自维护，为假则归入「通用」学科全学科共享。"],
      ["难度档位（tier）", "难度维度特有的固定档位 1~5。"],
    ],
    [22, 78],
  ),
)

// ============ 2. 信息架构与数据模型 ============
c.push(h1("二、信息架构与数据模型"))

c.push(h2("2.1 三层组织模型"))
c.push(p("标签字典以「维度 × 学科 × 作用域」三个正交维度组织："))
c.push(bulletKV("维度", "决定标注角度与选择方式（单选 / 多选）；分内置维度与自定义维度。"))
c.push(bulletKV("学科", "当维度「按学科区分」时，标签按学科各自维护；否则归入「通用（全学科）」。"))
c.push(bulletKV("作用域", "标签归属平台基准或某机构；区域沿继承链可见上级标签。"))

c.push(h2("2.2 维度（TagDimensionMeta）"))
c.push(
  table(
    ["字段", "类型", "说明"],
    [
      ["key", "string", "维度唯一键"],
      ["label", "string", "维度名称，如「难度」「核心素养」"],
      ["select", "'single' | 'multiple'", "标注时单选 / 多选"],
      ["bySubject", "boolean", "是否按学科区分（false 归入通用学科）"],
      ["builtin", "boolean", "是否内置维度（内置与自定义均可改名 / 删除）"],
      ["desc", "string", "维度说明"],
    ],
    [24, 30, 46],
  ),
)
c.push(spacer())
c.push(p("内置维度种子："))
c.push(
  table(
    ["维度", "选择", "按学科", "说明"],
    [
      ["难度", "单选", "否", "难度档位（1~5 固定档位，tier）"],
      ["学习水平", "单选", "否", "认知 / 学习层级，如记忆、理解、应用"],
      ["内容领域", "多选", "是", "学科内容板块划分"],
      ["核心素养", "多选", "是", "学科核心素养标签"],
      ["情境属性", "单选", "是", "题目情境类型"],
      ["教学用途", "多选", "是", "题目的教学使用场景"],
    ],
    [20, 16, 16, 48],
  ),
)

c.push(h2("2.3 标签项（TagItem）与停用（TagDisable）"))
c.push(
  table(
    ["字段", "类型", "说明"],
    [
      ["item.id", "string", "标签唯一标识"],
      ["item.dimensionKey", "string", "所属维度"],
      ["item.subject", "string", "所属学科（通用维度用「通用」）"],
      ["item.name", "string", "标签名称"],
      ["item.order", "number", "同维度内排序值"],
      ["item.scope", "string", "作用域：base 或机构名"],
      ["item.tier", "number?", "难度专用固定档位 1~5"],
      ["disable.tagId", "string", "被停用的基准 / 上级标签 id"],
      ["disable.scope", "string", "在该机构下停用"],
    ],
    [26, 22, 52],
  ),
)

c.push(h2("2.4 作用域继承与解析算法"))
c.push(p("给定机构，其继承链由 tagScopeChain 计算，自平台基准向下逐级展开："))
c.push(codeBox("tagScopeChain(\"徐汇区\") = [base, 上海市, 徐汇区]"))
c.push(p("某维度在「某学科 + 某机构」下最终可用标签的解析规则（resolveTagOptions）："))
c.push(bullet("取该维度的全部标签项；"))
c.push(bullet("若维度按学科区分，仅保留与目标学科一致的标签；"))
c.push(bullet("仅保留作用域落在继承链上的标签（基准 + 链上各级专属）；"))
c.push(bullet("减去继承链上任意一级被停用的标签；"))
c.push(bullet("按 order 升序排序后返回。"))

// ============ 3. 标签字典主页 ============
c.push(pageBreak())
c.push(h1("三、标签字典主页"))

c.push(h2("3.1 " + T_REQ))
c.push(p("作为标签字典的统一管理入口，按「作用域 + 学科 + 维度」上下文浏览与维护标签，并管理维度本身。"))
c.push(bullet("顶部提供作用域选择（平台基准 / 市 / 区 / 校）与学科选择（含「通用（全学科）」）。"))
c.push(bullet("以维度为分组分别展示其下标签值，支持新增标签、新增维度。"))
c.push(bullet("难度维度以固定档位（1~5）特殊呈现。"))

c.push(h2("3.2 " + T_PAGE + "：通用（全学科）视图"))
c.push(img("t01-universal.png"))
c.push(caption("图 3-1 标签字典 - 通用（全学科）视图与难度档位"))
c.push(p("默认进入「平台基准 + 通用（全学科）」上下文。通用维度（难度、学习水平）在此维护，全学科共享。难度维度以 1~5 档位卡片呈现，支持新增档位、改名、排序。"))

c.push(h2("3.3 " + T_PAGE + "：按学科维度"))
c.push(img("t02-subject.png"))
c.push(caption("图 3-2 标签字典 - 按学科维度（数学 / 核心素养）"))
c.push(p("切换学科后，「按学科区分」的维度（内容领域、核心素养、情境属性、教学用途）展示该学科下的标签集合，可独立维护。"))

c.push(h2("3.4 " + T_PAGE + "：作用域继承与停用"))
c.push(img("t03-scope.png"))
c.push(caption("图 3-3 标签字典 - 区域作用域下的继承标签与停用机制"))
c.push(p("切换到具体区域（如徐汇区）后，页面同时呈现："))
c.push(bullet("继承自平台基准 / 上级的标签（标注来源，可对本级停用）；"))
c.push(bullet("本级新增的区域专属标签（可编辑 / 删除）。"))
c.push(p("停用仅对本级及下级隐藏该标签，不影响平台基准本身，可随时恢复。"))

c.push(h2("3.5 " + T_PAGE + "：新增标签"))
c.push(img("t04-add-tag.png"))
c.push(caption("图 3-4 新增标签弹窗"))
c.push(p("在当前「维度 + 学科 + 作用域」上下文中新增一条标签值；弹窗提示该标签将归属当前作用域（平台基准或某机构本级专属）。"))

c.push(h2("3.6 " + T_PAGE + "：新增维度"))
c.push(img("t05-add-dim.png"))
c.push(caption("图 3-5 新增维度弹窗"))
c.push(p("新增自定义维度，设置名称与「是否按学科区分」；自定义维度与内置维度一致，可继续在其下新增标签。"))

c.push(h2("3.7 " + T_INTERACT))
c.push(bulletKV("切换作用域", "在平台基准 / 市 / 区 / 校间切换；区域视图叠加展示继承标签与本级标签。"))
c.push(bulletKV("切换学科", "在「通用（全学科）」与各学科间切换；通用维度不随学科变化。"))
c.push(bulletKV("新增 / 编辑 / 删除标签", "在当前上下文维护标签值；难度维度新增为新增档位。"))
c.push(bulletKV("排序", "同维度内上下移动标签，调整 order。"))
c.push(bulletKV("停用 / 恢复", "区域视图中对继承标签做停用切换；仅影响本级及下级。"))
c.push(bulletKV("新增 / 改名 / 删除维度", "管理维度本身；删除维度连带清理其下标签与停用记录。"))

c.push(h2("3.8 " + T_DATA))
c.push(bullet("维度：addTagDimension / updateTagDimension / removeTagDimension。"))
c.push(bullet("标签：addTagItem / updateTagItem / removeTagItem / reorderTagItem。"))
c.push(bullet("停用：toggleTagDisable(tagId, scope, disabled) 写入 / 移除停用记录。"))
c.push(bullet("解析：resolveTags(dimensionKey, subject, scopeName) 依继承链与停用计算最终可用标签。"))
c.push(bullet("删除维度时连带移除其下标签项及相关停用记录，保证数据一致。"))

c.push(h2("3.9 " + T_RULE))
c.push(bullet("通用维度（bySubject=false）的标签统一归入「通用」学科，全学科共享，不随学科切换变化。"))
c.push(bullet("区域只能新增本级专属标签或停用继承标签，不能直接删除 / 改名平台基准标签。"))
c.push(bullet("停用为「覆盖」而非「删除」：基准标签始终保留，停用可随时恢复。"))
c.push(bullet("继承具有传递性：上级新增的标签自动对下级可见；上级被停用的标签对下级亦不可见。"))
c.push(bullet("难度维度走独立档位（1~5，tier），在标注时与数值难度字段对应，UI 特殊处理。"))
c.push(bullet("维度的 select（单选 / 多选）决定题目标注该维度时可选标签数量。"))

await build(c, {
  out: "docs/《资源中心-标签字典需求文档》.docx",
  title: "资源中心-标签字典需求文档",
})
