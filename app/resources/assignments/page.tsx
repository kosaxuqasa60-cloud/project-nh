"use client"

import { ResourceListView } from "@/components/admin/resource-list-view"

export default function AssignmentsPage() {
  return (
    <ResourceListView
      kind="assignment"
      title="作业"
      description="管理平台作业资源，按市/区/校级别授权，可批量改级别与挂载到教材章节。"
    />
  )
}
