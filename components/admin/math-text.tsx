import katex from "katex"

function renderTex(tex: string, display = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: display })
}

/** 行内公式：<Math tex="x > 2" /> */
export function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  return (
    <span
      className="katex-host"
      dangerouslySetInnerHTML={{ __html: renderTex(tex, display) }}
    />
  )
}

/**
 * 富文本：解析字符串中的 $...$ 片段为公式，其余按纯文本输出。
 * 题干 / 答案 / 解析统一用它渲染，既保持 string 数据模型，又能显示数学公式。
 */
export function MathText({ children, className }: { children: string; className?: string }) {
  if (!children) return null
  const parts = children.split(/(\$[^$]+\$)/g)
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <span
              key={i}
              className="katex-host"
              dangerouslySetInnerHTML={{ __html: renderTex(part.slice(1, -1)) }}
            />
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
