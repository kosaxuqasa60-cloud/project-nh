// 生成「题目导入模板.xlsx」：含「导入说明」与「题目数据」两个工作表
// 运行：node scripts/gen-question-template.mjs
import ExcelJS from "exceljs"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

const OUT = "public/templates/question-import-template.xlsx"
mkdirSync(dirname(OUT), { recursive: true })

const wb = new ExcelJS.Workbook()
wb.creator = "点这笔"
wb.created = new Date()

const BRAND = "FF2563EB"
const SOFT = "FFEFF4FF"
const HEAD = "FF1E3A8A"

/* ----------------------------- 工作表1：导入说明 ----------------------------- */
const guide = wb.addWorksheet("导入说明", {
  properties: { defaultColWidth: 22 },
  views: [{ showGridLines: false }],
})
guide.getColumn(1).width = 16
guide.getColumn(2).width = 86

function titleRow(text) {
  const r = guide.addRow([text, ""])
  guide.mergeCells(`A${r.number}:B${r.number}`)
  const c = r.getCell(1)
  c.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEAD } }
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  r.height = 30
  return r
}
function kv(k, v) {
  const r = guide.addRow([k, v])
  r.getCell(1).font = { bold: true, color: { argb: HEAD } }
  r.getCell(1).alignment = { vertical: "top", horizontal: "right" }
  r.getCell(2).alignment = { vertical: "top", horizontal: "left", wrapText: true }
  r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } }
  return r
}
function note(text) {
  const r = guide.addRow(["", text])
  r.getCell(2).alignment = { vertical: "top", horizontal: "left", wrapText: true }
  r.getCell(2).font = { color: { argb: "FF374151" } }
  return r
}

titleRow("题目批量导入说明（请认真阅读后再填写「题目数据」工作表）")
guide.addRow([])
kv("适用范围", "本模板用于向「点这笔」题库批量导入题目。一行一道题，从「题目数据」表第 2 行开始填写，表头行请勿修改或删除。")
kv("填写流程", "① 在「题目数据」表按列填写 → ② 保存为 .xlsx → ③ 在题库点击「文件导入」上传 → ④ 逐题确认授权范围与章节后入库。")
guide.addRow([])

titleRow("各列填写规范")
kv("题型 *", "必填。可选值（须完全一致）：单选题 / 多选题 / 填空题 / 判断题 / 解答题。")
kv("题干 *", "必填。题目正文。数学公式用美元符号包裹，如：计算 $(-3)+5$ 的值。")
kv("选项A~D", "选择题（单选/多选）必填至少 2 个选项；非选择题留空即可。每个选项也支持 $...$ 公式。")
kv("答案 *", "必填。单选填选项字母，如 A；多选用逗号分隔，如 A,C；判断题填 正确 或 错误；填空/解答题直接填答案文本或公式。")
kv("解析", "选填。解题过程或思路说明，支持 $...$ 公式。")
kv("难度 *", "必填。填 1~5 的整数。1-2＝易，3＝中，4-5＝难。")
kv("知识点", "选填。多个知识点用中文顿号「、」或英文逗号分隔，如：有理数、绝对值。")
kv("章节", "选填。填写要挂载的章节名称；留空可在导入确认时再统一选择。")
guide.addRow([])

titleRow("注意事项")
note("1. 带 * 的列为必填，缺失的行将被标记为无法导入。")
note("2. 公式统一使用 $...$ 包裹（行内公式），例如 $x^2+1$、$\\frac{1}{2}$。")
note("3. 单文件建议不超过 500 道题；超大文件请拆分多次导入。")
note("4. 「导入说明」工作表仅供阅读，系统只读取「题目数据」工作表的内容。")
note("5. 导入为演示流程：上传后可逐题预览、编辑、删除，确认无误再批量入库。")

/* ----------------------------- 工作表2：题目数据 ----------------------------- */
const ws = wb.addWorksheet("题目数据", { views: [{ state: "frozen", ySplit: 1 }] })
const headers = [
  "题型 *",
  "题干 *",
  "选项A",
  "选项B",
  "选项C",
  "选项D",
  "答案 *",
  "解析",
  "难度 *",
  "知识点",
  "章节",
]
const widths = [10, 46, 16, 16, 16, 16, 12, 40, 8, 20, 22]
ws.columns = headers.map((h, i) => ({ header: h, width: widths[i] }))

const headerRow = ws.getRow(1)
headerRow.height = 24
headerRow.eachCell((cell) => {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } }
  cell.alignment = { vertical: "middle", horizontal: "center" }
  cell.border = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  }
})

// 示例行（演示各题型填法）
const samples = [
  ["单选题", "下列各数中，是负数的是（　）。", "$-3$", "$0$", "$2.5$", "$|-1|$", "A", "负数是小于 0 的数，$-3<0$，故选 A。", 2, "有理数、绝对值", "1.1 正数和负数"],
  ["多选题", "下列属于无理数的有（　）。", "$\\pi$", "$\\sqrt{2}$", "$0.5$", "$\\frac{1}{3}$", "A,B", "无限不循环小数为无理数。", 3, "实数", "2.3 实数"],
  ["填空题", "计算：$(-7)+(+3)-(-5)=$ ______", "", "", "", "", "$1$", "原式 $=-7+3+5=1$。", 2, "有理数运算", "1.4 有理数的加减"],
  ["判断题", "若 $a>0$，则 $-a<0$。（　）", "", "", "", "", "正确", "正数的相反数为负数。", 1, "相反数", "1.2 相反数"],
  ["解答题", "已知 $|x|=5$，求 $x$ 的值，并在数轴上表示。", "", "", "", "", "$x=5$ 或 $x=-5$", "绝对值为 5 的数有两个，关于原点对称。", 3, "绝对值、数轴", "1.2 数轴"],
]
samples.forEach((row) => {
  const r = ws.addRow(row)
  r.alignment = { vertical: "top", wrapText: true }
  r.getCell(9).alignment = { vertical: "top", horizontal: "center" }
  r.eachCell((cell) => {
    cell.border = {
      top: { style: "hair", color: { argb: "FFE5E7EB" } },
      left: { style: "hair", color: { argb: "FFE5E7EB" } },
      bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
      right: { style: "hair", color: { argb: "FFE5E7EB" } },
    }
  })
})

// 题型下拉校验 + 难度校验（前 200 行）
for (let i = 2; i <= 200; i++) {
  ws.getCell(`A${i}`).dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: ['"单选题,多选题,填空题,判断题,解答题"'],
  }
  ws.getCell(`I${i}`).dataValidation = {
    type: "whole",
    operator: "between",
    allowBlank: true,
    formulae: [1, 5],
  }
}

await wb.xlsx.writeFile(OUT)
console.log("[v0] 模板已生成:", OUT)
