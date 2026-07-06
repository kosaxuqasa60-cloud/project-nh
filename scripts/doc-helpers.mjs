// 需求文档生成 - 共享辅助模块
// 提供与《资源中心-题库需求文档》一致的样式（主题色、标题、表格、图片、列表等）
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

export const ASSETS = "docs/assets"

// —— 主题色（与题库文档保持一致）——
export const BRAND = "2E7D54" // 品牌绿
export const INK = "1F2937" // 正文深灰
export const MUTED = "6B7280" // 次要灰
export const LINE = "D1D5DB" // 边框
export const SOFT = "EAF3EC" // 浅绿底
export const HEADBG = "2E7D54" // 表头底
export const FONT = "Microsoft YaHei"

// 图片统一渲染宽度
const IMG_W = 560

// 读取 PNG 实际尺寸（IHDR：宽在字节 16-20，高在 20-24），按宽度等比缩放
function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

export function img(file) {
  const p = path.join(ASSETS, file)
  const data = fs.readFileSync(p)
  const { w, h } = pngSize(data)
  const width = IMG_W
  const height = Math.round((IMG_W * h) / w)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [
      new ImageRun({
        data,
        transformation: { width, height },
        outline: { type: "solidFill", solidFillType: "rgb", value: LINE, width: 6350 },
      }),
    ],
  })
}

export function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, size: 18, color: MUTED, italics: true })],
  })
}

export function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: BRAND })],
  })
}

export function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: INK })],
  })
}

export function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 21, bold: true, color: BRAND })],
  })
}

export function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320 },
    children: [new TextRun({ text, font: FONT, size: 21, color: INK, ...opts })],
  })
}

export function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 21, color: INK })],
  })
}

export function bulletKV(key, val) {
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

export function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE }
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hh, i) => cell(hh, { header: true, bg: HEADBG, width: widths?.[i] })),
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

export function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] })
}

export function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

// 等宽代码 / Prompt 框
export function codeBox(text) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    shading: { type: ShadingType.CLEAR, fill: SOFT },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
      left: { style: BorderStyle.SINGLE, size: 12, color: BRAND },
      right: { style: BorderStyle.SINGLE, size: 4, color: BRAND },
    },
    children: [new TextRun({ text, font: "Consolas", size: 18, color: INK })],
  })
}

// 固定小节标题
export const T_REQ = "核心需求说明"
export const T_PAGE = "页面说明"
export const T_INTERACT = "页面交互规则"
export const T_DATA = "数据流转"
export const T_RULE = "业务规则"

// 封面 + 文档信息表 + 目录
export function cover(children, { title, sub, moduleLabel, name }) {
  children.push(
    new Paragraph({ spacing: { before: 1800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "点这笔 · 资源后台管理", font: FONT, size: 28, color: BRAND, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: title, font: FONT, size: 56, bold: true, color: INK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: sub ?? "需求文档", font: FONT, size: 40, bold: true, color: MUTED })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [] }),
    table(
      ["文档项", "内容"],
      [
        ["文档名称", name],
        ["产品模块", moduleLabel],
        ["文档版本", "V1.0"],
        ["面向对象", "UI 设计、前端开发、后端开发、测试"],
        ["文档状态", "评审稿"],
        ["更新日期", new Date().toISOString().slice(0, 10)],
      ],
      [30, 70],
    ),
    pageBreak(),
    h1("目录"),
    new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
    pageBreak(),
  )
}

export async function build(children, { out, title }) {
  const doc = new Document({
    creator: "点这笔",
    title,
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
        children,
      },
    ],
  })
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const buf = await Packer.toBuffer(doc)
  fs.writeFileSync(out, buf)
  console.log("已生成", out, "段落数", children.length)
}
