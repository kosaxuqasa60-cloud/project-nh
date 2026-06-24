"use client"

import { ResourceListView } from "@/components/admin/resource-list-view"

export default function MicrolessonsPage() {
  return (
    <ResourceListView
      kind="microlesson"
      title="微课"
      description="管理平台微课视频资源，按市/区/校级别授权，可批量改级别与挂载到教材章节。"
    />
  )
}
