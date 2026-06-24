import { redirect } from "next/navigation"

// 资源中心已拆分为左侧二级菜单的独立页面，默认进入题库
export default function ResourceCenterPage() {
  redirect("/resources/questions")
}
