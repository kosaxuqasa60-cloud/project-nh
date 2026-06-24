"use client"

import { ResourceListView } from "@/components/admin/resource-list-view"

export default function AirClassesPage() {
  return (
    <ResourceListView
      kind="airclass"
      title="空中课堂"
      description="管理平台空中课堂直播资源，按市/区/校级别授权，可批量改级别与挂载到教材章节。"
    />
  )
}
