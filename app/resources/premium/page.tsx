"use client"

import { ResourceListView } from "@/components/admin/resource-list-view"

export default function PremiumPage() {
  return (
    <ResourceListView
      kind="premium"
      title="精品资源"
      description="平台精选的精品试卷、专题资源与课件，独立成类，可赋予市/区/校级别授权范围。"
    />
  )
}
